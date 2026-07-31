import { Fingerprint } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { PasskeyRegisterModal } from './PasskeyRegisterModal';

function passkeysSoportados(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

/** Card de Passkeys en Configuración: registra dispositivos para login sin contraseña. */
export function PasskeySection() {
  const modal = useModal();
  const soportado = passkeysSoportados();

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
          <Fingerprint className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Passkeys</h2>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Iniciá sesión sin contraseña con la biometría o PIN de tu dispositivo.
          </p>
        </div>
        {soportado && (
          <button onClick={modal.open} className="btn-secondary text-sm px-3 py-1.5">
            Registrar dispositivo
          </button>
        )}
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
        {soportado
          ? 'Todavía no registraste ningún passkey.'
          : 'Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador.'}
      </p>

      <PasskeyRegisterModal isOpen={modal.isOpen} onClose={modal.close} />
    </div>
  );
}
