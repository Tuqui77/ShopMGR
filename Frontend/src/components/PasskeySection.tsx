import { useState } from 'react';
import { Fingerprint, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { usePasskeys, useEliminarPasskey } from '../hooks/usePasskeys';
import { ConfirmDialog } from './ConfirmDialog';
import { PasskeyRegisterModal } from './PasskeyRegisterModal';
import { PasskeyRenameModal } from './PasskeyRenameModal';
import type { PasskeyCredencial } from '../types';

const MENSAJE_ERROR_LISTAR = 'No se pudieron cargar tus passkeys. Revisá tu conexión e intentá de nuevo.';
const MENSAJE_ERROR_ELIMINAR = 'No se pudo eliminar la passkey. Probá de nuevo.';

function passkeysSoportados(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

function formatFecha(iso: string | null): string {
  if (iso === null) return 'Nunca';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Nunca';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface PasskeySectionProps {
  /**
   * Renderiza el contenido sin el wrapper `.card` para incrustarse dentro de un
   * panel (submenú Usuario de Configuración). Por defecto se renderiza como
   * card independiente.
   */
  embedded?: boolean;
}

/** Gestión de passkeys: lista, renombra, elimina y registra dispositivos. */
export function PasskeySection({ embedded = false }: PasskeySectionProps) {
  const modal = useModal();
  const soportado = passkeysSoportados();
  const { data, isLoading, error } = usePasskeys();
  const eliminarMutation = useEliminarPasskey();

  const [passkeyARenombrar, setPasskeyARenombrar] = useState<PasskeyCredencial | null>(null);
  const [passkeyAEliminar, setPasskeyAEliminar] = useState<PasskeyCredencial | null>(null);

  const cerrarEliminar = () => {
    eliminarMutation.reset();
    setPasskeyAEliminar(null);
  };

  const confirmarEliminar = () => {
    if (passkeyAEliminar === null) return;
    eliminarMutation.mutate(passkeyAEliminar.idCredencial, {
      onSuccess: () => setPasskeyAEliminar(null),
    });
  };

  const passkeys = data ?? [];

  return (
    <div className={embedded ? undefined : 'card'}>
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
          <button
            onClick={modal.open}
            className="btn-icon"
            aria-label="Registrar dispositivo"
            title="Registrar dispositivo"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 mt-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Cargando passkeys...</span>
        </div>
      ) : error ? (
        <p className="text-sm mt-3" style={{ color: 'var(--color-danger)' }} role="alert">
          {MENSAJE_ERROR_LISTAR}
        </p>
      ) : passkeys.length === 0 ? (
        <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
          {soportado
            ? 'Todavía no registraste ningún passkey.'
            : 'Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {passkeys.map((passkey) => (
            <li
              key={passkey.idCredencial}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <Fingerprint className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {passkey.nombre}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Registrado el {formatFecha(passkey.fechaCreacion)} · Último uso: {formatFecha(passkey.ultimoUso)}
                </p>
              </div>
              <button
                onClick={() => setPasskeyARenombrar(passkey)}
                className="btn-icon"
                aria-label={`Renombrar ${passkey.nombre}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPasskeyAEliminar(passkey)}
                className="btn-icon"
                aria-label={`Eliminar ${passkey.nombre}`}
              >
                <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PasskeyRegisterModal isOpen={modal.isOpen} onClose={modal.close} />
      <PasskeyRenameModal
        key={passkeyARenombrar?.idCredencial ?? 'cerrado'}
        isOpen={passkeyARenombrar !== null}
        onClose={() => setPasskeyARenombrar(null)}
        passkey={passkeyARenombrar}
      />
      <ConfirmDialog
        isOpen={passkeyAEliminar !== null}
        onClose={cerrarEliminar}
        onConfirm={confirmarEliminar}
        title="Eliminar passkey"
        message={
          passkeyAEliminar !== null
            ? `¿Seguro que querés eliminar «${passkeyAEliminar.nombre}»? Ya no vas a poder iniciar sesión con este dispositivo.`
            : ''
        }
        isLoading={eliminarMutation.isPending}
        error={eliminarMutation.isError ? MENSAJE_ERROR_ELIMINAR : undefined}
      />
    </div>
  );
}
