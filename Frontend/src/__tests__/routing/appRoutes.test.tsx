import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { useStore } from '../../store';

// ============================================================================
// Mocks — stubs ligeros: verifican el RUTEO (path → componente correcto), no
// el contenido de las páginas. Se evita así disparar queries de red.
// ============================================================================

// Páginas → stubs con data-testid. Factory asíncrono con React.createElement:
// los factories de vi.mock se hoistean y no pueden usar el JSX del archivo.
vi.mock('../../pages/Login', async () => {
  const React = await import('react');
  return {
    Login: () => React.createElement('div', { 'data-testid': 'login-stub' }, 'Login'),
  };
});

vi.mock('../../pages/Dashboard', async () => {
  const React = await import('react');
  return {
    Dashboard: () => React.createElement('div', { 'data-testid': 'dashboard-stub' }, 'Dashboard'),
  };
});

vi.mock('../../pages/Clientes', async () => {
  const React = await import('react');
  return {
    Clientes: () => React.createElement('div', { 'data-testid': 'clientes-stub' }, 'Clientes'),
  };
});

// El stub de detalle lee useParams para verificar que los params siguen
// funcionando bajo React.lazy (la página se monta bajo el contexto de la ruta).
vi.mock('../../pages/ClienteDetalle', async () => {
  const React = await import('react');
  const { useParams } = await import('react-router-dom');
  return {
    ClienteDetalle: () => {
      const { id } = useParams();
      return React.createElement('div', { 'data-testid': 'cliente-detalle-stub' }, `id=${id ?? ''}`);
    },
  };
});

vi.mock('../../pages/Trabajos', async () => {
  const React = await import('react');
  return {
    Trabajos: () => React.createElement('div', { 'data-testid': 'trabajos-stub' }, 'Trabajos'),
  };
});

vi.mock('../../pages/TrabajoDetalle', async () => {
  const React = await import('react');
  return {
    TrabajoDetalle: () =>
      React.createElement('div', { 'data-testid': 'trabajo-detalle-stub' }, 'TrabajoDetalle'),
  };
});

vi.mock('../../pages/Presupuestos', async () => {
  const React = await import('react');
  return {
    Presupuestos: () =>
      React.createElement('div', { 'data-testid': 'presupuestos-stub' }, 'Presupuestos'),
  };
});

vi.mock('../../pages/PresupuestoDetalle', async () => {
  const React = await import('react');
  return {
    PresupuestoDetalle: () =>
      React.createElement('div', { 'data-testid': 'presupuesto-detalle-stub' }, 'PresupuestoDetalle'),
  };
});

vi.mock('../../pages/Configuracion', async () => {
  const React = await import('react');
  return {
    Configuracion: () =>
      React.createElement('div', { 'data-testid': 'configuracion-stub' }, 'Configuracion'),
  };
});

vi.mock('../../pages/Perfil', async () => {
  const React = await import('react');
  return {
    Perfil: () => React.createElement('div', { 'data-testid': 'perfil-stub' }, 'Perfil'),
  };
});

// Layout pesado → no renderiza nada. El Sidebar REAL se conserva para poder
// testear la navegación por click entre secciones.
vi.mock('../../components/BottomNav', () => ({ BottomNav: () => null }));
vi.mock('../../components/FAB', () => ({ FAB: () => null }));
vi.mock('../../components/HoursModal', () => ({ HoursModal: () => null }));
vi.mock('../../components/ClienteForm', () => ({ ClienteForm: () => null }));
vi.mock('../../components/PresupuestoForm', () => ({ PresupuestoForm: () => null }));
vi.mock('../../components/TrabajoForm', () => ({ TrabajoForm: () => null }));
vi.mock('../../components/MovimientoModal', () => ({ MovimientoModal: () => null }));

// authService: lo usa el Sidebar real (solo cerrarSesion se invoca en logout).
vi.mock('../../services/auth', () => ({
  authService: {
    cerrarSesion: vi.fn(),
  },
}));

// ============================================================================
// Helpers de prueba
// ============================================================================

// Misma codificación que espera utils/jwt: base64url sin padding.
function codificarBase64Url(texto: string): string {
  let binario = '';
  for (const byte of new TextEncoder().encode(texto)) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Genera un JWT de prueba con header.payload.firma (issue #112). */
function crearToken(payload: unknown): string {
  return `header.${codificarBase64Url(JSON.stringify(payload))}.firma`;
}

/** Renderiza la App completa en un path de la URL (BrowserRouter real de App). */
function renderAppEn(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

// ============================================================================
// Tests
// ============================================================================

describe('Routing (issue #67: lazy loading de páginas)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('redirige a /login cuando no hay sesión', async () => {
    renderAppEn('/clientes');
    expect(await screen.findByTestId('login-stub')).toBeInTheDocument();
  });

  it('redirige a / desde /login cuando ya hay sesión', async () => {
    useStore.setState({ accessToken: crearToken({}) });
    renderAppEn('/login');
    expect(await screen.findByTestId('dashboard-stub')).toBeInTheDocument();
  });

  it('renderiza Dashboard en /', async () => {
    useStore.setState({ accessToken: crearToken({}) });
    renderAppEn('/');
    expect(await screen.findByTestId('dashboard-stub')).toBeInTheDocument();
  });

  it.each([
    ['/clientes', 'clientes-stub'],
    ['/trabajos', 'trabajos-stub'],
    ['/presupuestos', 'presupuestos-stub'],
    ['/configuracion', 'configuracion-stub'],
    ['/perfil', 'perfil-stub'],
  ])('renderiza el stub de %s (ruta lazy)', async (path, testId) => {
    useStore.setState({ accessToken: crearToken({}) });
    renderAppEn(path);
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it('pasa los params de la ruta a la página lazy (useParams)', async () => {
    useStore.setState({ accessToken: crearToken({}) });
    renderAppEn('/clientes/42');
    const stub = await screen.findByTestId('cliente-detalle-stub');
    expect(stub.textContent).toContain('id=42');
  });

  it('navega entre secciones desde el Sidebar real', async () => {
    useStore.setState({ accessToken: crearToken({}) });
    renderAppEn('/');
    await screen.findByTestId('dashboard-stub');

    fireEvent.click(screen.getByRole('link', { name: 'Clientes' }));
    expect(await screen.findByTestId('clientes-stub')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Trabajos' }));
    expect(await screen.findByTestId('trabajos-stub')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Presupuestos' }));
    expect(await screen.findByTestId('presupuestos-stub')).toBeInTheDocument();
  });
});
