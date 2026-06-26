import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { useTrabajosPorCliente } from '../hooks/useTrabajos';
import { useCrearMovimiento } from '../hooks/useMovimientosCliente';
import type { TipoMovimiento } from '../types';
import { X, Loader2 } from 'lucide-react';

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function MovimientoModal() {
  const { showMovimientoModal, setShowMovimientoModal } = useStore();

  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idTrabajo, setIdTrabajo] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoMovimiento>('Pago');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(todayString());
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: trabajos, isLoading: loadingTrabajos } = useTrabajosPorCliente(idCliente ?? undefined);

  // Mutation
  const crearMovimiento = useCrearMovimiento();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente || !monto || !descripcion) {
      setError('Por favor completá los campos requeridos');
      return;
    }

    setError(null);

    try {
      await crearMovimiento.mutateAsync({
        idCliente: idCliente!,
        idTrabajo: idTrabajo ?? undefined,
        tipo,
        monto: parseFloat(monto),
        descripcion,
        fecha,
      });

      // Cerrar modal y limpiar form
      setShowMovimientoModal(false);
      resetForm();
    } catch (err) {
      setError('Error al registrar el movimiento. Intentalo de nuevo.');
      console.error(err);
    }
  };

  const resetForm = () => {
    setIdCliente(null);
    setIdTrabajo(null);
    setTipo('Pago');
    setMonto('');
    setDescripcion('');
    setFecha(todayString());
    setError(null);
  };

  const handleClose = () => {
    setShowMovimientoModal(false);
    resetForm();
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    setIdCliente(value);
    setIdTrabajo(null); // Reset trabajo cuando cambia el cliente
  };

  // Handle Escape key
  useEffect(() => {
    if (!showMovimientoModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMovimientoModal]);

  if (!showMovimientoModal) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Registrar Movimiento
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

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Cliente <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  value={idCliente ?? ''}
                  onChange={handleClienteChange}
                  className="search-input"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {loadingClientes ? (
                    <option>Cargando...</option>
                  ) : (
                    clientes?.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombreCompleto}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Trabajo (opcional) */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Trabajo <span style={{ color: 'var(--color-muted)' }}>(opcional)</span>
                </label>
                <select
                  value={idTrabajo ?? ''}
                  onChange={(e) => setIdTrabajo(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="search-input"
                  disabled={!idCliente || loadingTrabajos}
                >
                  <option value="">Seleccionar trabajo</option>
                  {idCliente && loadingTrabajos ? (
                    <option>Cargando...</option>
                  ) : (
                    trabajos?.map((trabajo) => (
                      <option key={trabajo.id} value={trabajo.id}>
                        {trabajo.titulo}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Tipo de movimiento */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Tipo <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
                  className="search-input"
                  required
                >
                  <option value="Pago">Pago</option>
                  <option value="Cargo">Cargo</option>
                  <option value="Anticipo">Anticipo</option>
                  <option value="Compra">Compra</option>
                  <option value="Ajuste">Ajuste</option>
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Monto <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="search-input"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Fecha <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="search-input"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Descripción <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="search-input min-h-[80px]"
                  placeholder="Descripción del movimiento"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
                disabled={crearMovimiento.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={crearMovimiento.isPending || !idCliente || !monto || !descripcion}
              >
                {crearMovimiento.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
