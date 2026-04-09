import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  User,
  Check,
  X,
  Package,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useState } from 'react';
import { formatDate, formatCurrency } from '../utils/dateFormat';
import type { Presupuesto, EstadoPresupuesto, Cliente } from '../types';
import { useStore } from '../store';
import { PresupuestoForm } from '../components/PresupuestoForm';

// Tipos para DTOs raw del backend
interface TelefonoRaw {
  telefono: string;
}

interface DireccionRaw {
  calle: string;
  altura: string;
}

interface ClienteRaw {
  id: number;
  nombreCompleto: string;
  telefono?: { $id: string; $values: TelefonoRaw[] };
  direccion?: { $id: string; $values: DireccionRaw[] };
  balance?: number;
  trabajos?: { $id: string; $values: unknown[] };
  presupuestos?: { $id: string; $values: unknown[] };
}

interface MaterialRaw {
  id: number;
  descripcion: string;
  cantidad: number;
  precio: number;
}

interface MaterialesResponse {
  $id: string;
  $values: MaterialRaw[];
}

interface PresupuestoRaw {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoPresupuesto;
  fecha: string;
  horasEstimadas?: number;
  costoMateriales?: number;
  costoLabor?: number;
  costoInsumos?: number;
  total?: number;
  cliente?: ClienteRaw;
  materiales?: MaterialesResponse;
}

interface MaterialFrontend {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

function mapMateriales(dto: MaterialesResponse | undefined): MaterialFrontend[] {
  const values = dto?.$values || [];
  return values.map(m => ({
    id: m.id,
    descripcion: m.descripcion,
    cantidad: m.cantidad,
    precioUnitario: m.precio,
    subtotal: m.cantidad * m.precio,
  }));
}

function mapCliente(dto: ClienteRaw | null | undefined): Cliente {
  if (!dto) return { id: 0, nombreCompleto: '', telefono: [], balance: 0, trabajosCount: 0, presupuestosCount: 0 };
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: dto.telefono?.$values?.map(t => t.telefono) || [],
    direccion: dto.direccion?.$values?.[0]
      ? `${dto.direccion.$values[0].calle} ${dto.direccion.$values[0].altura}`
      : undefined,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.$values?.length || 0,
    presupuestosCount: dto.presupuestos?.$values?.length || 0,
  };
}

function mapPresupuestoBackend(dto: PresupuestoRaw): Presupuesto {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    estado: dto.estado,
    fecha: dto.fecha,
    cliente: mapCliente(dto.cliente),
    horasEstimadas: dto.horasEstimadas || 0,
    costoMateriales: dto.costoMateriales || 0,
    costoLabor: dto.costoLabor || 0,
    costoInsumos: dto.costoInsumos || 0,
    total: dto.total || 0,
    materiales: mapMateriales(dto.materiales),
  };
}

async function fetchPresupuestoDetalle(id: number): Promise<Presupuesto> {
  const response = await apiClient.get('/Presupuestos/ObtenerDetallePresupuesto', {
    params: { idPresupuesto: id },
  });
  return mapPresupuestoBackend(response.data);
}

export function PresupuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  const presupuestoId = id ? parseInt(id, 10) : undefined;
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { editingPresupuestoId, setEditingPresupuestoId } = useStore();

  const { data: presupuesto, isLoading, error } = useQuery({
    queryKey: ['presupuesto', presupuestoId],
    queryFn: () => fetchPresupuestoDetalle(presupuestoId!),
    enabled: typeof presupuestoId === 'number' && presupuestoId >= 0,
  });

  const aceptarMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, {
        estado: 'Aceptado',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, {
        estado: 'Rechazado',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/Presupuestos/EliminarPresupuesto?idPresupuesto=${id}`);
    },
    onSuccess: () => {
      window.location.href = '/presupuestos';
    },
  });

  const getStatusBadge = () => {
    if (!presupuesto) return null;
    
    const statusConfig: Record<EstadoPresupuesto, { class: string; label: string }> = {
      'Pendiente': { class: 'badge-warning', label: 'Pendiente' },
      'Aceptado': { class: 'badge-success', label: 'Aceptado' },
      'Rechazado': { class: 'badge-danger', label: 'Rechazado' },
    };
    
    const config = statusConfig[presupuesto.estado] || statusConfig['Pendiente'];
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const handleAceptar = async () => {
    if (presupuesto && confirm('¿Aceptar este presupuesto?')) {
      try {
        await aceptarMutation.mutateAsync(presupuesto.id);
      } catch (err) {
        console.error('Error al aceptar presupuesto:', err);
      }
    }
  };

  const handleRechazar = async () => {
    if (presupuesto && confirm('¿Rechazar este presupuesto?')) {
      try {
        await rechazarMutation.mutateAsync(presupuesto.id);
      } catch (err) {
        console.error('Error al rechazar presupuesto:', err);
      }
    }
  };

  const handleEliminar = async () => {
    if (presupuesto) {
      try {
        await eliminarMutation.mutateAsync(presupuesto.id);
      } catch (err) {
        console.error('Error al eliminar presupuesto:', err);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleEdit = () => {
    if (presupuesto) {
      setEditingPresupuestoId(presupuesto.id);
    }
  };

  const handleEditSuccess = () => {
    setEditingPresupuestoId(null);
    // Refetch presupuesto data
    queryClient.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error || !presupuesto) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--color-danger)' }}>Error al cargar presupuesto</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>¿El backend está corriendo?</p>
          <Link to="/presupuestos" className="btn-secondary mt-4 inline-block">
            Volver a presupuestos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to="/presupuestos" className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display">Detalle del Presupuesto</h1>
          </div>
          {getStatusBadge()}
        </div>
      </header>

      <section className="px-4 space-y-4">
        {/* Card principal */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{presupuesto.titulo}</h2>
          
          {presupuesto.descripcion && (
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>{presupuesto.descripcion}</p>
          )}
          
          {presupuesto.cliente && (
            <Link 
              to={`/clientes/${presupuesto.cliente.id}`}
              className="flex items-center gap-3 mb-4 p-3 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-elevated)' }}>
                <User className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{presupuesto.cliente.nombreCompleto}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {presupuesto.cliente.telefono[0] || 'Sin teléfono'}
                </p>
              </div>
            </Link>
          )}
          
          {/* Fecha */}
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            <Clock className="w-4 h-4" />
            <span>Fecha: {formatDate(presupuesto.fecha)}</span>
          </div>
        </div>

        {/* Materiales */}
        {presupuesto.materiales && presupuesto.materiales.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>MATERIALES</span>
            </div>
            
            <div className="space-y-2">
              {presupuesto.materiales.map(material => (
                <div 
                  key={material.id}
                  className="flex justify-between items-center p-2 rounded"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{material.descripcion}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {material.cantidad} x {formatCurrency(material.precioUnitario || 0)}
                    </p>
                  </div>
                  <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                    {formatCurrency((material.subtotal) || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totales */}
        <div className="card">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Horas estimadas</span>
              <span style={{ color: 'var(--color-text)' }}>{presupuesto.horasEstimadas}h</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Costo materiales</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(presupuesto.costoMateriales || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Costo mano de obra</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(presupuesto.costoLabor || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Insumos</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(presupuesto.costoInsumos || 0)}
              </span>
            </div>
            <div 
              className="flex justify-between pt-2 border-t"
              style={{ borderColor: 'var(--color-surface)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>TOTAL</span>
              <span className="font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
                {formatCurrency((presupuesto.total) || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          {presupuesto.estado === 'Pendiente' && (
            <div className="flex gap-3">
              <button 
                onClick={handleAceptar}
                disabled={aceptarMutation.isPending}
                className="btn-primary flex items-center justify-center gap-2 max-w-[160px]"
              >
                {aceptarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Aceptar
              </button>
              <button 
                onClick={handleRechazar}
                disabled={rechazarMutation.isPending}
                className="btn-secondary flex items-center justify-center gap-2 max-w-[160px]"
                style={{ color: 'var(--color-danger)' }}
              >
                {rechazarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Rechazar
              </button>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleEdit}
              className="btn-secondary flex items-center justify-center gap-2 max-w-[160px]"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary flex items-center justify-center gap-2 px-4"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="modal-content">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-lg font-semibold mb-2">¿Eliminar presupuesto?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleEliminar}
                  disabled={eliminarMutation.isPending}
                  style={{ 
                    backgroundColor: 'var(--color-danger)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.625rem 1rem'
                  }}
                >
                  {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Presupuesto Form for editing */}
      {editingPresupuestoId && (
        <PresupuestoForm 
          presupuestoId={editingPresupuestoId}
          isOpen={true}
          onClose={() => setEditingPresupuestoId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
