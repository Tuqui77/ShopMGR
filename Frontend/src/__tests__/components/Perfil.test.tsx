import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Perfil } from '../../pages/Perfil';
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
    // React Query v5 rechaza data undefined: el mock base devuelve lista vacía.
    listarUsuarios: vi.fn().mockResolvedValue([]),
    restaurarContraseña: vi.fn(),
    cambiarContrasenaAdmin: vi.fn(),
    cerrarSesion: vi.fn(),
  },
  extractAuthErrorMessage: () => '',
}));

// PasskeySection trae hooks de passkeys y modales; se reemplaza por un stub
// (su comportamiento ya está cubierto por PasskeySection.test.tsx).
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

/** Genera un JWT de prueba con formato header.payload.firma (issue #112). */
function crearToken(payload: unknown): string {
  return `header.${codificarBase64Url(JSON.stringify(payload))}.firma`;
}

function renderPerfil(accessToken: string | null) {
  useStore.setState({ accessToken });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Perfil />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Perfil (issue #112): página de perfil del usuario', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('muestra el nombre de usuario y el rol sin mostrar el id', () => {
    renderPerfil(crearToken({ role: 'Empleado', nameid: '7', unique_name: 'Juan' }));
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Empleado')).toBeInTheDocument();
    // El id del token (nameid '7') NO debe mostrarse en la UI.
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('no muestra el id aunque el token lo traiga (fail-safe sobre nameid)', () => {
    renderPerfil(crearToken({ role: 'Administrador', nameid: '42' }));
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('muestra "—" en el nombre cuando el token no trae el claim', () => {
    renderPerfil(crearToken({ role: 'Empleado', nameid: '7' }));
    expect(screen.getByText('Empleado')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('muestra la sección de seguridad con el formulario de cambio de contraseña', () => {
    renderPerfil(crearToken({ role: 'Empleado' }));
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument();
  });

  it('cambia la contraseña llamando a authService.cambiarContrasena (issue #99)', async () => {
    vi.mocked(authService.cambiarContrasena).mockResolvedValue('Contraseña modificada');
    renderPerfil(crearToken({ role: 'Empleado' }));

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'vieja123' } });
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'nueva123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(authService.cambiarContrasena).toHaveBeenCalledWith('vieja123', 'nueva123'),
    );
  });

  it('valida campos vacíos antes de llamar al servicio (issue #99)', () => {
    renderPerfil(crearToken({ role: 'Empleado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(authService.cambiarContrasena).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Completá la contraseña actual y la nueva.',
    );
  });

  it('muestra la gestión de passkeys embebida (issue #112/#113)', () => {
    renderPerfil(crearToken({ role: 'Empleado' }));
    expect(screen.getByTestId('passkey-section')).toBeInTheDocument();
  });

  it('muestra el botón "Cerrar sesión" solo en móvil (issue #121: logout móvil en el perfil)', () => {
    renderPerfil(crearToken({ role: 'Empleado' }));
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' });
    expect(boton).toHaveAttribute('title', 'Cerrar sesión');
    // Solo icono: sin texto visible, y oculto en desktop (lg:!hidden) porque el
    // Sidebar tiene su propio logout.
    expect(boton.textContent).toBe('');
    expect(boton.className).toContain('lg:!hidden');
  });

  it('el botón "Cerrar sesión" llama a authService.cerrarSesion y limpia el store', async () => {
    vi.mocked(authService.cerrarSesion).mockResolvedValue(undefined);
    renderPerfil(crearToken({ role: 'Empleado' }));
    expect(useStore.getState().accessToken).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(authService.cerrarSesion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useStore.getState().accessToken).toBeNull());
  });
});

// ============================================================================
// Administrar usuarios (issue #99, movido desde Configuración en #112)
// ============================================================================

/** El select y los botones de acciones viven dentro de la card "Administrar
 *  usuarios" (hay otros botones "Guardar" en otras cards, así que se acota la
 *  búsqueda al heading). */
function getAdminUsersCard(): HTMLElement {
  const heading = screen.getByText('Administrar usuarios');
  return heading.closest('.card') as HTMLElement;
}

/** Selecciona un usuario en el dropdown y espera a que aparezcan sus acciones.
 *  El select se renderiza recién cuando el query de usuarios resuelve: se espera
 *  con findBy* en lugar de un get síncrono. */
async function seleccionarUsuario(card: HTMLElement, id: string) {
  const select = await within(card).findByLabelText('Usuario');
  fireEvent.change(select, { target: { value: id } });
  await waitFor(() =>
    expect(within(card).getByRole('button', { name: 'Restaurar contraseña' })).toBeInTheDocument(),
  );
}

const USUARIOS_MOCK = [
  { id: 1, userName: 'admin', rol: 'Administrador' },
  { id: 2, userName: 'juan', rol: 'Empleado' },
] as const;

describe('Perfil: visibilidad de "Administrar usuarios" (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('muestra la card para un usuario Administrador', async () => {
    renderPerfil(crearToken({ role: 'Administrador' }));
    expect(screen.getByText('Administrar usuarios')).toBeInTheDocument();
    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument();
  });

  it('oculta la card para un usuario Empleado', () => {
    renderPerfil(crearToken({ role: 'Empleado' }));
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card para un usuario Cliente', () => {
    renderPerfil(crearToken({ role: 'Cliente' }));
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card cuando el token no decodifica (fail-closed)', () => {
    renderPerfil('token-que-no-es-un-jwt');
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card cuando no hay token', () => {
    renderPerfil(null);
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });
});

describe('Perfil: administrar usuarios (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
    vi.mocked(authService.listarUsuarios).mockResolvedValue([...USUARIOS_MOCK]);
  });

  it('carga la lista y muestra las acciones al seleccionar un usuario', async () => {
    renderPerfil(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();

    await waitFor(() => expect(authService.listarUsuarios).toHaveBeenCalledTimes(1));

    await seleccionarUsuario(card, '2');
    expect(within(card).getByLabelText('Nuevo rol para juan')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Cambiar rol' })).toBeInTheDocument();
  });

  it('cambia el rol de OTRO usuario sin refrescar el token propio', async () => {
    vi.mocked(authService.cambiarRol).mockResolvedValue('Rol modificado');
    renderPerfil(crearToken({ role: 'Administrador', nameid: '1' }));
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '2');

    fireEvent.change(within(card).getByLabelText('Nuevo rol para juan'), {
      target: { value: 'Cliente' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Cambiar rol' }));

    await waitFor(() =>
      expect(authService.cambiarRol).toHaveBeenCalledWith(2, 'Cliente'),
    );
    expect(authService.refrescar).not.toHaveBeenCalled();
  });

  it('cambia el rol propio y refresca el token (claim "role" actualizado)', async () => {
    const tokenAdmin = crearToken({ role: 'Administrador', nameid: '1' });
    const tokenEmpleado = crearToken({ role: 'Empleado', nameid: '1' });
    vi.mocked(authService.refrescar).mockResolvedValue({ accessToken: tokenEmpleado });
    vi.mocked(authService.cambiarRol).mockResolvedValue('Rol modificado');

    renderPerfil(tokenAdmin);
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '1');

    fireEvent.change(within(card).getByLabelText('Nuevo rol para admin'), {
      target: { value: 'Empleado' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Cambiar rol' }));

    await waitFor(() =>
      expect(authService.cambiarRol).toHaveBeenCalledWith(1, 'Empleado'),
    );
    await waitFor(() => expect(authService.refrescar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useStore.getState().accessToken).toBe(tokenEmpleado));
    await waitFor(() => expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument());
  });

  it('restaura la contraseña y muestra el código de un solo uso', async () => {
    vi.mocked(authService.restaurarContraseña).mockResolvedValue('ABC123');
    renderPerfil(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '2');

    fireEvent.click(within(card).getByRole('button', { name: 'Restaurar contraseña' }));

    await waitFor(() => expect(authService.restaurarContraseña).toHaveBeenCalledWith(2));
    await waitFor(() => expect(within(card).getByText('ABC123')).toBeInTheDocument());
  });

  it('copia el código de un solo uso al portapapeles', async () => {
    vi.mocked(authService.restaurarContraseña).mockResolvedValue('ABC123');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderPerfil(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '2');

    fireEvent.click(within(card).getByRole('button', { name: 'Restaurar contraseña' }));
    await waitFor(() => expect(within(card).getByText('ABC123')).toBeInTheDocument());

    fireEvent.click(within(card).getByRole('button', { name: 'Copiar código' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('ABC123'));
    await waitFor(() => expect(within(card).getByText('Copiado')).toBeInTheDocument());
  });

  it('cambia la contraseña de un usuario sin la contraseña actual (admin)', async () => {
    vi.mocked(authService.cambiarContrasenaAdmin).mockResolvedValue('Contraseña modificada');
    renderPerfil(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '2');

    fireEvent.change(within(card).getByLabelText('Contraseña nueva para juan'), {
      target: { value: 'nueva123' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(authService.cambiarContrasenaAdmin).toHaveBeenCalledWith(2, 'nueva123'),
    );
  });
});
