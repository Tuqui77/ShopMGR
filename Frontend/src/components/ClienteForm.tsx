import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useCrearCliente } from '../hooks/useClientes';
import { Loader2, X, Check, Plus, Trash2 } from 'lucide-react';

export function ClienteForm() {
  const { showClienteForm, setShowClienteForm } = useStore();
  const crearCliente = useCrearCliente();

  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonos, setTelefonos] = useState<string[]>([]);
  const [direccion, setDireccion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClose = () => {
    setShowClienteForm(false);
    setNombre('');
    setCuit('');
    setTelefono('');
    setTelefonos([]);
    setDireccion('');
    setErrors({});
    setShowSuccess(false);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showClienteForm) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showClienteForm]);

  if (!showClienteForm) return null;

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

  const handleAddTelefono = () => {
    if (telefono.trim() && !telefonos.includes(telefono.trim())) {
      setTelefonos([...telefonos, telefono.trim()]);
      setTelefono('');
    }
  };

  const handleRemoveTelefono = (index: number) => {
    setTelefonos(telefonos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      await crearCliente.mutateAsync({
        nombreCompleto: nombre.trim(),
        CUIT: cuit || undefined,
        telefono: telefonos,
        direccion: direccion.trim() || undefined,
      });
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('Error al crear el cliente. Intenta de nuevo.');
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
              {showSuccess ? '¡Listo!' : 'Nuevo Cliente'}
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
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="input flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTelefono();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddTelefono}
                    className="btn-secondary"
                    disabled={!telefono.trim()}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {telefonos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {telefonos.map((tel, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <span className="text-sm">{tel}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTelefono(index)}
                          className="btn-icon p-1"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Dirección */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  DIRECCIÓN (opcional)
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Rivadavia 1234"
                  className="input"
                />
              </div>
              
              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={crearCliente.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
              >
                {crearCliente.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Crear Cliente
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
