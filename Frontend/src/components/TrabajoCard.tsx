import type { Trabajo } from '../types';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  trabajo: Trabajo;
  hideClientName?: boolean;
}

export function TrabajoCard({ trabajo, hideClientName }: Props) {
  return (
    <Link 
      to={`/trabajos/${trabajo.id}`} 
      className="block card hover:bg-[var(--color-hover)] transition-colors duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={clsx('status-dot', trabajo.estado)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</h3>
          {!hideClientName && (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{trabajo.cliente?.nombreCompleto || 'Sin cliente'}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
      </div>
    </Link>
  );
}
