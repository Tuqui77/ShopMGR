import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Loader2, X, Edit, Trash2, Save } from 'lucide-react';
import type { TelefonoCompleto } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { telefonosService, type ModificarTelefonoRequest } from '../services/telefonos';

interface TelefonoModalProps {
  telefono?: TelefonoCompleto;
  clienteId: number;
  isOpen: boolean;
  onClose?: () => void;
  isNew?: boolean;
}

export function TelefonoModal({ telefono, clienteId, isOpen, onClose, isNew = false }: TelefonoModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(() => {
    if (telefono && !isNew) {
      return {
        telefono: telefono.telefono || '',
        descripcion: telefono.descripcion || '',
      };
    }
    return { telefono: '', descripcion: '' };
  });
  
  const onCloseCallback = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseCallback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCloseCallback]);

  const crearMut = useMutation({
    mutationFn: () => telefonosService.crear(
      clienteId,
      formData.telefono.trim(),
      formData.descripcion.trim() || undefined
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      onCloseCallback();
    },
  });

  const modificarMut = useMutation({
    mutationFn: (data: ModificarTelefonoRequest) => 
      telefonosService.modificar(telefono!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      setIsEditing(false);
      onCloseCallback();
    },
  });

  const eliminarMut = useMutation({
    mutationFn: () => telefonosService.eliminar(telefono!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      onCloseCallback();
    },
  });

  const handleSave = () => {
    // Validar campos requeridos
    const newErrors: Record<string, string> = {};
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (formData.telefono.trim().length < 10) {
      newErrors.telefono = 'El teléfono debe tener al menos 10 dígitos';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    const telefonoData: ModificarTelefonoRequest = {
      telefono: formData.telefono.trim(),
      descripcion: formData.descripcion.trim() || null,
    };
    
    if (isNew) {
      crearMut.mutate();
    } else {
      modificarMut.mutate(telefonoData);
    }
  };

  const handleDelete = () => {
    eliminarMut.mutate();
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  // Extract error from mutation
  const mutationError = crearMut.error || modificarMut.error || eliminarMut.error;
  let errorMessage = '';
  
  if (mutationError) {
    // Handle Axios errors with response data
    if (typeof mutationError === 'object' && mutationError !== null && 'response' in mutationError) {
      const axiosError = mutationError as { response?: { data?: { message?: string } } };
      errorMessage = axiosError.response?.data?.message || '';
    }
    // Fallback to other error formats
    if (!errorMessage) {
      errorMessage = typeof mutationError === 'string' 
        ? mutationError 
        : (mutationError as Error).message || 'Error desconocido';
    }
  }

  const isPending = crearMut.isPending || modificarMut.isPending || eliminarMut.isPending;

  return (
    <>
      <div
        className="modal-backdrop flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCloseCallback();
        }}
      >
        <div
          className="modal-content w-full max-w-sm max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {isNew ? 'Nuevo Teléfono' : 'Teléfono'}
            </h2>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 pt-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Teléfono <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => {
                  setFormData({ ...formData, telefono: e.target.value });
                  if (errors.telefono) setErrors({ ...errors, telefono: '' });
                }}
                disabled={!isEditing && !isNew}
                className={clsx('input', errors.telefono && 'input-error')}
                placeholder="11 1234-5678"
              />
              {errors.telefono && (
                <span className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.telefono}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Descripción
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                disabled={!isEditing && !isNew}
                className="input"
                placeholder="Celular, Trabajo, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {(isEditing || isNew) ? (
              <>
                <button
                  onClick={() => {
                    if (isNew) {
                      onCloseCallback();
                    } else {
                      setIsEditing(false);
                      // Reset form to original values
                      if (telefono) {
                        setFormData({
                          telefono: telefono.telefono || '',
                          descripcion: telefono.descripcion || '',
                        });
                      }
                    }
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="btn-secondary flex items-center justify-center gap-2"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="modal-content max-w-sm">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-lg font-semibold mb-2">¿Eliminar teléfono?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={eliminarMut.isPending}
                  className="py-2.5 px-4 rounded-lg font-medium text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                >
                  {eliminarMut.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}