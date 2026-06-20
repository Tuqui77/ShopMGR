import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { usePresupuestosPorCliente, usePresupuesto } from '../hooks/usePresupuestos';
import { useCrearTrabajo, useModificarTrabajo, useTrabajo, useCambiarPresupuesto, useEliminarPresupuesto } from '../hooks/useTrabajos';
import { movimientosService, type TipoMovimiento } from '../services/movimientos';
import type { EstadoTrabajo, Cliente, Presupuesto } from '../types';
import { Loader2, X, Check, Banknote, FileText, Trash2 } from 'lucide-react';
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
  const cambiarPresupuesto = useCambiarPresupuesto();
  const eliminarPresupuesto = useEliminarPresupuesto();

  // Estado del formulario - inicializar con datos del trabajo si estamos editando
  const [titulo, setTitulo] = useState(() => trabajoOriginal?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(() => trabajoOriginal?.descripcion ?? '');
  const [clienteId, setClienteId] = useState<number | null>(() => trabajoOriginal?.clienteId ?? null);
  const [presupuestoId, setPresupuestoId] = useState<number | null>(() => trabajoOriginal?.idPresupuesto ?? null);
  const [estado, setEstado] = useState<EstadoTrabajo>(() => trabajoOriginal?.estado ?? 'Pendiente');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronizar estado del formulario cuando los datos del trabajo se cargan (edición)
  useEffect(() => {
    if (isEditing && trabajoOriginal) {
      setTitulo(trabajoOriginal.titulo);
      setDescripcion(trabajoOriginal.descripcion ?? '');
      setClienteId(trabajoOriginal.clienteId);
      setPresupuestoId(trabajoOriginal.idPresupuesto ?? null);
      setEstado(trabajoOriginal.estado);
    }
  }, [isEditing, trabajoOriginal]);

  // Anticipo
  const [registrarAnticipo, setRegistrarAnticipo] = useState(false);
  const [montoAnticipo, setMontoAnticipo] = useState('');
  const [creandoAnticipo, setCreandoAnticipo] = useState(false);

  // Query de presupuestos del cliente (solo cuando hay cliente seleccionado)
  const { data: presupuestosDelCliente = [] } = usePresupuestosPorCliente(clienteId ?? undefined);

  // Presupuesto actual (para edición)
  const { data: presupuestoActual } = usePresupuesto(isEditing ? (presupuestoId ?? undefined) : undefined);
  const [showPresupuestoSelector, setShowPresupuestoSelector] = useState(false);

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

  // Handler: seleccionar un presupuesto (cambiar el asociado al trabajo)
  const handleSeleccionarPresupuesto = async (nuevoPresupuestoId: number) => {
    if (!trabajoId) return;
    try {
      await cambiarPresupuesto.mutateAsync({ id: trabajoId, idPresupuesto: nuevoPresupuestoId });
      setPresupuestoId(nuevoPresupuestoId);
      setShowPresupuestoSelector(false);
    } catch (err) {
      console.error('Error al cambiar presupuesto:', err);
    }
  };

  // Handler: eliminar presupuesto asociado
  const handleEliminarPresupuesto = async () => {
    if (!trabajoId) return;
    try {
      await eliminarPresupuesto.mutateAsync(trabajoId);
      setPresupuestoId(null);
      setShowPresupuestoSelector(false);
    } catch (err) {
      console.error('Error al eliminar presupuesto:', err);
    }
  };

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
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onCloseCallback} />

      {/* Modal principal */}
      <div className="modal-content">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Editar Trabajo' : 'Nuevo Trabajo'}
            </h2>
            <button
              type="button"
              onClick={onCloseCallback}
              className="btn-icon"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
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
                  className={clsx('input', errors.titulo && 'input-error')}
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
                  className={clsx('input', errors.clienteId && 'input-error')}
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

              {/* Presupuesto - modo creación: select simple */}
              {!isEditing && clienteId && (
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
                      .filter((p: Presupuesto) => p.estado === 'Aceptado' || p.estado === 'Pendiente')
                      .map((presupuesto: Presupuesto) => (
                        <option key={presupuesto.id} value={presupuesto.id}>
                          {presupuesto.titulo} - ${presupuesto.total?.toLocaleString('es-AR')}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Presupuesto - modo edición: display + botón cambiar */}
              {isEditing && clienteId && (
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                    Presupuesto asociado
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPresupuestoSelector(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)]"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-elevated)' }}
                    >
                      <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      {presupuestoActual ? (
                        <>
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                            {presupuestoActual.titulo}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {presupuestoActual.horasEstimadas}h estimadas &middot; ${presupuestoActual.total?.toLocaleString('es-AR')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            Sin presupuesto
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            Tocar para seleccionar
                          </p>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                      Cambiar
                    </span>
                  </button>
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
                        'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
                        estado === est
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-hover)]'
                      )}
                    >
                      {est === 'Pendiente' ? 'Pendiente' : 'En curso'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anticipo - solo en modo creación */}
              {!isEditing && clienteId && (
                <div
                  className="border rounded-lg p-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
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
                        className={clsx('input', errors.montoAnticipo && 'input-error')}
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

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCloseCallback}
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

      {/* Modal selector de presupuesto - fuera del modal-content para evitar clipping por transform */}
      {showPresupuestoSelector && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={() => setShowPresupuestoSelector(false)}
        >
          <div
            className="bg-[var(--color-elevated)] rounded-xl w-[90vw] max-w-md max-h-[70vh] overflow-y-auto shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header del selector */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {presupuestoId ? 'Cambiar presupuesto' : 'Asociar presupuesto'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPresupuestoSelector(false)}
                  className="btn-icon"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {presupuestosDelCliente.filter((p: Presupuesto) => p.estado === 'Aceptado' || p.estado === 'Pendiente').length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    No hay presupuestos disponibles para este cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {presupuestosDelCliente
                    .filter((p: Presupuesto) => p.estado === 'Aceptado' || p.estado === 'Pendiente')
                    .map((presupuesto: Presupuesto) => {
                      const isSelected = presupuesto.id === presupuestoId;
                      return (
                        <button
                          key={presupuesto.id}
                          type="button"
                          onClick={() => handleSeleccionarPresupuesto(presupuesto.id)}
                          disabled={cambiarPresupuesto.isPending}
                          className={clsx(
                            'w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200',
                            isSelected
                              ? 'bg-[var(--color-accent)]/15'
                              : 'hover:bg-[var(--color-hover)] bg-transparent'
                          )}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-elevated)' }}
                          >
                            <FileText className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                              {presupuesto.titulo}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              {presupuesto.horasEstimadas}h &middot; ${presupuesto.total?.toLocaleString('es-AR')}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Opción para eliminar presupuesto */}
              {presupuestoId && (
                <button
                  type="button"
                  onClick={handleEliminarPresupuesto}
                  disabled={eliminarPresupuesto.isPending}
                  className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer hover:bg-[var(--color-hover)]"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {eliminarPresupuesto.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Quitar presupuesto
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPresupuestoSelector(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
