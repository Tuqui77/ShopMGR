import { useEffect, useState } from 'react';
import { X, Loader2, Clock, Edit3, Trash2, Check, Ban } from 'lucide-react';
import type { HorasDeTrabajo } from '../types';
import { formatDate } from '../utils/dateFormat';
import { useModificarHoras, useEliminarHoras } from '../hooks/useTrabajos';

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
  const modificarHoras = useModificarHoras();
  const eliminarHoras = useEliminarHoras();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    horas: string;
    descripcion: string;
    fecha: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HorasDeTrabajo | null>(null);

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

  function startEdit(hora: HorasDeTrabajo) {
    setEditingId(hora.id);
    setEditForm({
      horas: String(hora.horas),
      descripcion: hora.descripcion,
      fecha: hora.fecha ? hora.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(hora: HorasDeTrabajo) {
    if (!editForm) return;
    try {
      await modificarHoras.mutateAsync({
        id: hora.id,
        horas: parseFloat(editForm.horas),
        descripcion: editForm.descripcion,
        fecha: editForm.fecha,
        idTrabajo: hora.idTrabajo,
      });
      cancelEdit();
    } catch (err) {
      console.error('Error al modificar horas:', err);
    }
  }

  async function handleDelete(hora: HorasDeTrabajo) {
    setDeletingId(hora.id);
    try {
      await eliminarHoras.mutateAsync({ idTrabajo: hora.idTrabajo, idHoras: hora.id });
    } catch (err) {
      console.error('Error al eliminar horas:', err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

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
              {sortedHoras.map((h) =>
                editingId === h.id ? (
                  <HoraEditRow
                    key={h.id}
                    editForm={editForm!}
                    onChange={setEditForm}
                    onSave={() => saveEdit(h)}
                    onCancel={cancelEdit}
                    isPending={modificarHoras.isPending}
                  />
                ) : (
                  <HoraRow
                    key={h.id}
                    hora={h}
                    onEdit={() => startEdit(h)}
                    onDelete={() => setDeleteConfirm(h)}
                    isDeleting={deletingId === h.id}
                  />
                )
              )}
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

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)} />
          <div className="modal-content max-w-sm">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-lg font-semibold mb-2">¿Eliminar horas?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Se eliminarán <strong>{deleteConfirm.horas}h</strong>
                {deleteConfirm.descripcion && <> — {deleteConfirm.descripcion}</>}
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
                  disabled={eliminarHoras.isPending}
                  className="py-2.5 px-4 rounded-lg font-medium text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                >
                  {eliminarHoras.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Hora row (read-only) ───────────────────────────────────────────────────

function HoraRow({
  hora,
  onEdit,
  onDelete,
  isDeleting,
}: {
  hora: HorasDeTrabajo;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border group transition-colors duration-200 hover:bg-[var(--color-hover)]"
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

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={onEdit}
          className="btn-icon w-7 h-7"
          title="Editar horas"
          aria-label="Editar horas"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="btn-icon w-7 h-7"
          style={{ color: 'var(--color-danger)' }}
          title="Eliminar horas"
          aria-label="Eliminar horas"
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

function HoraEditRow({
  editForm,
  onChange,
  onSave,
  onCancel,
  isPending,
}: {
  editForm: { horas: string; descripcion: string; fecha: string };
  onChange: (form: { horas: string; descripcion: string; fecha: string }) => void;
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
        {/* Horas */}
        <div>
          <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--color-muted)' }}>Horas</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={editForm.horas}
            onChange={(e) => onChange({ ...editForm, horas: e.target.value })}
            className="search-input text-sm py-1"
          />
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
          disabled={isPending || !editForm.horas}
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
