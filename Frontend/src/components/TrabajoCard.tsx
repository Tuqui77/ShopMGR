import type { Trabajo } from '../types';
import clsx from 'clsx';
import { Plus, Camera, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  trabajo: Trabajo;
  onRegisterHours?: () => void;
}

export function TrabajoCard({ trabajo, onRegisterHours }: Props) {
  const progress = (trabajo.horasRegistradas / (trabajo.horasEstimadas || 1)) * 100;

  return (
    <Link 
      to={`/trabajos/${trabajo.id}`} 
      className="block card hover:opacity-90 transition-opacity"
    >
      <div className="flex items-start gap-3">
        <div className={clsx('status-dot', trabajo.estado)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</h3>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{trabajo.cliente?.nombreCompleto || 'Sin cliente'}</p>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
      </div>
      
      {trabajo.estado !== 'Pendiente' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
            <span>Progreso</span>
            <span>{trabajo.horasRegistradas}h / {trabajo.horasEstimadas || 0}h</span>
          </div>
          <div className="progress-bar">
            <div 
              className={clsx('progress-fill', trabajo.estado === 'Terminado')}
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: trabajo.estado === 'Terminado' ? 'var(--color-success)' : undefined
              }}
            />
          </div>
        </div>
      )}
      
      {trabajo.estado === 'Pendiente' && (
        <div className="mt-3 flex justify-between text-sm" style={{ color: 'var(--color-muted)' }}>
          <span>Estimado: {trabajo.horasEstimadas}h</span>
          <span>${(trabajo.totalLabor || 0).toLocaleString()}</span>
        </div>
      )}
      
      <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
        {trabajo.estado === 'Iniciado' && (
          <>
            <button 
              onClick={onRegisterHours}
              className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {trabajo.horasRegistradas > 0 ? `+0.5h` : 'Iniciar'}
            </button>
            <button className="btn-secondary text-sm px-3">
              <Camera className="w-4 h-4" />
            </button>
          </>
        )}
        {trabajo.estado === 'Pendiente' && (
          <button className="btn-secondary flex-1 text-sm">
            Iniciar
          </button>
        )}
        {trabajo.estado === 'Terminado' && (
          <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
            <Check className="w-4 h-4" />
            Terminado
          </span>
        )}
      </div>
    </Link>
  );
}
