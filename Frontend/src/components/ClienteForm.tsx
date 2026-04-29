import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useStore } from '../store';
import { useCrearCliente, useModificarCliente } from '../hooks/useClientes';
import type { Cliente } from '../types';
import { Loader2, X, Check, Plus, Trash2, Pencil } from 'lucide-react';

interface ClienteFormProps {
  cliente?: Cliente;  // Si se pasa cliente, es modo edición
}

export function ClienteForm({ cliente }: ClienteFormProps) {
  // ALL hooks must be called unconditionally - no early returns allowed!
  // Use conditional rendering in JSX instead
  
  const isEditing = !!cliente;
  const { showClienteForm, setShowClienteForm, setEditingCliente } = useStore();
  const crearCliente = useCrearCliente();
  const modificarCliente = useModificarCliente();
  
  // Initialize state with cliente data if editing
  const [nombre, setNombre] = useState(cliente?.nombreCompleto || '');
  const [cuit, setCuit] = useState(cliente?.cuit || '');
  
  // Only needed for create mode
  const [telefonoInput, setTelefonoInput] = useState('');
  const [telefonoDesc, setTelefonoDesc] = useState('');
  const [telefonos, setTelefonos] = useState<{ id: number; telefono: string; descripcion: string }[]>(
    () => {
      if (!cliente?.telefonosCompletos && !cliente?.telefono) return [];
      if (cliente.telefonosCompletos && Array.isArray(cliente.telefonosCompletos)) {
        return cliente.telefonosCompletos.map(t => ({
          id: t.id || 0,
          telefono: t.telefono,
          descripcion: t.descripcion || 'Principal',
        }));
      } else if (cliente.telefono && Array.isArray(cliente.telefono)) {
        return cliente.telefono.map((t: unknown, idx: number) => ({
          id: idx,
          telefono: typeof t === 'string' ? t : String(t),
          descripcion: 'Principal',
        }));
      }
      return [];
    }
  );
  const [calle, setCalle] = useState(cliente?.direcciones?.[0]?.calle || '');
  const [altura, setAltura] = useState(cliente?.direcciones?.[0]?.altura || '');
  const [ciudad, setCiudad] = useState(cliente?.direcciones?.[0]?.ciudad || '');
  const [piso, setPiso] = useState(cliente?.direcciones?.[0]?.piso || '');
  const [departamento, setDepartamento] = useState(cliente?.direcciones?.[0]?.departamento || '');
  const [descripcion, setDescripcion] = useState(cliente?.direcciones?.[0]?.descripcion || '');
  const [codigoPostal, setCodigoPostal] = useState(cliente?.direcciones?.[0]?.codigoPostal || '');
  
  const [editingTelefonoIndex, setEditingTelefonoIndex] = useState<number | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const formVisible = isEditing || showClienteForm;
 
  // useCallback needs to be at top level, before any conditionals
  const handleClose = useCallback(() => {
    if (isEditing) {
      setEditingCliente(null);
    } else {
      setShowClienteForm(false);
    }
    setNombre('');
    setCuit('');
    setTelefonoInput('');
    setTelefonoDesc('');
    setTelefonos([]);
    setCalle('');
    setAltura('');
    setCiudad('');
    setPiso('');
    setDepartamento('');
    setDescripcion('');
    setCodigoPostal('');
    setErrors({});
    setShowSuccess(false);
    setEditingTelefonoIndex(null);
  }, [isEditing, setEditingCliente, setShowClienteForm]);
  
  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formVisible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [formVisible, handleClose]);

  // NO early return here - use conditional rendering in JSX instead

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.length > 100) {
      newErrors.nombre = 'Máximo 100 caracteres';
    }
    
    if (cuit && !/^\d{11}$/.test(cuit.replace(/[-\s]/g, ''))) {
      newErrors.cuit = 'CUIT debe tener 11 dígitos';
    }
    
    // Validar dirección (si se ingresa algo)
    const tieneCalle = calle.trim().length > 0;
    const tieneAltura = altura.trim().length > 0;
    const tieneCiudad = ciudad.trim().length > 0;
    
    if (tieneCalle || tieneAltura || tieneCiudad || tienePiso || tieneDepartamento || tieneDescripcion || tieneCodigoPostal) {
      // Si se ingresa cualquier campo de dirección, los obligatorios deben estar presentes
      if (!tieneCalle) {
        newErrors.calle = 'La calle es requerida';
      }
      if (!tieneAltura) {
        newErrors.altura = 'La altura es requerida';
      }
      if (!tieneCiudad) {
        newErrors.ciudad = 'La ciudad es requerida';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Helper para validar individualmente (para validación en tiempo real)
  const tieneCalle = calle.trim().length > 0;
  const tieneAltura = altura.trim().length > 0;
  const tieneCiudad = ciudad.trim().length > 0;
  const tienePiso = piso.trim().length > 0;
  const tieneDepartamento = departamento.trim().length > 0;
  const tieneDescripcion = descripcion.trim().length > 0;
  const tieneCodigoPostal = codigoPostal.trim().length > 0;
  const tieneDireccion = tieneCalle || tieneAltura || tieneCiudad || tienePiso || tieneDepartamento || tieneDescripcion || tieneCodigoPostal;

  const handleRemoveTelefono = (index: number) => {
    setTelefonos(telefonos.filter((_, i) => i !== index));
  };

  const handleEditTelefono = (index: number) => {
    const tel = telefonos[index];
    setTelefonoInput(tel.telefono);
    setTelefonoDesc(tel.descripcion);
    setEditingTelefonoIndex(index);
  };

  const handleAddTelefono = () => {
    if (!telefonoInput.trim()) return;
    
    if (editingTelefonoIndex !== null) {
      // Editando teléfono existente
      const nuevosTelefonos = [...telefonos];
      nuevosTelefonos[editingTelefonoIndex] = {
        id: telefonos[editingTelefonoIndex].id,
        telefono: telefonoInput.trim(),
        descripcion: telefonoDesc.trim() || 'Principal'
      };
      setTelefonos(nuevosTelefonos);
      setEditingTelefonoIndex(null);
    } else {
      // Agregando nuevo teléfono
      const telefonoObj = { 
        id: 0, // ID 0 indica que es nuevo
        telefono: telefonoInput.trim(), 
        descripcion: telefonoDesc.trim() || 'Principal' 
      };
      if (!telefonos.some(t => t.telefono === telefonoObj.telefono)) {
        setTelefonos([...telefonos, telefonoObj]);
      }
    }
    setTelefonoInput('');
    setTelefonoDesc('');
  };

  const handleCancelEditTelefono = () => {
    setTelefonoInput('');
    setTelefonoDesc('');
    setEditingTelefonoIndex(null);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      if (isEditing && cliente) {
        // Enviar solo los campos que se modificaron
        await modificarCliente.mutateAsync({
          id: cliente.id,
          cliente: {
            nombreCompleto: nombre.trim(),
            Cuit: cuit || null,
          },
        });
      } else {
        const direccionData = tieneDireccion 
          ? [{ 
              calle: calle.trim(), 
              altura: altura.trim(),
              ciudad: ciudad.trim() || null,
              codigoPostal: codigoPostal.trim() || null,
              descripcion: descripcion.trim() || null,
              piso: piso.trim() || null,
              departamento: departamento.trim() || null,
              mapsID: null
            }] 
          : undefined;
          
        await crearCliente.mutateAsync({
          nombreCompleto: nombre.trim(),
          telefono: telefonos,
          direccion: direccionData,
        });
      }
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = isEditing ? 'Error al modificar el cliente' : 'Error al crear el cliente';
      
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

  // Use conditional rendering in JSX instead of early return
  // to satisfy React's Rules of Hooks
  return formVisible ? (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-11" />
            <h2 className="font-semibold text-lg">
              {showSuccess ? '¡Listo!' : isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button onClick={handleClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
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
                Cliente creado
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {nombre}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  NOMBRE *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="input"
                  maxLength={100}
                />
                {errors.nombre && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.nombre}
                  </p>
                )}
              </div>
              
              {/* CUIT */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  CUIT (opcional)
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="20-12345678-9"
                  className="input"
                />
                {errors.cuit && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.cuit}
                  </p>
                )}
              </div>
              
              {/* Edit mode: show note about phones/addresses | Create mode: show phone/address fields */}
              {isEditing ? (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Los teléfonos y direcciones del cliente se editan desde su ficha de detalle.
                  </p>
                </div>
              ) : (
                <>
                  {/* Teléfonos (create mode only) */}
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                      TELÉFONOS
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={telefonoInput}
                          onChange={(e) => setTelefonoInput(e.target.value)}
                          placeholder="Número de teléfono"
                          className="input flex-1"
                        />
                        <button 
                          type="button"
                          onClick={handleAddTelefono}
                          className="btn-secondary"
                          disabled={!telefonoInput.trim()}
                        >
                          {editingTelefonoIndex !== null ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </button>
                        {editingTelefonoIndex !== null && (
                          <button 
                            type="button"
                            onClick={handleCancelEditTelefono}
                            className="btn-secondary"
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={telefonoDesc}
                        onChange={(e) => setTelefonoDesc(e.target.value)}
                        placeholder="Descripción (ej: Celular, Trabajo)"
                        className="input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTelefono();
                          }
                        }}
                      />
                      
                      {telefonos.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {telefonos.map((tel, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 rounded"
                              style={{ backgroundColor: 'var(--color-surface)' }}
                            >
                              <div>
                                <span className="text-sm">{tel.telefono}</span>
                                <span className="text-xs ml-2" style={{ color: 'var(--color-muted)' }}>
                                  ({tel.descripcion})
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditTelefono(index)}
                                  className="btn-icon p-1"
                                >
                                  <Pencil className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTelefono(index)}
                                  className="btn-icon p-1"
                                >
                                  <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dirección (create mode only) */}
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                      DIRECCIÓN (opcional)
                    </label>
                    <div className="space-y-2">
                      {/* Calle y Altura - Obligatorios */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={calle}
                            onChange={(e) => setCalle(e.target.value)}
                            placeholder="Calle *"
                            className={clsx('input', errors.calle && 'input-error')}
                          />
                          {errors.calle && (
                            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                              {errors.calle}
                            </p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            placeholder="Altura *"
                            className={clsx('input', errors.altura && 'input-error')}
                          />
                          {errors.altura && (
                            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                              {errors.altura}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Ciudad - Obligatorio */}
                      <div>
                        <input
                          type="text"
                          value={ciudad}
                          onChange={(e) => setCiudad(e.target.value)}
                          placeholder="Ciudad *"
                          className={clsx('input', errors.ciudad && 'input-error')}
                        />
                        {errors.ciudad && (
                          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                            {errors.ciudad}
                          </p>
                        )}
                      </div>
                      
                      {/* Piso y Departamento - Opcionales */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={piso}
                          onChange={(e) => setPiso(e.target.value)}
                          placeholder="Piso"
                          className="input"
                        />
                        <input
                          type="text"
                          value={departamento}
                          onChange={(e) => setDepartamento(e.target.value)}
                          placeholder="Dpto"
                          className="input"
                        />
                      </div>
                      
                      {/* Código Postal - Opcional */}
                      <input
                        type="text"
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        placeholder="Código Postal"
                        className="input"
                      />
                      
                      {/* Descripción - Opcional */}
                      <input
                        type="text"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción (ej: Casa, Frente, etc.)"
                        className="input"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Submit */}
              {errors.submit && (
                <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
                  {errors.submit}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={crearCliente.isPending || modificarCliente.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {crearCliente.isPending || modificarCliente.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;
}
