import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Loader2, X, Edit, Trash2, Save } from 'lucide-react';
import type { DireccionItem } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  direccionesService, 
  type ModificarDireccionRequest,
  type CrearDireccionRequest 
} from '../services/direcciones';

interface DireccionModalProps {
  direccion: DireccionItem;
  clienteId: number;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export function DireccionModal({ direccion, clienteId, isOpen, onClose, isNew = false }: DireccionModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    calle: '',
    altura: '',
    piso: '',
    departamento: '',
    descripcion: '',
    codigoPostal: '',
    ciudad: '',
  });

  useEffect(() => {
    if (direccion) {
      setFormData({
        calle: direccion.calle || '',
        altura: direccion.altura || '',
        piso: direccion.piso || '',
        departamento: direccion.departamento || '',
        descripcion: direccion.descripcion || '',
        codigoPostal: direccion.codigoPostal || '',
        ciudad: direccion.ciudad || '',
      });
    }
  }, [direccion]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const crearMut = useMutation({
    mutationFn: (data: CrearDireccionRequest) => 
      direccionesService.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      onClose();
    },
  });

  const modificarMut = useMutation({
    mutationFn: (data: ModificarDireccionRequest) => 
      direccionesService.modificar(direccion.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      setIsEditing(false);
      onClose();
    },
  });

  const eliminarMut = useMutation({
    mutationFn: () => direccionesService.eliminar(direccion.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
      onClose();
    },
  });

  const handleSave = () => {
    // Validar campos requeridos
    const newErrors: Record<string, string> = {};
    if (!formData.calle.trim()) newErrors.calle = 'La calle es requerida';
    if (!formData.altura.trim()) newErrors.altura = 'La altura es requerida';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    // Enviar null para campos vacíos que son nullables en el backend
    const direccionData: ModificarDireccionRequest = {
      calle: formData.calle,
      altura: formData.altura,
      piso: formData.piso || null,
      departamento: formData.departamento || null,
      descripcion: formData.descripcion || null,
      codigoPostal: formData.codigoPostal || null,
      ciudad: formData.ciudad || null,
    };
    
    if (isNew) {
      const crearData: CrearDireccionRequest = {
        idCliente: clienteId,
        calle: formData.calle,
        altura: formData.altura,
        piso: formData.piso || null,
        departamento: formData.departamento || null,
        descripcion: formData.descripcion || null,
        codigoPostal: formData.codigoPostal || null,
        ciudad: formData.ciudad || null,
      };
      crearMut.mutate(crearData);
    } else {
      modificarMut.mutate(direccionData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar esta dirección?')) {
      eliminarMut.mutate();
    }
  };

  if (!isOpen) return null;

  // Extract error from mutation
  const error = crearMut.error || modificarMut.error || eliminarMut.error;
  const isPending = crearMut.isPending || modificarMut.isPending || eliminarMut.isPending;
  const errorMessage = error 
    ? typeof error === 'string' 
      ? error 
      : (error as Error).message 
    : '';

  return (
    <div 
      className="modal-backdrop flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-surface)' }}>
          <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--color-text)' }}>
            {isNew ? 'Nueva Dirección' : 'Dirección'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 -mr-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            {/* Calle y Altura - Obligatorios */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={formData.calle}
                  onChange={(e) => {
                    setFormData({ ...formData, calle: e.target.value });
                    if (errors.calle) setErrors({ ...errors, calle: '' });
                  }}
                  disabled={!isEditing}
                  className={clsx('input', errors.calle && 'input-error')}
                  placeholder="Calle *"
                />
                {errors.calle && (
                  <span className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.calle}
                  </span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={formData.altura}
                  onChange={(e) => {
                    setFormData({ ...formData, altura: e.target.value });
                    if (errors.altura) setErrors({ ...errors, altura: '' });
                  }}
                  disabled={!isEditing}
                  className={clsx('input', errors.altura && 'input-error')}
                  placeholder="Altura *"
                />
                {errors.altura && (
                  <span className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.altura}
                  </span>
                )}
              </div>
            </div>

            {/* Ciudad - Obligatorio */}
            <div>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => {
                  setFormData({ ...formData, ciudad: e.target.value });
                  if (errors.ciudad) setErrors({ ...errors, ciudad: '' });
                }}
                disabled={!isEditing}
                className={clsx('input', errors.ciudad && 'input-error')}
                placeholder="Ciudad *"
              />
              {errors.ciudad && (
                <span className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.ciudad}
                </span>
              )}
            </div>

            {/* Piso y Departamento - Opcionales */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.piso}
                onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                disabled={!isEditing}
                className="input"
                placeholder="Piso"
              />

              <input
                type="text"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                disabled={!isEditing}
                className="input"
                placeholder="Dpto"
              />
            </div>

            {/* Código Postal - Opcional */}
            <input
              type="text"
              value={formData.codigoPostal}
              onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
              disabled={!isEditing}
              className="input"
              placeholder="Código Postal"
            />

            {/* Descripción - Opcional */}
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={!isEditing}
              className="input"
              placeholder="Descripción (ej: Casa, Local)"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--color-surface)' }}>
          {(isEditing || isNew) ? (
            <>
              <button 
                onClick={() => {
                  if (isNew) {
                    onClose();
                  } else {
                    setIsEditing(false);
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
                onClick={handleDelete}
                disabled={eliminarMut.isPending}
                className="btn-secondary flex items-center justify-center gap-2"
                style={{ color: 'var(--color-danger)' }}
              >
                {eliminarMut.isPending ? (
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
  );
}