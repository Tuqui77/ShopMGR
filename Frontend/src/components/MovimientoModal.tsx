import { useState } from 'react';
import { useStore } from '../store';
import { useClientes } from '../hooks/useClientes';
import { useTrabajosPorCliente } from '../hooks/useTrabajos';
import { movimientosService, type TipoMovimiento } from '../services/movimientos';
import { X, Loader2 } from 'lucide-react';

export function MovimientoModal() {
  const { showMovimientoModal, setShowMovimientoModal } = useStore();
  
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idTrabajo, setIdTrabajo] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoMovimiento>('Pago');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: trabajos, isLoading: loadingTrabajos } = useTrabajosPorCliente(idCliente ?? undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idCliente || !monto || !descripcion) {
      setError('Por favor completá los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await movimientosService.crear({
        idCliente: idCliente!,
        idTrabajo: idTrabajo ?? undefined,
        tipo,
        monto: parseFloat(monto),
        descripcion,
      });
      
      // Cerrar modal y limpiar form
      setShowMovimientoModal(false);
      resetForm();
    } catch (err) {
      setError('Error al registrar el movimiento. Intentalo de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIdCliente(null);
    setIdTrabajo(null);
    setTipo('Pago');
    setMonto('');
    setDescripcion('');
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

  if (!showMovimientoModal) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Registrar Movimiento</h2>
              <button 
                type="button"
                onClick={handleClose} 
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cliente <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium mb-1">
                  Trabajo <span className="text-gray-400">(opcional)</span>
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
                <label className="block text-sm font-medium mb-1">
                  Tipo <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium mb-1">
                  Monto <span className="text-red-500">*</span>
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

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción <span className="text-red-500">*</span>
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
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isSubmitting || !idCliente || !monto || !descripcion}
              >
                {isSubmitting ? (
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