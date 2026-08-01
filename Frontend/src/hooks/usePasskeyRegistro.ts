import { useCallback, useEffect, useRef, useState } from 'react';
import {
  passkeysService,
  classifyPasskeyError,
  passkeyErrorMessage,
  extractBackendMessage,
  isPublicKeyCredential,
} from '../services/passkeys';

export type RegistroStatus = 'idle' | 'awaiting-native' | 'naming' | 'submitting' | 'success';

/**
 * Orquesta el registro de un passkey: opciones -> diálogo nativo
 * (awaiting-native) -> nombre del dispositivo (naming) -> verificación en el
 * backend (submitting) -> éxito (success). La cancelación del diálogo nativo
 * por el usuario cierra el flujo sin error (onCanceled); los demás errores se
 * clasifican y exponen como mensaje.
 */
export function usePasskeyRegistro(onCanceled?: () => void) {
  const [status, setStatus] = useState<RegistroStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const credentialRef = useRef<PublicKeyCredential | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onCanceledRef = useRef(onCanceled);

  useEffect(() => {
    onCanceledRef.current = onCanceled;
  }, [onCanceled]);

  const registrar = useCallback(async () => {
    abortRef.current?.abort();
    credentialRef.current = null;
    setError(null);
    setStatus('awaiting-native');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const options = await passkeysService.obtenerOpcionesRegistro(controller.signal);
      const credential = await navigator.credentials.create({ publicKey: options });

      // credential === null: el usuario descartó el diálogo nativo. Se cierra
      // el modal por completo (no volver a 'idle' con el modal abierto: loop).
      if (credential === null || !isPublicKeyCredential(credential)) {
        setStatus('idle');
        onCanceledRef.current?.();
        return;
      }

      credentialRef.current = credential;
      setStatus('naming');
    } catch (err: unknown) {
      const kind = classifyPasskeyError(err);
      const message = passkeyErrorMessage(kind, extractBackendMessage(err));
      if (message === null) {
        // Cancelación silenciosa (AbortError/NotAllowedError): cerrar el modal.
        setStatus('idle');
        onCanceledRef.current?.();
        return;
      }
      setError(message);
      setStatus('idle');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const confirmar = useCallback(async (nombreDispositivo: string) => {
    const credential = credentialRef.current;
    const nombre = nombreDispositivo.trim();
    if (!credential || nombre === '') return;

    setError(null);
    setStatus('submitting');

    try {
      await passkeysService.verificarRegistro(credential, nombre);
      setStatus('success');
    } catch (err: unknown) {
      const kind = classifyPasskeyError(err);
      setError(passkeyErrorMessage(kind, extractBackendMessage(err)) ?? 'No se pudo verificar la passkey. Probá de nuevo.');
      setStatus('naming');
    }
  }, []);

  const cancelar = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    credentialRef.current = null;
    setError(null);
    setStatus('idle');
  }, []);

  return { status, error, registrar, confirmar, cancelar };
}
