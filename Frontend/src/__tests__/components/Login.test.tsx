import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Login } from '../../pages/Login';
import { useStore } from '../../store';
import { authService } from '../../services/auth';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refrescar: vi.fn(),
    cerrarSesion: vi.fn(),
    cambiarContrasena: vi.fn(),
    cambiarRol: vi.fn(),
    cambiarContrasenaAdmin: vi.fn(),
    restaurarContraseña: vi.fn(),
    listarUsuarios: vi.fn(),
  },
  extractAuthErrorMessage: () => '',
}));

// El hook de passkeys orquesta WebAuthn nativo (no disponible en jsdom):
// se reemplaza por un stub para aislar el flujo del modal de cambio (#99).
vi.mock('../../hooks/usePasskeyLogin', () => ({
  usePasskeyLogin: () => ({
    iniciarConPasskey: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

// ============================================================================
// Helpers de prueba
// ============================================================================

/** Renderiza Login dentro de un router con una ruta "/" de destino para
 *  verificar la navegación tras el login / el cambio de contraseña. */
function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div data-testid="dashboard-stub">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

/** Completa y envía el form de login (usuario + contraseña). */
async function iniciarSesion() {
  fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'juan' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto' } });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  // Espera a que el login resuelva (el mock es async).
  await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
}

/** Abre el modal de cambio obligatorio simulando un login con código. */
async function abrirModalCambio() {
  vi.mocked(authService.login).mockResolvedValue({
    accessToken: 'token-codigo',
    requiereCambioContraseña: true,
  });
  renderLogin();
  await iniciarSesion();
  await screen.findByRole('dialog');
}

// ============================================================================
// Tests
// ============================================================================

describe('Login: modal de cambio de contraseña obligatorio (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('navega a "/" tras un login normal sin requiereCambioContraseña', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'token-ok',
      requiereCambioContraseña: false,
    });

    renderLogin();
    await iniciarSesion();

    await waitFor(() => expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument());
    expect(authService.login).toHaveBeenCalledWith({ userName: 'juan', password: 'secreto' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mantiene el form de login visible y abre el modal cuando requiereCambioContraseña es true', async () => {
    await abrirModalCambio();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cambio de contraseña obligatorio' })).toBeInTheDocument();

    // El form de login sigue en el DOM detrás del modal (no se desmonta).
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();

    // No navega hasta completar el cambio.
    expect(screen.queryByTestId('dashboard-stub')).not.toBeInTheDocument();

    // El flag del store evita que LoginPage redirija antes de completar el cambio.
    expect(useStore.getState().cambioContraseñaPendiente).toBe(true);
    expect(useStore.getState().accessToken).toBe('token-codigo');
  });

  it('muestra error cuando las contraseñas no coinciden', async () => {
    await abrirModalCambio();

    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'nueva123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'otra456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(authService.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('llama cambiarContrasena(null, nueva) y navega a "/" al completar el cambio', async () => {
    vi.mocked(authService.cambiarContrasena).mockResolvedValue('Contraseña modificada');
    await abrirModalCambio();

    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'nueva123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'nueva123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    await waitFor(() =>
      expect(authService.cambiarContrasena).toHaveBeenCalledWith(null, 'nueva123'),
    );
    await waitFor(() => expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument());
    await waitFor(() => expect(useStore.getState().cambioContraseñaPendiente).toBe(false));
  });

  it('"Cerrar sesión" hace logout y deja el form de login intacto', async () => {
    await abrirModalCambio();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useStore.getState().accessToken).toBeNull();
    expect(useStore.getState().cambioContraseñaPendiente).toBe(false);
    // El form de login sigue visible para una nueva sesión.
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });
});
