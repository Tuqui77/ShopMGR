import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Action = { label: string; onClick: () => void; icon?: LucideIcon };

type EmptyStatePropsBase = {
  icon: LucideIcon;               // obligatorio, Lucide (sin emojis, sin SVG propios)
  title: string;                  // --color-text, font-medium
  description?: string;           // --color-muted
  size?: 'default' | 'compact';   // default: 'default'
  className?: string;
  children?: ReactNode;           // slot extra (p. ej. ImageUpload bajo "Sin fotos")
};

type EmptyStateProps = EmptyStatePropsBase &
  (
    | { variant?: 'default'; action?: Action; secondaryAction?: never }       // lista vacía real → CTA crear
    | { variant: 'no-results'; action?: never; secondaryAction: Action }      // filtro/búsqueda → limpiar (obligatorio)
    | { variant: 'contextual'; action?: Action; secondaryAction?: never }     // vacío propio de un recurso/segmento
  );

function ActionButton({ action, kind }: { action: Action; kind: 'primary' | 'secondary' | 'link' }) {
  const Icon = action.icon;

  if (kind === 'link') {
    return (
      <button
        type="button"
        onClick={action.onClick}
        className="text-sm font-medium mt-1.5 hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200"
        style={{ color: 'var(--color-accent)' }}
      >
        {Icon && <Icon className="w-4 h-4 inline-block mr-1" aria-hidden="true" focusable="false" />}
        {action.label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={kind === 'primary' ? 'btn-primary mt-4' : 'btn-secondary mt-4'}
    >
      {Icon && <Icon className="w-4 h-4 inline-block mr-1" aria-hidden="true" focusable="false" />}
      {action.label}
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  size = 'default',
  variant = 'default',
  action,
  secondaryAction,
  children,
  className,
}: EmptyStateProps) {
  const isCompact = size === 'compact';

  return (
    <div
      role="status"
      aria-live="polite"
      className={isCompact ? `text-center py-6 ${className ?? ''}` : `card text-center py-10 px-6 ${className ?? ''}`}
    >
      <Icon
        aria-hidden="true"
        focusable="false"
        className={isCompact ? 'w-8 h-8 mx-auto mb-2' : 'w-12 h-12 mx-auto mb-3'}
        style={{ color: 'var(--color-muted)' }}
      />
      <p
        className={isCompact ? 'text-sm font-medium' : 'text-base font-medium'}
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </p>
      {description && (
        <p
          className={isCompact ? 'text-xs mt-1' : 'text-sm mt-1'}
          style={{ color: 'var(--color-muted)' }}
        >
          {description}
        </p>
      )}

      {variant === 'no-results'
        ? secondaryAction && <ActionButton action={secondaryAction} kind={isCompact ? 'link' : 'secondary'} />
        : action && <ActionButton action={action} kind={isCompact ? 'link' : 'primary'} />}

      {children}
    </div>
  );
}
