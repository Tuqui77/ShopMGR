import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { User, Phone, MapPin, Wrench, FileText, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useCliente } from '../hooks/useClientes';

export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const clienteId = id ? parseInt(id, 10) : undefined;
  
  const { data: cliente, isLoading, error } = useCliente(clienteId);

  const formatBalance = (balance: number) => {
    if (balance > 0) return { text: `$${balance.toLocaleString()}`, class: 'text-[var(--color-success)]' };
    if (balance < 0) return { text: `$${Math.abs(balance).toLocaleString()}`, class: 'text-[var(--color-danger)]' };
    return { text: '$0', class: 'text-[var(--color-muted)]' };
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

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to="/clientes" className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </Link>
          <h1 className="text-xl font-bold font-display">Detalle del Cliente</h1>
        </div>
      </header>

      <section className="px-4 space-y-4">
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <User className="w-8 h-8" style={{ color: 'var(--color-muted)' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{cliente.nombreCompleto}</h2>
              <p className={clsx('text-2xl font-mono font-bold mt-1', balance.class)}>
                {balance.text}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {cliente.balance > 0 ? 'Saldo a favor' : cliente.balance < 0 ? 'Debe' : 'Al día'}
              </p>
            </div>
          </div>
        </div>

        {cliente.telefono.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>Teléfonos</h3>
            <div className="space-y-2">
              {cliente.telefono.map((tel, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-text)' }}>{tel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {cliente.direccion && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>Dirección</h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span style={{ color: 'var(--color-text)' }}>{cliente.direccion}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Trabajos</span>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>{cliente.trabajosCount}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Presupuestos</span>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>{cliente.presupuestosCount}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 px-4" style={{ color: 'var(--color-danger)' }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
