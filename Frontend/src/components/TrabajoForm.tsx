import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { usePresupuestosPorCliente } from '../hooks/usePresupuestos';
import { useCrearTrabajo, useModificarTrabajo, useTrabajo } from '../hooks/useTrabajos';
import { movimientosService, type TipoMovimiento } from '../services/movimientos';
import type { EstadoTrabajo, Cliente, Presupuesto } from '../types';
import { Loader2, X, Check, Banknote } from 'lucide-react';
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
  const onClose = useMemo(() => {
    return onCloseProp ?? (() => store.setShowTrabajoForm(false));
  }, [onCloseProp, store]);
  
  // Queries y mutations
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { data: trabajoOriginal, isLoading: loadingTrabajo } = useTrabajo(trabajoId);
  const crearTrabajo = useCrearTrabajo();
  const modificarTrabajo = useModificarTrabajo();
  
  // Estado del formulario - inicializar con datos del trabajo si estamos editando
  const [titulo, setTitulo] = useState(() => trabajoOriginal?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(() => trabajoOriginal?.descripcion ?? '');
  const [clienteId, setClienteId] = useState<number | null>(() => trabajoOriginal?.clienteId ?? null);
  const [presupuestoId, setPresupuestoId] = useState<number | null>(() => trabajoOriginal?.idPresupuesto ?? null);
  const [estado, setEstado] = useState<EstadoTrabajo>(() => trabajoOriginal?.estado ?? 'Pendiente');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Anticipo
  const [registrarAnticipo, setRegistrarAnticipo] = useState(false);
  const [montoAnticipo, setMontoAnticipo] = useState('');
  const [creandoAnticipo, setCreandoAnticipo] = useState(false);

  // Query de presupuestos del cliente (solo cuando hay cliente seleccionado)
  const { data: presupuestosDelCliente = [] } = usePresupuestosPorCliente(clienteId ?? undefined);
  
  // Resetear formulario al cerrar - handled in onClose
  const onCloseCallback = useCallback(() => {
    const closeFn = onClose ?? (() => store.setShowTrabajoForm(false));
    closeFn();
    // Reset after animation
    setTimeout(() => {
      if (!isOpenProp) {
        setTitulo('');
        setDescripcion('');
        setClienteId(null);
        setPresupuestoId(null);
        setEstado('Pendiente');
        setErrors({});
        setRegistrarAnticipo(false);
        setMontoAnticipo('');
      }
    }, 200);
  }, [onClose, store, isOpenProp]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseCallback();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCloseCallback]);
  
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
    
    if (registrarAnticipo && !montoAnticipo) {
      newErrors.montoAnticipo = 'Ingresa el monto del anticipo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Crear anticipo primero si está habilitado (solo en modo creación)
    if (registrarAnticipo && montoAnticipo && !errors.montoAnticipo && clienteId && !isEditing) {
      setCreandoAnticipo(true);
      try {
        await movimientosService.crear({
          idCliente: clienteId,
          tipo: 'Anticipo' as TipoMovimiento,
          monto: parseFloat(montoAnticipo),
          descripcion: 'Entrega para la compra de materiales e insumos',
        });
      } catch (error) {
        console.error('Error al registrar anticipo:', error);
        setErrors({ submit: 'Error al registrar anticipo. Intenta de nuevo.' });
        setCreandoAnticipo(false);
        return;
      }
      setCreandoAnticipo(false);
    }
    
    try {
      if (isEditing && trabajoId) {
        await modificarTrabajo.mutateAsync({
          id: trabajoId,
          trabajo: {
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || undefined,
            idCliente: clienteId!,
            idPresupuesto: presupuestoId ?? undefined,
            estado,
          },
        });
      } else {
        await crearTrabajo.mutateAsync({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || undefined,
          idCliente: clienteId!,
          idPresupuesto: presupuestoId ?? undefined,
          estado,
        });
      }
      
      onSuccess?.();
      onCloseCallback();
    } catch (error) {
      console.error('Error al guardar trabajo:', error);
      setErrors({ submit: 'Error al guardar. Intenta de nuevo.' });
    }
  };
  
  if (!isOpen) return null;
  
  const isLoading = loadingClientes || (isEditing && loadingTrabajo);
  const isSubmitting = crearTrabajo.isPending || modificarTrabajo.isPending || creandoAnticipo;

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

              {/* Descripción */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Agrega una breve descripción del trabajo..."
                  className="input min-h-[80px] resize-none"
                  maxLength={500}
                  rows={3}
                />
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

              {/* Presupuesto (solo si hay cliente seleccionado) */}
              {clienteId && (
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                    Presupuesto asociado (opcional)
                  </label>
                  <select
                    value={presupuestoId ?? ''}
                    onChange={(e) => setPresupuestoId(e.target.value ? Number(e.target.value) : null)}
                    className="input"
                  >
                    <option value="">Sin presupuesto</option>
                    {presupuestosDelCliente
                      .filter((p: Presupuesto) => p.estado === 'Aceptado')
                      .map((presupuesto: Presupuesto) => (
                        <option key={presupuesto.id} value={presupuesto.id}>
                          {presupuesto.titulo} - ${presupuesto.total?.toLocaleString('es-AR')}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              
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
              
              {/* Anticipo - solo en modo creación */}
              {!isEditing && clienteId && (
                <div className="border rounded-lg p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registrarAnticipo}
                      onChange={(e) => setRegistrarAnticipo(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-accent)]"
                    />
                    <Banknote className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    <span className="text-sm font-medium">Registrar anticipo para materiales</span>
                  </label>
                  
                  {registrarAnticipo && (
                    <div className="mt-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montoAnticipo}
                        onChange={(e) => setMontoAnticipo(e.target.value)}
                        placeholder="Monto del anticipo"
                        className={clsx('input', errors.montoAnticipo && 'border-[var(--color-danger)]')}
                      />
                      {errors.montoAnticipo && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                          {errors.montoAnticipo}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        Descripción: "Entrega para la compra de materiales e insumos"
                      </p>
                    </div>
                  )}
                </div>
              )}
              
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
