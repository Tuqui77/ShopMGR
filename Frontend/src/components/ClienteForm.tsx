import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useStore } from '../store';
import { useCrearCliente, useModificarCliente } from '../hooks/useClientes';
import type { Cliente } from '../types';
import { Loader2, X, Check } from 'lucide-react';

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
  const [calle, setCalle] = useState(cliente?.direccionesCompletas?.[0]?.calle || '');
  const [altura, setAltura] = useState(cliente?.direccionesCompletas?.[0]?.altura || '');
  const [ciudad, setCiudad] = useState(cliente?.direccionesCompletas?.[0]?.ciudad || '');
  const [piso, setPiso] = useState(cliente?.direccionesCompletas?.[0]?.piso || '');
  const [departamento, setDepartamento] = useState(cliente?.direccionesCompletas?.[0]?.departamento || '');
  const [descripcion, setDescripcion] = useState(cliente?.direccionesCompletas?.[0]?.descripcion || '');
  const [codigoPostal, setCodigoPostal] = useState(cliente?.direccionesCompletas?.[0]?.codigoPostal || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const formVisible = isEditing || showClienteForm;

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
    setCalle('');
    setAltura('');
    setCiudad('');
    setPiso('');
    setDepartamento('');
    setDescripcion('');
    setCodigoPostal('');
    setErrors({});
    setShowSuccess(false);
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

    const telefono = telefonoInput.trim();
    if (telefono && telefono.length < 10) {
      newErrors.telefono = 'El teléfono debe tener al menos 10 dígitos';
    }

    const tieneCalle = calle.trim().length > 0;
    const tieneAltura = altura.trim().length > 0;
    const tieneCiudad = ciudad.trim().length > 0;

    if (tieneCalle || tieneAltura || tieneCiudad || tienePiso || tieneDepartamento || tieneDescripcion || tieneCodigoPostal) {
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

  const tieneCalle = calle.trim().length > 0;
  const tieneAltura = altura.trim().length > 0;
  const tieneCiudad = ciudad.trim().length > 0;
  const tienePiso = piso.trim().length > 0;
  const tieneDepartamento = departamento.trim().length > 0;
  const tieneDescripcion = descripcion.trim().length > 0;
  const tieneCodigoPostal = codigoPostal.trim().length > 0;
  const tieneDireccion = tieneCalle || tieneAltura || tieneCiudad || tienePiso || tieneDepartamento || tieneDescripcion || tieneCodigoPostal;

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isEditing && cliente) {
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
              mapsID: null,
            }]
          : undefined;

        // Issue #117: el teléfono es un único campo opcional con descripción opcional.
        // Si hay teléfono se envía con la descripción escrita o el default "Principal".
        // Si no hay teléfono, la descripción se ignora y se envía lista vacía.
        const telefono = telefonoInput.trim();
        const descripcionTelefono = telefonoDesc.trim();

        await crearCliente.mutateAsync({
          nombreCompleto: nombre.trim(),
          telefono: telefono
            ? [{ telefono, descripcion: descripcionTelefono || 'Principal' }]
            : [],
          direccion: direccionData,
        });
      }
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error('Error al guardar cliente:', error);

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

  return formVisible ? (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {showSuccess ? '¡Listo!' : isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="btn-icon"
              aria-label="Cerrar"
            >
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
            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className={clsx('input', errors.nombre && 'input-error')}
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

              {/* Edit mode: note about phones/addresses | Create mode: show phone/address fields */}
              {isEditing ? (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Los teléfonos y direcciones del cliente se editan desde su ficha de detalle.
                  </p>
                </div>
              ) : (
                <>
                  {/* Teléfono y descripción (create mode only) */}
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={telefonoInput}
                      onChange={(e) => {
                        setTelefonoInput(e.target.value);
                        if (errors.telefono) {
                          setErrors(prev => ({ ...prev, telefono: '' }));
                        }
                      }}
                      placeholder="Número de teléfono"
                      className={clsx('input', errors.telefono && 'input-error')}
                    />
                    {errors.telefono && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                        {errors.telefono}
                      </p>
                    )}
                    <input
                      type="text"
                      value={telefonoDesc}
                      onChange={(e) => setTelefonoDesc(e.target.value)}
                      placeholder="Descripción (ej: Celular, Trabajo)"
                      className="input mt-2"
                    />
                  </div>

                  {/* Dirección (create mode only) */}
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>
                      Dirección (opcional)
                    </label>
                    <div className="space-y-2">
                      {/* Calle y Altura */}
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

                      {/* Ciudad */}
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

                      {/* Piso y Departamento */}
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

                      {/* Código Postal */}
                      <input
                        type="text"
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        placeholder="Código Postal"
                        className="input"
                      />

                      {/* Descripción */}
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

              {/* Submit error */}
              {errors.submit && (
                <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
                  {errors.submit}
                </p>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={crearCliente.isPending || modificarCliente.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
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
