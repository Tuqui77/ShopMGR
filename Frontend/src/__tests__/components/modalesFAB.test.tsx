import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useStore } from '../../store';
import { HorasTrabajoModal } from '../../components/HorasTrabajoModal';
import { MovimientosClienteModal } from '../../components/MovimientosClienteModal';

vi.mock('../../hooks/useTrabajos', () => ({
  useModificarHoras: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEliminarHoras: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/useMovimientosCliente', () => ({
  useMovimientosCliente: () => ({ data: [], isLoading: false, error: null }),
  useModificarMovimiento: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEliminarMovimiento: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Issue #98: los modales locales de detalle deben ocultar el FAB global seteando
// `isDetailModalOpen` en el store mientras están abiertos.
describe('modales de detalle ocultan el FAB (issue #98)', () => {
  beforeEach(() => {
    useStore.setState({ isDetailModalOpen: false });
  });

  it('HorasTrabajoModal setea el flag al abrirse y lo limpia al cerrarse', () => {
    const props = {
      trabajoId: 1,
      nombreTrabajo: 'Trabajo test',
      horas: [],
      isLoading: false,
      totalHoras: 0,
      horasEstimadas: 4,
      onClose: vi.fn(),
    };

    const { rerender } = render(<HorasTrabajoModal {...props} isOpen={false} />);
    expect(useStore.getState().isDetailModalOpen).toBe(false);

    rerender(<HorasTrabajoModal {...props} isOpen={true} />);
    expect(useStore.getState().isDetailModalOpen).toBe(true);

    rerender(<HorasTrabajoModal {...props} isOpen={false} />);
    expect(useStore.getState().isDetailModalOpen).toBe(false);
  });

  it('MovimientosClienteModal setea el flag al abrirse y lo limpia al cerrarse', () => {
    const props = {
      clienteId: 1,
      nombreCliente: 'Cliente test',
      onClose: vi.fn(),
    };

    const { rerender } = render(<MovimientosClienteModal {...props} isOpen={false} />);
    expect(useStore.getState().isDetailModalOpen).toBe(false);

    rerender(<MovimientosClienteModal {...props} isOpen={true} />);
    expect(useStore.getState().isDetailModalOpen).toBe(true);

    rerender(<MovimientosClienteModal {...props} isOpen={false} />);
    expect(useStore.getState().isDetailModalOpen).toBe(false);
  });

  it('al desmontar un modal abierto el flag vuelve a false', () => {
    const props = {
      trabajoId: 1,
      nombreTrabajo: 'Trabajo test',
      horas: [],
      isLoading: false,
      totalHoras: 0,
      onClose: vi.fn(),
    };

    const { unmount } = render(<HorasTrabajoModal {...props} isOpen={true} />);
    expect(useStore.getState().isDetailModalOpen).toBe(true);

    unmount();
    expect(useStore.getState().isDetailModalOpen).toBe(false);
  });
});
