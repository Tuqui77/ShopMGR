import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useCrearCliente, useModificarCliente } from '../hooks/useClientes';
import type { Cliente } from '../types';
import { Loader2, X, Check, Plus, Trash2, Pencil } from 'lucide-react';

interface ClienteFormProps {
  cliente?: Cliente;  // Si se pasa cliente, es modo edición
}

export function ClienteForm({ cliente }: ClienteFormProps) {
  const isEditing = !!cliente;
  const { showClienteForm, setShowClienteForm, setEditingCliente } = useStore();
  const crearCliente = useCrearCliente();
  const modificarCliente = useModificarCliente();
  
  // El estado del store se usa solo en modo creación
  // En modo edición, se usa la prop directamente
  const formVisible = isEditing || showClienteForm;

  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefonoInput, setTelefonoInput] = useState('');
  const [telefonoDesc, setTelefonoDesc] = useState('');
  const [telefonos, setTelefonos] = useState<{ telefono: string; descripcion: string }[]>([]);
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingTelefonoIndex, setEditingTelefonoIndex] = useState<number | null>(null);

  const handleClose = () => {
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
    setErrors({});
    setShowSuccess(false);
    setEditingTelefonoIndex(null);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formVisible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [formVisible]);

  if (!formVisible) return null;

  // Cargar datos del cliente en modo edición
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombreCompleto || '');
      setCuit(cliente.cuit || '');
      
      // Cargar teléfonos desde telefonosCompletos (estructura con descripcion)
      if (cliente.telefonosCompletos && Array.isArray(cliente.telefonosCompletos)) {
        setTelefonos(cliente.telefonosCompletos.map(t => ({
          telefono: t.telefono,
          descripcion: t.descripcion || 'Principal',
        })));
      } else if (cliente.telefono && Array.isArray(cliente.telefono)) {
        // Fallback: telefono como array de strings
        const telefonosData = cliente.telefono.map((t: unknown) => {
          if (typeof t === 'string') return { telefono: t, descripcion: 'Principal' };
          return t as { telefono: string; descripcion: string };
        });
        setTelefonos(telefonosData);
      }
      
      // Cargar dirección desde direccionesCompletas
      if (cliente.direccionesCompletas && cliente.direccionesCompletas.length > 0) {
        const dir = cliente.direccionesCompletas[0];
        setCalle(dir.calle || '');
        setAltura(dir.altura || '');
      } else if (cliente.direccion) {
        // Fallback: direccion como string
        const parts = cliente.direccion.split(' ');
        if (parts.length >= 2) {
          setCalle(parts.slice(0, -1).join(' '));
          setAltura(parts[parts.length - 1]);
        }
      }
    }
  }, [cliente]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        telefono: telefonoInput.trim(),
        descripcion: telefonoDesc.trim() || 'Principal'
      };
      setTelefonos(nuevosTelefonos);
      setEditingTelefonoIndex(null);
    } else {
      // Agregando nuevo teléfono
      const telefonoObj = { 
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
        await modificarCliente.mutateAsync({
          id: cliente.id,
          cliente: {
            nombreCompleto: nombre.trim(),
            Cuit: cuit || undefined,
            telefono: telefonos,
            direccion: calle.trim() && altura.trim() 
              ? [{ calle: calle.trim(), altura: altura.trim() }] 
              : undefined,
          },
        });
      } else {
        await crearCliente.mutateAsync({
          nombreCompleto: nombre.trim(),
          Cuit: cuit || undefined,
          telefono: telefonos,
          direccion: calle.trim() && altura.trim() 
            ? [{ calle: calle.trim(), altura: altura.trim() }] 
            : undefined,
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

  return (
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
              
              {/* Teléfonos */}
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
              
              {/* Dirección */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  DIRECCIÓN (opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    placeholder="Calle"
                    className="input"
                  />
                  <input
                    type="text"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="Altura"
                    className="input"
                  />
                </div>
              </div>
              
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
  );
}
