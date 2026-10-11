import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { useStore } from '../../store';

// ============================================================================
// Mocks — se verifica el CABLEADO de ProtectedLayout (path → clienteContextoId
// → setters del store), no el markup del FAB ni el contenido de las páginas.
// ============================================================================

// Stub del FAB: expone botones que invocan onAction directamente.
type FabAction = 'hours' | 'trabajo' | 'cliente' | 'presupuesto' | 'movimiento';

vi.mock('../../components/FAB', async () => {
  const React = await import('react');
  const acciones: FabAction[] = ['hours', 'trabajo', 'presupuesto', 'movimiento'];
  return {
    FAB: ({ onAction }: { onAction: (a: FabAction) => void }) =>
      React.createElement(
        'div',
        null,
        ...acciones.map((accion) =>
          React.createElement(
            'button',
            { key: accion, 'data-testid': `fab-${accion}`, onClick: () => onAction(accion) },
            `FAB ${accion}`,
          ),
        ),
      ),
  };
});

// Layout/formularios pesados → stubs. Evita queries de red al importar.
vi.mock('../../components/BottomNav', () => ({ BottomNav: () => null }));
vi.mock('../../components/HoursModal', () => ({ HoursModal: () => null }));
vi.mock('../../components/ClienteForm', () => ({ ClienteForm: () => null }));
vi.mock('../../components/PresupuestoForm', () => ({ PresupuestoForm: () => null }));
vi.mock('../../components/TrabajoForm', () => ({ TrabajoForm: () => null }));
vi.mock('../../components/MovimientoModal', () => ({ MovimientoModal: () => null }));

// Páginas lazy relevantes → stubs con data-testid.
vi.mock('../../pages/ClienteDetalle', async () => {
  const React = await import('react');
  return {
    ClienteDetalle: () => React.createElement('div', { 'data-testid': 'cliente-detalle-stub' }),
  };
});

vi.mock('../../pages/Trabajos', async () => {
  const React = await import('react');
  return {
    Trabajos: () => React.createElement('div', { 'data-testid': 'trabajos-stub' }),
  };
});

// Sidebar real usa authService (solo cerrarSesion en logout).
vi.mock('../../services/auth', () => ({
  authService: { cerrarSesion: vi.fn() },
}));

// ============================================================================
// Helpers
// ============================================================================

// Misma codificación que espera utils/jwt: base64url sin padding.
function codificarBase64Url(texto: string): string {
  let binario = '';
  for (const byte of new TextEncoder().encode(texto)) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function crearToken(payload: unknown): string {
  return `header.${codificarBase64Url(JSON.stringify(payload))}.firma`;
}

function renderAppEn(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

// ============================================================================
// Tests — issue #68: el FAB global precarga el cliente cuando estamos en
// /clientes/:id (mismo comportamiento que el empty-state contextual).
// ============================================================================

describe('FAB precarga cliente desde /clientes/:id (issue #68)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    useStore.getState().logout();
    useStore.setState({
      accessToken: crearToken({}),
      trabajoFormClienteInicial: null,
      presupuestoFormClienteInicial: null,
      hoursModalClienteInicial: null,
      movimientoModalClienteInicial: null,
      showTrabajoForm: false,
      showPresupuestoForm: false,
      showHoursModal: false,
      showMovimientoModal: false,
    });
  });

  it('preselecciona el cliente al crear un trabajo desde /clientes/:id', async () => {
    renderAppEn('/clientes/5');
    await screen.findByTestId('cliente-detalle-stub');

    fireEvent.click(screen.getByTestId('fab-trabajo'));

    expect(useStore.getState().trabajoFormClienteInicial).toBe(5);
    expect(useStore.getState().showTrabajoForm).toBe(true);
  });

  it('preselecciona el cliente al crear un presupuesto desde /clientes/:id', async () => {
    renderAppEn('/clientes/42');
    await screen.findByTestId('cliente-detalle-stub');

    fireEvent.click(screen.getByTestId('fab-presupuesto'));

    expect(useStore.getState().presupuestoFormClienteInicial).toBe(42);
    expect(useStore.getState().showPresupuestoForm).toBe(true);
  });

  it('NO preselecciona fuera de /clientes/:id (ej. /trabajos)', async () => {
    renderAppEn('/trabajos');
    await screen.findByTestId('trabajos-stub');

    fireEvent.click(screen.getByTestId('fab-trabajo'));

    expect(useStore.getState().trabajoFormClienteInicial).toBeNull();
    expect(useStore.getState().showTrabajoForm).toBe(true);
  });

  it('NO preselecciona cuando el id de la ruta no es numérico', async () => {
    renderAppEn('/clientes/abc');
    await screen.findByTestId('cliente-detalle-stub');

    fireEvent.click(screen.getByTestId('fab-presupuesto'));

    expect(useStore.getState().presupuestoFormClienteInicial).toBeNull();
    expect(useStore.getState().showPresupuestoForm).toBe(true);
  });

  it('preselecciona el cliente al registrar horas desde /clientes/:id', async () => {
    renderAppEn('/clientes/7');
    await screen.findByTestId('cliente-detalle-stub');

    fireEvent.click(screen.getByTestId('fab-hours'));

    expect(useStore.getState().hoursModalClienteInicial).toBe(7);
    expect(useStore.getState().showHoursModal).toBe(true);
  });

  it('preselecciona el cliente al registrar un movimiento desde /clientes/:id', async () => {
    renderAppEn('/clientes/9');
    await screen.findByTestId('cliente-detalle-stub');

    fireEvent.click(screen.getByTestId('fab-movimiento'));

    expect(useStore.getState().movimientoModalClienteInicial).toBe(9);
    expect(useStore.getState().showMovimientoModal).toBe(true);
  });

  it('NO preselecciona horas/movimiento fuera de /clientes/:id (ej. /trabajos)', async () => {
    renderAppEn('/trabajos');
    await screen.findByTestId('trabajos-stub');

    fireEvent.click(screen.getByTestId('fab-hours'));
    fireEvent.click(screen.getByTestId('fab-movimiento'));

    expect(useStore.getState().hoursModalClienteInicial).toBeNull();
    expect(useStore.getState().movimientoModalClienteInicial).toBeNull();
    expect(useStore.getState().showHoursModal).toBe(true);
    expect(useStore.getState().showMovimientoModal).toBe(true);
  });
});
