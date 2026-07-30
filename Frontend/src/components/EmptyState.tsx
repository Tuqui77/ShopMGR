import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Action {
  label: string;
  onClick: () => void;
}

interface Props {
  icon: LucideIcon;
  message: string;
  action?: Action;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, message, action, children }: Props) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
      <p style={{ color: 'var(--color-muted)' }}>{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4">
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}
