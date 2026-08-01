import { useCallback, useEffect, useState } from 'react';
import { Check, Fingerprint, Loader2 } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { usePasskeyRegistro } from '../hooks/usePasskeyRegistro';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MENSAJE_NOMBRE_VACIO = 'Poné un nombre para el dispositivo.';

/**
 * Modal de registro de passkey en 3 pasos:
 * 1) Espera la confirmación nativa del dispositivo (huella/rostro/PIN).
 * 2) Pide un nombre para identificar el dispositivo.
 * 3) Muestra el éxito y se cierra solo.
 */
export function PasskeyRegisterModal({ isOpen, onClose }: Props) {
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  // Cancelación del diálogo nativo: se cierra el modal completo (sin loop).
  const handleCancelarDialogo = useCallback(() => {
    setNombre('');
    setErrorNombre(null);
    onClose();
  }, [onClose]);

  const { status, error, registrar, confirmar, cancelar } = usePasskeyRegistro(handleCancelarDialogo);

  // Al abrir (sin error previo), arranca el flujo nativo automáticamente.
  useEffect(() => {
    if (isOpen && status === 'idle' && error === null) {
      registrar();
    }
  }, [isOpen, status, error, registrar]);

  const handleClose = useCallback(() => {
    setNombre('');
    setErrorNombre(null);
    cancelar();
    onClose();
  }, [cancelar, onClose]);

  // Cierre automático tras el éxito.
  useEffect(() => {
    if (status === 'success') {
      const timeout = setTimeout(handleClose, 2000);
      return () => clearTimeout(timeout);
    }
  }, [status, handleClose]);

  const handleGuardar = () => {
    if (!nombre.trim()) {
      setErrorNombre(MENSAJE_NOMBRE_VACIO);
      return;
    }
    setErrorNombre(null);
    confirmar(nombre);
  };

  // -- Paso 1: confirmación nativa -------------------------------------------------
  if (status === 'awaiting-native') {
    return (
      <ModalWrapper isOpen={isOpen} onClose={handleClose} title="Registrar passkey">
        <div className="text-center py-6">
          <Fingerprint className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--color-accent)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>
            Confirmá en tu dispositivo que querés crear el passkey.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            Usá tu huella, rostro o PIN para crear el passkey.
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-5" style={{ color: 'var(--color-muted)' }} />
        </div>
      </ModalWrapper>
    );
  }

  // -- Paso 3: éxito ---------------------------------------------------------------
  if (status === 'success') {
    return (
      <ModalWrapper isOpen={isOpen} onClose={handleClose} title="Registrar passkey">
        <div className="text-center py-6">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}
          >
            <Check className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>¡Listo! Tu passkey quedó registrado.</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            Ya podés iniciar sesión con este dispositivo.
          </p>
        </div>
      </ModalWrapper>
    );
  }

  // -- Error (antes de llegar al paso de nombre) -------------------------------------
  if (error !== null && status === 'idle') {
    return (
      <ModalWrapper
        isOpen={isOpen}
        onClose={handleClose}
        title="Registrar passkey"
        footer={
          <>
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cerrar
            </button>
            <button type="button" onClick={registrar} className="btn-primary">
              Reintentar
            </button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
        </div>
      </ModalWrapper>
    );
  }

  // -- Paso 2: nombre del dispositivo (default: naming / submitting) ------------------
  const isSubmitting = status === 'submitting';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar passkey"
      footer={
        <>
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="passkey-nombre" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
          Nombre del dispositivo
        </label>
        <input
          id="passkey-nombre"
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (errorNombre !== null) setErrorNombre(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSubmitting) handleGuardar();
          }}
          placeholder="Ej: iPhone de Juan, notebook del taller"
          className="input"
          autoFocus
          aria-describedby={errorNombre !== null ? 'passkey-nombre-helper passkey-nombre-error' : 'passkey-nombre-helper'}
          aria-invalid={errorNombre !== null}
        />
        {errorNombre && (
          <p id="passkey-nombre-error" className="text-sm mt-2" style={{ color: 'var(--color-danger)' }} role="alert">
            {errorNombre}
          </p>
        )}
        {error && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-danger)' }}>{error}</p>
        )}
        <p id="passkey-nombre-helper" className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          Usá un nombre que te ayude a reconocer este dispositivo.
        </p>
      </div>
    </ModalWrapper>
  );
}
