import { useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Variant = 'danger' | 'warning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: Variant;
}

const variantConfig: Record<Variant, { icon: typeof Trash2; color: string }> = {
  danger: { icon: Trash2, color: 'var(--color-danger)' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning)' },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'danger',
}: Props) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const { icon: Icon, color } = variantConfig[variant];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop"
      onClick={isLoading ? undefined : onClose}
    >
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <Icon className="w-12 h-12 mx-auto mb-4" style={{ color }} />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={clsx(
                'py-2.5 px-4 rounded-lg font-medium text-white transition-colors duration-200 cursor-pointer disabled:opacity-50',
                variant === 'danger' && 'hover:opacity-90'
              )}
              style={{ backgroundColor: color }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {confirmLabel}...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
