import { Fingerprint, Loader2 } from 'lucide-react';

interface Props {
  onClick: () => void;
  isLoading: boolean;
}

/** Botón de login con passkey: muestra el estado de confirmación nativa. */
export function PasskeyButton({ onClick, isLoading }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="btn-secondary w-full flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Fingerprint className="w-5 h-5" />
      )}
      {isLoading ? 'Confirmá en tu dispositivo...' : 'Iniciar sesión con passkey'}
    </button>
  );
}
