import { useEffect } from 'react';
import { X, Loader2, Clock } from 'lucide-react';
import type { HorasDeTrabajo } from '../types';
import { formatDate } from '../utils/dateFormat';

interface Props {
  trabajoId: number;
  nombreTrabajo: string;
  horas: HorasDeTrabajo[] | undefined;
  isLoading: boolean;
  totalHoras: number;
  horasEstimadas?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function HorasTrabajoModal({
  nombreTrabajo,
  horas,
  isLoading,
  totalHoras,
  horasEstimadas,
  isOpen,
  onClose,
}: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progress = horasEstimadas
    ? Math.round((totalHoras / horasEstimadas) * 100)
    : 0;

  const sortedHoras = horas
    ? [...horas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    : [];

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              Horas registradas
            </h2>
            <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
              {nombreTrabajo}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon ml-2 flex-shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : !sortedHoras || sortedHoras.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-muted)' }}>No hay horas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHoras.map((h) => (
                <HoraRow key={h.id} hora={h} />
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {!isLoading && sortedHoras.length > 0 && (
          <div className="p-6 pt-4 border-t space-y-3 shrink-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            {/* Progress bar */}
            {horasEstimadas && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--color-muted)' }}>Progreso</span>
                  <span style={{ color: 'var(--color-muted)' }}>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Total registrado</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
                {totalHoras}h
              </span>
            </div>
            {horasEstimadas && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-muted)' }}>Estimado</span>
                <span className="font-mono" style={{ color: 'var(--color-muted)' }}>
                  {horasEstimadas}h
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Hora row ────────────────────────────────────────────────────────────────

function HoraRow({ hora }: { hora: HorasDeTrabajo }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border transition-colors duration-200"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--color-elevated)' }}
      >
        <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold font-mono" style={{ color: 'var(--color-text)' }}>
            {hora.horas}h
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {formatDate(hora.fecha)}
          </span>
        </div>
        {hora.descripcion ? (
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {hora.descripcion}
          </p>
        ) : (
          <p className="text-xs mt-1 italic" style={{ color: 'var(--color-muted)' }}>
            Sin descripción
          </p>
        )}
      </div>
    </div>
  );
}
