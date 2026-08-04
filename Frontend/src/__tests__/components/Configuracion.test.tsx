import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Configuracion } from '../../pages/Configuracion';
import { useStore } from '../../store';
import { authService } from '../../services/auth';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../services/auth', () => ({
  authService: {
    cambiarContrasena: vi.fn(),
    cambiarRol: vi.fn(),
    refrescar: vi.fn(),
  },
  extractAuthErrorMessage: () => '',
}));

// Evita llamadas de red reales (query de costo hora + mutations).
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: 100 }),
    request: vi.fn().mockResolvedValue({ data: undefined }),
  },
}));

// PasskeySection trae hooks de passkeys y modales; se reemplaza por un stub.
vi.mock('../../components/PasskeySection', () => ({
  PasskeySection: () => <div data-testid="passkey-section" />,
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

/**
 * Genera un JWT de prueba con el payload indicado (header.payload.firma).
 * El rol viaja en el claim "role", igual que el JWT del backend.
 * Ej: crearToken({ role: 'Administrador' }).
 */
function crearToken(payload: unknown): string {
  return `header.${codificarBase64Url(JSON.stringify(payload))}.firma`;
}

function renderConfiguracion(accessToken: string | null) {
  useStore.setState({ accessToken });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Configuracion />
    </QueryClientProvider>
  );
}

/** El select y el botón Guardar viven dentro de la card "Rol de usuario" (hay
 *  otros botones "Guardar" en otras cards, así que se acota la búsqueda). */
function getRolCard(): HTMLElement {
  const heading = screen.getByText('Rol de usuario');
  return heading.closest('.card') as HTMLElement;
}

describe('Configuracion: visibilidad de la card "Rol de usuario" (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('muestra la card para un usuario Administrador', () => {
    renderConfiguracion(crearToken({ role: 'Administrador' }));
    expect(screen.getByText('Rol de usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Rol de usuario')).toBeInTheDocument();
  });

  it('oculta la card para un usuario Empleado', () => {
    renderConfiguracion(crearToken({ role: 'Empleado' }));
    expect(screen.queryByText('Rol de usuario')).not.toBeInTheDocument();
  });

  it('oculta la card para un usuario Cliente', () => {
    renderConfiguracion(crearToken({ role: 'Cliente' }));
    expect(screen.queryByText('Rol de usuario')).not.toBeInTheDocument();
  });

  it('oculta la card cuando el token no decodifica (fail-closed)', () => {
    renderConfiguracion('token-que-no-es-un-jwt');
    expect(screen.queryByText('Rol de usuario')).not.toBeInTheDocument();
  });

  it('oculta la card cuando no hay token', () => {
    renderConfiguracion(null);
    expect(screen.queryByText('Rol de usuario')).not.toBeInTheDocument();
  });

  it('deshabilita Guardar si la selección es el rol actual (no-op)', () => {
    renderConfiguracion(crearToken({ role: 'Administrador' }));
    const card = getRolCard();
    expect(within(card).getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('tras cambiar el rol propio a Empleado, refresca el token y oculta la card', async () => {
    const tokenAdmin = crearToken({ role: 'Administrador' });
    const tokenEmpleado = crearToken({ role: 'Empleado' });
    vi.mocked(authService.refrescar).mockResolvedValue({ accessToken: tokenEmpleado });
    vi.mocked(authService.cambiarRol).mockResolvedValue('Rol modificado');

    renderConfiguracion(tokenAdmin);
    expect(screen.getByText('Rol de usuario')).toBeInTheDocument();

    const card = getRolCard();
    fireEvent.change(within(card).getByLabelText('Rol de usuario'), {
      target: { value: 'Empleado' },
    });

    const botonGuardar = within(card).getByRole('button', { name: 'Guardar' });
    expect(botonGuardar).toBeEnabled();
    fireEvent.click(botonGuardar);

    // El nuevo JWT re-emite el claim role: el store se actualiza y la card se
    // oculta sola porque el rol derivado ya no es Administrador.
    await waitFor(() => expect(authService.cambiarRol).toHaveBeenCalledWith('Empleado'));
    await waitFor(() => expect(authService.refrescar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useStore.getState().accessToken).toBe(tokenEmpleado));
    await waitFor(() => expect(screen.queryByText('Rol de usuario')).not.toBeInTheDocument());
  });
});
