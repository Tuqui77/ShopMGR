import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { useCrearPresupuesto, useModificarPresupuesto, usePresupuestoDetalle } from '../hooks/usePresupuestos';
import type { Cliente, MaterialRequest } from '../types';
import { Loader2, X, Check, Plus, Trash2, Search, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  presupuestoId?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

// Si no se pasa isOpen, usa el store
export function PresupuestoForm({ presupuestoId, isOpen: isOpenProp, onClose: onCloseProp, onSuccess }: Props = {}) {
  const store = useStore();
  const isEditing = !!presupuestoId;
  
  // Usar props si se pasan, sino usar store
  const isOpen = isOpenProp ?? store.showPresupuestoForm;
  const onClose = onCloseProp ?? (() => store.setShowPresupuestoForm(false));
  
  // Queries y mutations
  const { data: clientes = [] } = useClientes();
  const { data: presupuestoOriginal } = usePresupuestoDetalle(presupuestoId);
  const crearPresupuesto = useCrearPresupuesto();
  const modificarPresupuesto = useModificarPresupuesto();

  const [step, setStep] = useState<'cliente' | 'datos'>('cliente');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [search, setSearch] = useState('');
  
  // Datos del presupuesto
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState(0);
  
  // Materiales
  const [materiales, setMateriales] = useState<MaterialRequest[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState({ descripcion: '', cantidad: 1, precioUnitario: 0 });
  
  // Estado para edición de materiales en línea
  const [materialEditando, setMaterialEditando] = useState<number | null>(null);
  const [materialEditandoData, setMaterialEditandoData] = useState({ descripcion: '', cantidad: 1, precioUnitario: 0 });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [esDuplicado, setEsDuplicado] = useState(false);

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      if (!isOpenProp) {
        setStep('cliente');
        setClienteSeleccionado(null);
        setSearch('');
        setTitulo('');
        setDescripcion('');
        setHorasEstimadas(0);
        setMateriales([]);
        setNuevoMaterial({ descripcion: '', cantidad: 1, precioUnitario: 0 });
        setErrors({});
        setShowSuccess(false);
        setEsDuplicado(false);
      }
    }, 200);
  };

  // Initialize form data when editing
  useEffect(() => {
    if (presupuestoOriginal && isEditing) {
      // Skip client selection step, go directly to data
      setStep('datos');
      setClienteSeleccionado({
        id: presupuestoOriginal.cliente?.id || 0,
        nombreCompleto: presupuestoOriginal.cliente?.nombreCompleto || '',
        telefono: [],
        balance: 0,
        trabajosCount: 0,
        presupuestosCount: 0,
      });
      setTitulo(presupuestoOriginal.titulo);
      setDescripcion(presupuestoOriginal.descripcion || '');
      setHorasEstimadas(presupuestoOriginal.horasEstimadas);
      // Map materiales from the service (which maps backend "precio" to "precioUnitario")
      if (presupuestoOriginal.materiales) {
        setMateriales(presupuestoOriginal.materiales.map(m => ({
          descripcion: m.descripcion,
          cantidad: m.cantidad,
          Precio: m.precioUnitario || 0,
          precioUnitario: m.precioUnitario || 0,
        })));
      }
    }
  }, [presupuestoOriginal, isEditing]);

  // Reset form when closed via prop (not store)
  useEffect(() => {
    if (!isOpen && isOpenProp !== undefined) {
      setStep('cliente');
      setClienteSeleccionado(null);
      setSearch('');
      setTitulo('');
      setDescripcion('');
      setHorasEstimadas(0);
      setMateriales([]);
      setNuevoMaterial({ descripcion: '', cantidad: 1, precioUnitario: 0 });
      setErrors({});
      setShowSuccess(false);
    }
  }, [isOpen, isOpenProp]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Initialize form data when duplicating from store
  useEffect(() => {
    if (store.datosDuplicarPresupuesto && isOpen) {
      setStep('datos');
      setEsDuplicado(true);
      setClienteSeleccionado({
        id: store.datosDuplicarPresupuesto.idCliente,
        nombreCompleto: store.datosDuplicarPresupuesto.nombreCliente,
        telefono: [],
        balance: 0,
        trabajosCount: 0,
        presupuestosCount: 0,
      });
      setTitulo(store.datosDuplicarPresupuesto.titulo);
      setDescripcion(store.datosDuplicarPresupuesto.descripcion);
      setHorasEstimadas(store.datosDuplicarPresupuesto.horasEstimadas);
      setMateriales(store.datosDuplicarPresupuesto.materiales);
    }
  }, [store.datosDuplicarPresupuesto, isOpen]);

  // Clear duplicar data after close
  useEffect(() => {
    if (!isOpen && store.datosDuplicarPresupuesto) {
      store.setDatosDuplicarPresupuesto(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredClientes = clientes.filter(c => 
    c.nombreCompleto.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setStep('datos');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!clienteSeleccionado) {
      newErrors.cliente = 'Selecciona un cliente';
    }
    
    if (!titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }
    
    if (horasEstimadas < 0) {
      newErrors.horasEstimadas = 'Las horas deben ser positivas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMaterial = () => {
    if (nuevoMaterial.descripcion.trim() && nuevoMaterial.cantidad > 0 && nuevoMaterial.precioUnitario > 0) {
      // Map precioUnitario to Precio for backend compatibility
      setMateriales([...materiales, { 
        descripcion: nuevoMaterial.descripcion, 
        cantidad: nuevoMaterial.cantidad, 
        Precio: nuevoMaterial.precioUnitario 
      }]);
      setNuevoMaterial({ descripcion: '', cantidad: 1, precioUnitario: 0 });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  const handleEditMaterial = (index: number) => {
    const m = materiales[index];
    setMaterialEditando(index);
    setMaterialEditandoData({
      descripcion: m.descripcion,
      cantidad: m.cantidad,
      precioUnitario: m.Precio || m.precioUnitario || 0,
    });
  };

  const handleSaveMaterial = (index: number) => {
    const nuevosMateriales = [...materiales];
    nuevosMateriales[index] = {
      descripcion: materialEditandoData.descripcion,
      cantidad: materialEditandoData.cantidad,
      Precio: materialEditandoData.precioUnitario,
    };
    setMateriales(nuevosMateriales);
    setMaterialEditando(null);
  };

  const handleCancelEditMaterial = () => {
    setMaterialEditando(null);
  };

  const totalMateriales = materiales.reduce((sum, m) => sum + (m.cantidad * (m.Precio || m.precioUnitario || 0)), 0);

  const isSubmitting = crearPresupuesto.isPending || modificarPresupuesto.isPending;

  const handleSubmit = async () => {
    if (!validate() || !clienteSeleccionado) return;
    
    try {
      if (isEditing && presupuestoId) {
        await modificarPresupuesto.mutateAsync({
          id: presupuestoId,
          presupuesto: {
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || undefined,
            horasEstimadas,
            materiales: materiales.length > 0 ? materiales : undefined,
          },
        });
      } else {
        await crearPresupuesto.mutateAsync({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || undefined,
          horasEstimadas,
          idCliente: clienteSeleccionado.id,
          materiales: materiales.length > 0 ? materiales : undefined,
        });
      }
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al guardar el presupuesto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.status === 500) {
          errorMessage = 'Error interno del servidor';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Recurso no encontrado';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => step === 'datos' ? setStep('cliente') : handleClose()} 
              className="btn-icon"
            >
              {step === 'cliente' ? (
                <X className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </button>
            <h2 className="font-semibold text-lg">
              {showSuccess ? '¡Listo!' : step === 'cliente' ? 'Seleccionar Cliente' : esDuplicado ? 'Duplicar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>
            <div className="w-11" />
          </div>
          
          {showSuccess ? (
            <div className="animate-scale-in text-center py-8">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}
              >
                <Check className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
              </div>
              <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
                Presupuesto creado
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {titulo}
              </p>
            </div>
          ) : step === 'cliente' ? (
            <div className="animate-fade-in">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
              
              {/* Cliente list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredClientes.map(cliente => (
                  <button
                    key={cliente.id}
                    onClick={() => handleSelectCliente(cliente)}
                    className={clsx(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      clienteSeleccionado?.id === cliente.id && 'border-2'
                    )}
                    style={{ 
                      backgroundColor: 'var(--color-surface)',
                      borderColor: clienteSeleccionado?.id === cliente.id ? 'var(--color-accent)' : 'transparent'
                    }}
                  >
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {cliente.nombreCompleto}
                    </p>
                    {cliente.telefono.length > 0 && (
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {cliente.telefono[0]}
                      </p>
                    )}
                  </button>
                ))}
                
                {filteredClientes.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
              {/* Cliente seleccionado */}
              <div 
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>CLIENTE</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {clienteSeleccionado?.nombreCompleto}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('cliente');
                    setSearch('');
                  }}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Cambiar
                </button>
              </div>
              
              {/* Título */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  TÍTULO *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Reparación de motor"
                  className="input"
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
                  DESCRIPCIÓN
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles del trabajo..."
                  className="input min-h-[80px] resize-none"
                />
              </div>
              
              {/* Horas estimadas */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  HORAS ESTIMADAS
                </label>
                <input
                  type="number"
                  value={horasEstimadas}
                  onChange={(e) => setHorasEstimadas(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="input"
                />
              </div>
              
              {/* Materiales */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  MATERIALES
                </label>
                
                {materiales.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {materiales.map((m, index) => (
                      materialEditando === index ? (
                        // Modo edición
                        <div 
                          key={index}
                          className="p-2 rounded"
                          style={{ backgroundColor: 'var(--color-surface)' }}
                        >
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            <input
                              type="text"
                              value={materialEditandoData.descripcion}
                              onChange={(e) => setMaterialEditandoData({ ...materialEditandoData, descripcion: e.target.value })}
                              placeholder="Material"
                              className="input col-span-2"
                            />
                            <input
                              type="number"
                              value={materialEditandoData.cantidad || ''}
                              onChange={(e) => setMaterialEditandoData({ ...materialEditandoData, cantidad: parseInt(e.target.value) || 0 })}
                              placeholder="Cant."
                              min={1}
                              className="input col-span-1"
                            />
                            <input
                              type="number"
                              value={materialEditandoData.precioUnitario || ''}
                              onChange={(e) => setMaterialEditandoData({ ...materialEditandoData, precioUnitario: parseFloat(e.target.value) || 0 })}
                              placeholder="Precio"
                              min={0}
                              className="input col-span-1"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              Subtotal: ${(materialEditandoData.cantidad * materialEditandoData.precioUnitario).toLocaleString()}
                            </p>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveMaterial(index)}
                                className="btn-icon p-1"
                              >
                                <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditMaterial}
                                className="btn-icon p-1"
                              >
                                <X className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Modo visualización
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: 'var(--color-surface)' }}
                        >
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleEditMaterial(index)}
                          >
                            <p className="text-sm font-medium truncate">{m.descripcion}</p>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              {m.cantidad} x ${(m.Precio || m.precioUnitario || 0).toLocaleString()} = ${(m.cantidad * (m.Precio || m.precioUnitario || 0)).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(index)}
                            className="btn-icon p-1 ml-2"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
                
                {/* Agregar material */}
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={nuevoMaterial.descripcion}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, descripcion: e.target.value })}
                    placeholder="Material"
                    className="input col-span-2"
                  />
                  <input
                    type="number"
                    value={nuevoMaterial.cantidad || ''}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, cantidad: parseInt(e.target.value) || 0 })}
                    placeholder="Cant."
                    min={1}
                    className="input col-span-1"
                  />
                  <input
                    type="number"
                    value={nuevoMaterial.precioUnitario || ''}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, precioUnitario: parseFloat(e.target.value) || 0 })}
                    placeholder="Precio"
                    min={0}
                    className="input col-span-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  disabled={!nuevoMaterial.descripcion.trim() || !nuevoMaterial.cantidad || !nuevoMaterial.precioUnitario}
                  className="btn-secondary w-full mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Material
                </button>
                
                {totalMateriales > 0 && (
                  <p className="text-right text-sm mt-2" style={{ color: 'var(--color-success)' }}>
                    Total materiales: ${totalMateriales.toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Submit */}
              {errors.submit && (
                <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
                  {errors.submit}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {isEditing ? 'Actualizar' : esDuplicado ? 'Crear Copia' : 'Crear Presupuesto'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
