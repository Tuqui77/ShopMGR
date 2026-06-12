import { useEffect } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { MovimientoBalance, TipoMovimiento } from '../types';
import { formatDate, formatCurrency } from '../utils/dateFormat';
import { useMovimientosCliente } from '../hooks/useMovimientosCliente';

interface Props {
  clienteId: number;
  nombreCliente: string;
  isOpen: boolean;
  onClose: () => void;
}

const tipoConfig: Record<TipoMovimiento, { label: string; positive: boolean | 'neutral' }> = {
  Pago: { label: 'Pago', positive: true },
  Cargo: { label: 'Cargo', positive: false },
  Anticipo: { label: 'Anticipo', positive: true },
  Compra: { label: 'Compra', positive: false },
  Ajuste: { label: 'Ajuste', positive: 'neutral' },
};

export function MovimientosClienteModal({ clienteId, nombreCliente, isOpen, onClose }: Props) {
  const { data: movimientos, isLoading, error } = useMovimientosCliente(clienteId);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCreditos = movimientos
    ?.filter((m) => tipoConfig[m.tipo]?.positive === true)
    .reduce((sum, m) => sum + m.monto, 0) ?? 0;

  const totalDebitos = movimientos
    ?.filter((m) => tipoConfig[m.tipo]?.positive === false)
    .reduce((sum, m) => sum + m.monto, 0) ?? 0;

  const balance = totalCreditos - totalDebitos;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-lg truncate" style={{ color: 'var(--color-text)' }}>
              Movimientos
            </h2>
            <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
              {nombreCliente}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-danger)' }}>Error al cargar movimientos</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                Verificá que el backend esté funcionando
              </p>
            </div>
          ) : !movimientos || movimientos.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-muted)' }}>No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movimientos.map((mov) => (
                <MovimientoRow key={mov.id} movimiento={mov} />
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {movimientos && movimientos.length > 0 && !isLoading && !error && (
          <div className="p-4 border-t space-y-1.5" style={{ borderColor: 'var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-surface, #f9fafb)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Créditos</span>
              <span className="font-mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalCreditos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Débitos</span>
              <span className="font-mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalDebitos)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1.5 border-t" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
              <span style={{ color: 'var(--color-text)' }}>Balance</span>
              <span
                className={clsx(
                  'font-mono font-bold',
                  balance > 0 ? 'text-[var(--color-success)]' : balance < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'
                )}
              >
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MovimientoRow({ movimiento }: { movimiento: MovimientoBalance }) {
  const config = tipoConfig[movimiento.tipo] || { label: movimiento.tipo, positive: 'neutral' as const };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-page, #f3f4f6)' }}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          config.positive === true && 'bg-green-100',
          config.positive === false && 'bg-red-100',
          config.positive === 'neutral' && 'bg-gray-100'
        )}
      >
        {config.positive === true ? (
          <ArrowUpRight className="w-4 h-4 text-green-600" />
        ) : config.positive === false ? (
          <ArrowDownRight className="w-4 h-4 text-red-600" />
        ) : (
          <Minus className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
            {config.label}
          </span>
          <span
            className={clsx(
              'text-sm font-mono font-semibold flex-shrink-0',
              config.positive === true && 'text-[var(--color-success)]',
              config.positive === false && 'text-[var(--color-danger)]',
              config.positive === 'neutral' && 'text-[var(--color-muted)]'
            )}
          >
            {config.positive === false ? '-' : '+'}{formatCurrency(movimiento.monto)}
          </span>
        </div>
        {movimiento.descripcion && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
            {movimiento.descripcion}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          {formatDate(movimiento.fecha)}
          {movimiento.idTrabajo && ` · Trabajo #${movimiento.idTrabajo}`}
        </p>
      </div>
    </div>
  );
}
