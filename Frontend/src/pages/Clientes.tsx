import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Search, User, Phone, MapPin, Wrench, FileText, Loader2 } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';

type FilterType = 'todos' | 'conDeuda' | 'nuevos';

export function Clientes() {
  const { data: clientes, isLoading, error } = useClientes();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('todos');
  
  const filtered = (clientes || []).filter(c => {
    const matchesSearch = 
      c.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.some(t => t.includes(search));
    
    if (filter === 'conDeuda') return matchesSearch && c.balance < 0;
    if (filter === 'nuevos') return matchesSearch && c.trabajosCount === 0;
    return matchesSearch;
  });
  
  const formatBalance = (balance: number) => {
    if (balance > 0) return { text: `$${balance.toLocaleString()}`, class: 'text-[var(--color-success)]' };
    if (balance < 0) return { text: `$${Math.abs(balance).toLocaleString()}`, class: 'text-[var(--color-danger)]' };
    return { text: '$0', class: 'text-[var(--color-muted)]' };
  };
  
  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return 'a favor';
    if (balance < 0) return 'adeuda';
    return 'al día';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--color-danger)' }}>Error al cargar clientes</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>¿El backend está corriendo?</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <h1 className="text-xl font-bold font-display mb-4">Clientes</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-muted)' }} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {(['todos', 'conDeuda', 'nuevos'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx('filter-pill', filter === f && 'active')}
            >
              {f === 'todos' && 'Todos'}
              {f === 'conDeuda' && 'Con deuda'}
              {f === 'nuevos' && 'Nuevos'}
            </button>
          ))}
        </div>
      </header>
      
      {/* List */}
      <section className="px-4 space-y-3">
        {filtered.map(cliente => {
          const balance = formatBalance(cliente.balance);
          const label = getBalanceLabel(cliente.balance);
          
          return (
            <Link 
              key={cliente.id} 
              to={`/clientes/${cliente.id}`}
              className="block card"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <User className="w-6 h-6" style={{ color: 'var(--color-muted)' }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{cliente.nombreCompleto}</h3>
                  
                  {cliente.telefono[0] && (
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                      <Phone className="w-4 h-4" />
                      {cliente.telefono[0]}
                    </p>
                  )}
                  
                  {cliente.direccion && (
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                      <MapPin className="w-4 h-4" />
                      {cliente.direccion}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className={clsx('text-sm font-mono', balance.class)}>
                      {balance.text}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({label})</span>
                  </div>
                  
                  <div className="mt-2 flex gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {cliente.trabajosCount} trabajos</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {cliente.presupuestosCount} presupuestos</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-muted)' }}>No se encontraron clientes</p>
          </div>
        )}
      </section>
    </div>
  );
}
