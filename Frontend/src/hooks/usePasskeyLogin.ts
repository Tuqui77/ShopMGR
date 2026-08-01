import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  passkeysService,
  classifyPasskeyError,
  passkeyErrorMessage,
  extractBackendMessage,
  isPublicKeyCredential,
} from '../services/passkeys';

/**
 * Orquesta el login con passkey: opciones -> diálogo nativo del navegador ->
 * verificación en el backend -> setTokens + navegación. La cancelación del
 * diálogo nativo (o el abort propio) es silenciosa; los demás errores se
 * clasifican y exponen como mensaje visible.
 */
export function usePasskeyLogin() {
  const navigate = useNavigate();
  const setTokens = useStore((state) => state.setTokens);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const iniciarConPasskey = useCallback(async () => {
    abortRef.current?.abort();
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const options = await passkeysService.obtenerOpcionesAuth(controller.signal);

      // El backend arma allowCredentials con las credenciales de la BD. Si llega
      // vacío/ausente (p. ej. se eliminó la única passkey), el diálogo nativo no
      // tiene nada que ofrecer y el navegador falla en silencio con NotAllowedError
      // (clasificado como 'canceled'). Mejor avisar al usuario.
      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        setError('No hay passkeys registradas para esta cuenta. Probá con tu contraseña.');
        return;
      }

      const credential = await navigator.credentials.get({ publicKey: options });

      // credential === null: el usuario descartó el diálogo nativo sin elegir.
      if (credential === null) return;

      if (!isPublicKeyCredential(credential)) {
        setError('No se pudo verificar la passkey. Probá de nuevo.');
        return;
      }

      const { accessToken, refreshToken } = await passkeysService.verificarAuth(credential);
      setTokens(accessToken, refreshToken);
      navigate('/');
    } catch (err: unknown) {
      const kind = classifyPasskeyError(err);
      const message = passkeyErrorMessage(kind, extractBackendMessage(err));
      if (message !== null) setError(message);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  }, [navigate, setTokens]);

  return { isLoading, error, iniciarConPasskey };
}
