import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { useCrearPresupuesto } from '../hooks/usePresupuestos';
import type { Cliente, MaterialRequest } from '../types';
import { Loader2, X, Check, Plus, Trash2, Search, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export function PresupuestoForm() {
  const { showPresupuestoForm, setShowPresupuestoForm } = useStore();
  const { data: clientes = [] } = useClientes();
  const crearPresupuesto = useCrearPresupuesto();

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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClose = () => {
    setShowPresupuestoForm(false);
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
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPresupuestoForm) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showPresupuestoForm]);

  if (!showPresupuestoForm) return null;

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
      setMateriales([...materiales, { ...nuevoMaterial }]);
      setNuevoMaterial({ descripcion: '', cantidad: 1, precioUnitario: 0 });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  const totalMateriales = materiales.reduce((sum, m) => sum + (m.cantidad * m.precioUnitario), 0);

  const handleSubmit = async () => {
    if (!validate() || !clienteSeleccionado) return;
    
    try {
      await crearPresupuesto.mutateAsync({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        horasEstimadas,
        idCliente: clienteSeleccionado.id,
        materiales: materiales.length > 0 ? materiales : undefined,
      });
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al crear el presupuesto';
      
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
              {showSuccess ? '¡Listo!' : step === 'cliente' ? 'Seleccionar Cliente' : 'Nuevo Presupuesto'}
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
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>CLIENTE</p>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {clienteSeleccionado?.nombreCompleto}
                </p>
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
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.descripcion}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {m.cantidad} x ${m.precioUnitario.toLocaleString()} = ${(m.cantidad * m.precioUnitario).toLocaleString()}
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
                disabled={crearPresupuesto.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {crearPresupuesto.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Crear Presupuesto
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
