import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoursModal } from '../../components/HoursModal';
import { MovimientoModal } from '../../components/MovimientoModal';
import { useStore } from '../../store';

// ============================================================================
// Contexto del FAB (/clientes/:id) en HoursModal y MovimientoModal — issue #68.
// Se mockean las queries para aislar el cableado store → filtro/preselección.
// ============================================================================

const { trabajosMock, clientesMock } = vi.hoisted(() => ({
  trabajosMock: [
    { id: 1, titulo: 'Trabajo de Ana', estado: 'Pendiente', horasRegistradas: 0, fotosCount: 0, cliente: null, clienteId: 5 },
    { id: 2, titulo: 'Trabajo de Beto', estado: 'Iniciado', horasRegistradas: 2, fotosCount: 0, cliente: null, clienteId: 7 },
    { id: 3, titulo: 'Trabajo terminado Ana', estado: 'Terminado', horasRegistradas: 5, fotosCount: 0, cliente: null, clienteId: 5 },
  ],
  clientesMock: [
    { id: 5, nombreCompleto: 'Ana Perez', telefono: [], balance: 0, trabajosCount: 2, presupuestosCount: 0 },
    { id: 7, nombreCompleto: 'Beto Gomez', telefono: [], balance: 0, trabajosCount: 1, presupuestosCount: 0 },
  ],
}));

vi.mock('../../hooks/useTrabajos', () => ({
  useTrabajos: () => ({ data: trabajosMock }),
  useTrabajosPorCliente: () => ({ data: [], isLoading: false }),
  useAgregarHoras: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/useClientes', () => ({
  useClientes: () => ({ data: clientesMock }),
}));

vi.mock('../../hooks/useCostoHora', () => ({
  useCostoHora: () => ({ data: 100, isLoading: false }),
}));

vi.mock('../../hooks/useMovimientosCliente', () => ({
  useCrearMovimiento: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

/** Select de cliente (el primero del formulario de movimiento). */
function selectCliente(): HTMLSelectElement {
  return screen.getAllByRole('combobox')[0] as HTMLSelectElement;
}

describe('HoursModal — filtro por cliente en contexto (issue #68)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState(useStore.getInitialState());
  });

  it('filtra los trabajos activos del cliente y muestra el chip con su nombre', () => {
    useStore.setState({
      showHoursModal: true,
      hoursModalClienteInicial: 5,
      selectedTrabajo: null,
      lastTrabajoId: null,
    });

    render(<HoursModal />);

    // Sólo el trabajo ACTIVO del cliente 5 (ni el de 7, ni el terminado de 5)
    expect(screen.getByText('Trabajo de Ana')).toBeInTheDocument();
    expect(screen.queryByText('Trabajo de Beto')).not.toBeInTheDocument();
    expect(screen.queryByText('Trabajo terminado Ana')).not.toBeInTheDocument();

    // Chip con el nombre del cliente + botón para quitar el filtro
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro' })).toBeInTheDocument();

    // El valor del store se consumió (no se retiene)
    expect(useStore.getState().hoursModalClienteInicial).toBeNull();
  });

  it('al quitar el filtro vuelve a mostrar todos los trabajos activos', () => {
    useStore.setState({
      showHoursModal: true,
      hoursModalClienteInicial: 5,
      selectedTrabajo: null,
      lastTrabajoId: null,
    });

    render(<HoursModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro' }));

    expect(screen.getByText('Trabajo de Ana')).toBeInTheDocument();
    expect(screen.getByText('Trabajo de Beto')).toBeInTheDocument();
    expect(screen.queryByText('Trabajo terminado Ana')).not.toBeInTheDocument();
    expect(screen.queryByText('Ana Perez')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar filtro' })).not.toBeInTheDocument();
  });

  it('sin contexto muestra todos los trabajos activos y ningún chip', () => {
    useStore.setState({
      showHoursModal: true,
      hoursModalClienteInicial: null,
      selectedTrabajo: null,
      lastTrabajoId: null,
    });

    render(<HoursModal />);

    expect(screen.getByText('Trabajo de Ana')).toBeInTheDocument();
    expect(screen.getByText('Trabajo de Beto')).toBeInTheDocument();
    expect(screen.queryByText('Trabajo terminado Ana')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar filtro' })).not.toBeInTheDocument();
  });
});

describe('MovimientoModal — preselección de cliente desde contexto (issue #68)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState(useStore.getInitialState());
  });

  it('preselecciona el cliente en el select al abrir desde /clientes/:id', () => {
    useStore.setState({
      showMovimientoModal: true,
      movimientoModalClienteInicial: 7,
    });

    render(<MovimientoModal />);

    expect(selectCliente().value).toBe('7');
    expect(screen.getByText('Beto Gomez')).toBeInTheDocument();

    // El valor del store se consumió (no se retiene)
    expect(useStore.getState().movimientoModalClienteInicial).toBeNull();
  });

  it('sin contexto el select arranca vacío', () => {
    useStore.setState({
      showMovimientoModal: true,
      movimientoModalClienteInicial: null,
    });

    render(<MovimientoModal />);

    expect(selectCliente().value).toBe('');
  });
});
