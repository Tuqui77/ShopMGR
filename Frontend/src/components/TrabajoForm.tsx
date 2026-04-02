import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { useCrearTrabajo, useModificarTrabajo, useTrabajo } from '../hooks/useTrabajos';
import type { EstadoTrabajo, Cliente } from '../types';
import { Loader2, X, Check } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  trabajoId?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

// Si no se pasa isOpen, usa el store
export function TrabajoForm({ trabajoId, isOpen: isOpenProp, onClose: onCloseProp, onSuccess }: Props = {}) {
  const store = useStore();
  const isEditing = !!trabajoId;
  
  // Usar props si se pasan, sino usar store
  const isOpen = isOpenProp ?? store.showTrabajoForm;
  const onClose = onCloseProp ?? (() => store.setShowTrabajoForm(false));
  
  // Queries y mutations
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { data: trabajoOriginal, isLoading: loadingTrabajo } = useTrabajo(trabajoId);
  const crearTrabajo = useCrearTrabajo();
  const modificarTrabajo = useModificarTrabajo();
  
  // Estado del formulario - inicializar con datos del trabajo si estamos editando
  const [titulo, setTitulo] = useState(() => trabajoOriginal?.titulo ?? '');
  const [clienteId, setClienteId] = useState<number | null>(() => trabajoOriginal?.clienteId ?? null);
  const [estado, setEstado] = useState<EstadoTrabajo>(() => trabajoOriginal?.estado ?? 'Pendiente');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Sincronizar estado cuando cambian los datos del trabajo
  useEffect(() => {
    if (trabajoOriginal && isEditing) {
      setTitulo(trabajoOriginal.titulo);
      setClienteId(trabajoOriginal.clienteId);
      setEstado(trabajoOriginal.estado);
    }
  }, [trabajoOriginal, isEditing]);
  
  // Resetear formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      // Resetear después de que la animación del modal termine
      const timer = setTimeout(() => {
        setTitulo('');
        setClienteId(null);
        setEstado('Pendiente');
        setErrors({});
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (titulo.length > 100) {
      newErrors.titulo = 'Máximo 100 caracteres';
    }
    
    if (!clienteId) {
      newErrors.clienteId = 'Selecciona un cliente';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      if (isEditing && trabajoId) {
        await modificarTrabajo.mutateAsync({
          id: trabajoId,
          trabajo: {
            titulo: titulo.trim(),
            idCliente: clienteId!,
            estado,
          },
        });
      } else {
        await crearTrabajo.mutateAsync({
          titulo: titulo.trim(),
          idCliente: clienteId!,
          estado,
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar trabajo:', error);
      setErrors({ submit: 'Error al guardar. Intenta de nuevo.' });
    }
  };
  
  if (!isOpen) return null;
  
  const isLoading = loadingClientes || (isEditing && loadingTrabajo);
  const isSubmitting = crearTrabajo.isPending || modificarTrabajo.isPending;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-lg">
              {isEditing ? 'Editar Trabajo' : 'Nuevo Trabajo'}
            </h2>
            <div className="w-11" />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  Título del trabajo *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Cambio de aceite"
                  className={clsx('input', errors.titulo && 'border-[var(--color-danger)]')}
                  maxLength={100}
                />
                {errors.titulo && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.titulo}
                  </p>
                )}
              </div>
              
              {/* Cliente */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  Cliente *
                </label>
                <select
                  value={clienteId ?? ''}
                  onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
                  className={clsx('input', errors.clienteId && 'border-[var(--color-danger)]')}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente: Cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombreCompleto}
                    </option>
                  ))}
                </select>
                {errors.clienteId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.clienteId}
                  </p>
                )}
              </div>
              
              {/* Estado */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  Estado inicial
                </label>
                <div className="flex gap-2">
                  {(['Pendiente', 'Iniciado'] as EstadoTrabajo[]).map((est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setEstado(est)}
                      className={clsx(
                        'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                        estado === est
                          ? est === 'Pendiente'
                            ? 'badge-warning'
                            : 'badge-active'
                          : ''
                      )}
                      style={{
                        backgroundColor: estado !== est ? 'var(--color-surface)' : undefined,
                        color: estado !== est ? 'var(--color-text)' : undefined,
                        borderWidth: '1px',
                        borderColor: estado !== est ? 'var(--color-border)' : 'transparent',
                      }}
                    >
                      {est === 'Pendiente' ? 'Pendiente' : 'En curso'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Error de submit */}
              {errors.submit && (
                <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
                  {errors.submit}
                </p>
              )}
              
              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {isEditing ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
