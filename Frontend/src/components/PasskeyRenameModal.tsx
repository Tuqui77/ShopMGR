import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { extractBackendMessage } from '../services/passkeys';
import { useRenombrarPasskey } from '../hooks/usePasskeys';
import type { PasskeyCredencial } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  passkey: PasskeyCredencial | null;
}

const MENSAJE_NOMBRE_VACIO = 'Poné un nombre para la passkey.';
const MENSAJE_ERROR_GENERICO = 'No se pudo renombrar la passkey. Probá de nuevo.';

/**
 * Modal para renombrar una passkey registrada. El padre lo remonta con
 * key={passkey.idCredencial} para que el input arranque con el nombre actual.
 */
export function PasskeyRenameModal({ isOpen, onClose, passkey }: Props) {
  const [nombre, setNombre] = useState(() => passkey?.nombre ?? '');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const mutation = useRenombrarPasskey();

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const handleGuardar = () => {
    if (passkey === null) return;
    if (nombre.trim().length === 0) {
      setErrorNombre(MENSAJE_NOMBRE_VACIO);
      return;
    }
    setErrorNombre(null);
    mutation.mutate(
      { idCredencial: passkey.idCredencial, nombreNuevo: nombre.trim() },
      { onSuccess: handleClose },
    );
  };

  const isSubmitting = mutation.isPending;
  const errorMutation = mutation.isError
    ? extractBackendMessage(mutation.error) || MENSAJE_ERROR_GENERICO
    : null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Renombrar passkey"
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
          Nombre de la passkey
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
          aria-describedby={errorNombre !== null ? 'passkey-nombre-error' : undefined}
          aria-invalid={errorNombre !== null}
        />
        {errorNombre && (
          <p id="passkey-nombre-error" className="text-sm mt-2" style={{ color: 'var(--color-danger)' }} role="alert">
            {errorNombre}
          </p>
        )}
        {errorMutation && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-danger)' }} role="alert">
            {errorMutation}
          </p>
        )}
      </div>
    </ModalWrapper>
  );
}
