import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useState } from 'react';
import { User, Phone, MapPin, Wrench, FileText, Loader2, ArrowLeft, Edit, Trash2, ChevronRight, Plus } from 'lucide-react';
import { useClienteDetalle, useEliminarCliente } from '../hooks/useClientes';
import { useStore } from '../store';
import { formatDate, formatCurrency } from '../utils/dateFormat';
import { ClienteForm } from '../components/ClienteForm';
import { DireccionModal } from '../components/DireccionModal';
import { TelefonoModal } from '../components/TelefonoModal';
import type { DireccionItem, TelefonoCompleto } from '../types';

export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const clienteId = id ? parseInt(id, 10) : undefined;
  
  const { data: cliente, isLoading, error } = useClienteDetalle(clienteId!);
  const eliminarCliente = useEliminarCliente();
  const { editingCliente, setEditingCliente } = useStore();
  
  // Estado para modal de dirección
  const [selectedDireccion, setSelectedDireccion] = useState<DireccionItem | null>(null);
  // Estado para modal de teléfono
  const [selectedTelefono, setSelectedTelefono] = useState<TelefonoCompleto | null>(null);
  // Estado para crear nuevo teléfono
  const [showNewTelefono, setShowNewTelefono] = useState(false);
  // Estado para crear nueva dirección
  const [showNewDireccion, setShowNewDireccion] = useState(false);
  
  // Handle edit button
  const handleEdit = () => {
    if (cliente) {
      // Build telefono as string[] (required by Cliente interface)
      const telefonosStrings = (cliente.telefonosCompletos || []).map(t => t.telefono);
      
      setEditingCliente({
        id: cliente.id,
        nombreCompleto: cliente.nombreCompleto,
        // Use telefonos for the string[] field (required by interface)
        telefono: telefonosStrings,
        direccion: cliente.direccion || '',
        balance: cliente.balance,
        trabajosCount: cliente.trabajosCount,
        presupuestosCount: cliente.presupuestosCount,
        // Include optional fields
        telefonosCompletos: cliente.telefonosCompletos,
        direccionesCompletas: cliente.direccionesCompletas,
        trabajosRecientes: cliente.trabajosRecientes,
        presupuestosRecientes: cliente.presupuestosRecientes,
        // Include CUIT
        cuit: cliente.cuit,
      });
    }
  };
  
  // Handle delete button
  const handleDelete = async () => {
    if (cliente && window.confirm(`¿Estás seguro de eliminar el cliente "${cliente.nombreCompleto}"?`)) {
      try {
        await eliminarCliente.mutateAsync(cliente.id);
        // Navigate back after delete
        window.location.href = '/clientes';
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const formatBalance = (balance: number) => {
    if (balance > 0) return { text: formatCurrency(balance), class: 'text-[var(--color-success)]' };
    if (balance < 0) return { text: formatCurrency(balance), class: 'text-[var(--color-danger)]' };
    return { text: formatCurrency(0), class: 'text-[var(--color-muted)]' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--color-danger)' }}>Error al cargar cliente</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>¿El backend está corriendo?</p>
          <Link to="/clientes" className="btn-secondary mt-4 inline-block">
            Volver a clientes
          </Link>
        </div>
      </div>
    );
  }

  const balance = formatBalance(cliente.balance);
  const hasTelefonos = cliente.telefonosCompletos && cliente.telefonosCompletos.length > 0;
  const hasDireccion = cliente.direccionesCompletas && cliente.direccionesCompletas.length > 0;
  const hasTrabajos = cliente.trabajosRecientes && cliente.trabajosRecientes.length > 0;
  const hasPresupuestos = cliente.presupuestosRecientes && cliente.presupuestosRecientes.length > 0;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <div className="flex items-center gap-3">
          <Link to="/clientes" className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </Link>
          <h1 className="text-xl font-bold font-display">Detalle del Cliente</h1>
        </div>
      </header>

      <section className="px-4 space-y-4">
        {/* Compact Header Card */}
        <div className="card flex items-center gap-3 py-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-surface)' }}>
            <User className="w-6 h-6" style={{ color: 'var(--color-muted)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{cliente.nombreCompleto}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {cliente.balance > 0 ? 'Saldo a favor' : cliente.balance < 0 ? 'Debe' : 'Al día'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={clsx('text-xl font-bold font-mono', balance.class)}>
              {balance.text}
            </p>
          </div>
        </div>

        {/* Contact Info - Side by side with independent heights */}
        {(hasTelefonos || hasDireccion) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hasTelefonos && (
              <div className="card py-3 self-start">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Teléfonos
                  </h3>
                  <button 
                    onClick={() => setShowNewTelefono(true)}
                    className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                    title="Agregar teléfono"
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {cliente.telefonosCompletos!.map((tel) => (
                    <div 
                      key={tel.id} 
                      className="flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-[var(--color-surface)] cursor-pointer transition-colors group"
                      onClick={() => setSelectedTelefono(tel)}
                    >
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm truncate block" style={{ color: 'var(--color-text)' }}>{tel.telefono}</span>
                        {tel.descripcion && (
                          <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>{tel.descripcion}</span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-muted)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasDireccion && (
              <div className="card py-3 self-start">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Dirección
                  </h3>
                  <button 
                    onClick={() => setShowNewDireccion(true)}
                    className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                    title="Agregar dirección"
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {cliente.direccionesCompletas!.map((dir) => (
                    <div 
                      key={dir.id} 
                      className="flex items-start gap-2 p-2 -mx-2 rounded-lg hover:bg-[var(--color-surface)] cursor-pointer transition-colors group"
                      onClick={() => setSelectedDireccion(dir)}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm block" style={{ color: 'var(--color-text)' }}>
                          {dir.calle} {dir.altura}
                          {dir.piso ? `, P${dir.piso}` : ''}
                          {dir.departamento ? `, D${dir.departamento}` : ''}
                          {dir.ciudad ? `, ${dir.ciudad}` : ''}
                        </span>
                        {dir.descripcion && (
                          <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>{dir.descripcion}</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 float-right opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Counters - Two Column Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to={`/trabajos?cliente=${cliente.id}`}
            className="card flex items-center justify-between py-3 hover:border-[var(--color-accent)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Trabajos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--color-text)' }}>{cliente.trabajosCount}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </div>
          </Link>

          <Link 
            to={`/presupuestos?cliente=${cliente.id}`}
            className="card flex items-center justify-between py-3 hover:border-[var(--color-accent)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Presup.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--color-text)' }}>{cliente.presupuestosCount}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </div>
          </Link>
        </div>

        {/* Recent Items - Two Column Grid */}
        {(hasTrabajos || hasPresupuestos) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hasTrabajos && (
              <div className="card py-3">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Trabajos Recientes
                </h3>
                <div className="space-y-1">
                  {cliente.trabajosRecientes!.map((trabajo) => (
                    <Link 
                      key={trabajo.id}
                      to={`/trabajos/${trabajo.id}`}
                      className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {trabajo.estado} · {formatDate(trabajo.fechaInicio) || 'Sin fecha'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-muted)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hasPresupuestos && (
              <div className="card py-3">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Presupuestos Recientes
                </h3>
                <div className="space-y-1">
                  {cliente.presupuestosRecientes!.map((presupuesto) => (
                    <Link 
                      key={presupuesto.id}
                      to={`/presupuestos/${presupuesto.id}`}
                      className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{presupuesto.titulo}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {presupuesto.estado} · {formatDate(presupuesto.fecha) || 'Sin fecha'}
                          {presupuesto.total && ` · ${formatCurrency(presupuesto.total)}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-muted)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleEdit}
            className="btn-secondary flex items-center justify-center gap-2 max-w-[140px]"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button 
            onClick={handleDelete}
            disabled={eliminarCliente.isPending}
            className="btn-secondary flex items-center justify-center gap-2 px-4"
            style={{ color: 'var(--color-danger)' }}
          >
            {eliminarCliente.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </section>
      
      {/* Cliente Form for editing */}
      {editingCliente && <ClienteForm cliente={editingCliente} />}
      
      {/* Direccion Modal */}
      {selectedDireccion && clienteId && (
        <DireccionModal 
          direccion={selectedDireccion} 
          clienteId={clienteId} 
          isOpen={!!selectedDireccion} 
          onClose={() => setSelectedDireccion(null)} 
        />
      )}

      {/* Telefono Modal - Ver/Editar existente */}
      {selectedTelefono && clienteId && (
        <TelefonoModal 
          telefono={selectedTelefono} 
          clienteId={clienteId} 
          isOpen={!!selectedTelefono} 
          onClose={() => setSelectedTelefono(null)} 
        />
      )}

      {/* Telefono Modal - Crear nuevo */}
      {showNewTelefono && clienteId && (
        <TelefonoModal 
          clienteId={clienteId} 
          isOpen={showNewTelefono} 
          onClose={() => setShowNewTelefono(false)}
          isNew={true}
        />
      )}

      {/* Direccion Modal - Crear nuevo (usando el modal existente con datos vacíos) */}
      {showNewDireccion && clienteId && (
        <DireccionModal 
          direccion={{ id: 0, calle: '', altura: '', ciudad: '' }} 
          clienteId={clienteId} 
          isOpen={showNewDireccion} 
          onClose={() => setShowNewDireccion(false)}
          isNew={true}
        />
      )}
    </div>
  );
}
