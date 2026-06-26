import { useEffect, useState } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight, Minus, Edit3, Trash2, Check, Ban } from 'lucide-react';
import clsx from 'clsx';
import type { MovimientoBalance, TipoMovimiento } from '../types';
import { formatDate, formatCurrency } from '../utils/dateFormat';
import { useMovimientosCliente, useModificarMovimiento, useEliminarMovimiento } from '../hooks/useMovimientosCliente';

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
  const modificarMovimiento = useModificarMovimiento();
  const eliminarMovimiento = useEliminarMovimiento();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    tipo: TipoMovimiento;
    monto: string;
    descripcion: string;
    fecha: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MovimientoBalance | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          cancelEdit();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingId]);

  function startEdit(mov: MovimientoBalance) {
    setEditingId(mov.id);
    setEditForm({
      tipo: mov.tipo,
      monto: String(mov.monto),
      descripcion: mov.descripcion,
      fecha: mov.fecha ? mov.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(mov: MovimientoBalance) {
    if (!editForm) return;
    try {
      await modificarMovimiento.mutateAsync({
        id: mov.id,
        idCliente: mov.idCliente,
        tipo: editForm.tipo,
        monto: parseFloat(editForm.monto),
        descripcion: editForm.descripcion,
        fecha: editForm.fecha,
        idTrabajo: mov.idTrabajo,
      });
      cancelEdit();
    } catch (err) {
      console.error('Error al modificar movimiento:', err);
    }
  }

  async function handleDelete(mov: MovimientoBalance) {
    setDeletingId(mov.id);
    try {
      await eliminarMovimiento.mutateAsync({ idMovimiento: mov.id, idCliente: mov.idCliente });
    } catch (err) {
      console.error('Error al eliminar movimiento:', err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

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
        <div className="flex items-center justify-between p-6 pb-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              Movimientos
            </h2>
            <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
              {nombreCliente}
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
              {movimientos.map((mov) =>
                editingId === mov.id ? (
                  <MovimientoEditRow
                    key={mov.id}
                    editForm={editForm!}
                    onChange={setEditForm}
                    onSave={() => saveEdit(mov)}
                    onCancel={cancelEdit}
                    isPending={modificarMovimiento.isPending}
                  />
                ) : (
                  <MovimientoRow
                    key={mov.id}
                    movimiento={mov}
                    onEdit={() => startEdit(mov)}
                    onDelete={() => setDeleteConfirm(mov)}
                    isDeleting={deletingId === mov.id}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {movimientos && movimientos.length > 0 && !isLoading && !error && (
          <div className="p-6 pt-4 border-t space-y-1.5 shrink-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Créditos</span>
              <span className="font-mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalCreditos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Débitos</span>
              <span className="font-mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalDebitos)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)' }}>Balance</span>
              <span
                className={clsx(
                  'font-mono font-bold',
                  balance > 0 && 'text-[var(--color-success)]',
                  balance < 0 && 'text-[var(--color-danger)]',
                  balance === 0 && 'text-[var(--color-muted)]'
                )}
              >
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)} />
          <div className="modal-content max-w-sm">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-lg font-semibold mb-2">¿Eliminar movimiento?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Se eliminará: <strong>{deleteConfirm.descripcion}</strong>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={eliminarMovimiento.isPending}
                  className="py-2.5 px-4 rounded-lg font-medium text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                >
                  {eliminarMovimiento.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Read-only row ──────────────────────────────────────────────────────────

function MovimientoRow({
  movimiento,
  onEdit,
  onDelete,
  isDeleting,
}: {
  movimiento: MovimientoBalance;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const config = tipoConfig[movimiento.tipo] || { label: movimiento.tipo, positive: 'neutral' as const };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border group transition-colors duration-200 hover:bg-[var(--color-hover)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          config.positive === true && 'bg-emerald-900/20',
          config.positive === false && 'bg-red-900/20',
          config.positive === 'neutral' && 'bg-gray-500/20'
        )}
      >
        {config.positive === true ? (
          <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
        ) : config.positive === false ? (
          <ArrowDownRight className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
        ) : (
          <Minus className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
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
            {formatCurrency(Math.abs(movimiento.monto))}
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

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={onEdit}
          className="btn-icon w-7 h-7"
          title="Editar movimiento"
          aria-label="Editar movimiento"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="btn-icon w-7 h-7"
          style={{ color: 'var(--color-danger)' }}
          title="Eliminar movimiento"
          aria-label="Eliminar movimiento"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Editable row ───────────────────────────────────────────────────────────

function MovimientoEditRow({
  editForm,
  onChange,
  onSave,
  onCancel,
  isPending,
}: {
  editForm: { tipo: TipoMovimiento; monto: string; descripcion: string; fecha: string };
  onChange: (form: { tipo: TipoMovimiento; monto: string; descripcion: string; fecha: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="p-3 rounded-lg space-y-2"
      style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 0 0 2px var(--color-accent)' }}
    >
      <div className="grid grid-cols-2 gap-2">
        {/* Tipo */}
        <div>
          <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--color-muted)' }}>Tipo</label>
          <select
            value={editForm.tipo}
            onChange={(e) => onChange({ ...editForm, tipo: e.target.value as TipoMovimiento })}
            className="search-input text-sm py-1"
          >
            <option value="Pago">Pago</option>
            <option value="Cargo">Cargo</option>
            <option value="Anticipo">Anticipo</option>
            <option value="Compra">Compra</option>
            <option value="Ajuste">Ajuste</option>
          </select>
        </div>

        {/* Monto */}
        <div>
          <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--color-muted)' }}>Monto</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={editForm.monto}
            onChange={(e) => onChange({ ...editForm, monto: e.target.value })}
            className="search-input text-sm py-1"
          />
        </div>
      </div>

      {/* Fecha */}
      <div>
        <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--color-muted)' }}>Fecha</label>
        <input
          type="date"
          value={editForm.fecha}
          onChange={(e) => onChange({ ...editForm, fecha: e.target.value })}
          className="search-input text-sm py-1"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--color-muted)' }}>Descripción</label>
        <input
          type="text"
          value={editForm.descripcion}
          onChange={(e) => onChange({ ...editForm, descripcion: e.target.value })}
          className="search-input text-sm py-1"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon w-7 h-7"
          disabled={isPending}
          title="Cancelar"
        >
          <Ban className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !editForm.monto || !editForm.descripcion}
          className="btn-icon w-7 h-7"
          style={{ color: 'var(--color-success)' }}
          title="Guardar"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
