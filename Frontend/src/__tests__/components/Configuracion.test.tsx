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
    // React Query v5 rechaza data undefined: el mock base devuelve lista vacía.
    listarUsuarios: vi.fn().mockResolvedValue([]),
    restaurarContraseña: vi.fn(),
    cambiarContrasenaAdmin: vi.fn(),
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
 * El rol viaja en el claim "role" y el id en "nameid", igual que el JWT del
 * backend. Ej: crearToken({ role: 'Administrador', nameid: '1' }).
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

// ============================================================================
// Visibilidad de la card (solo Administrador, issue #99)
// ============================================================================

describe('Configuracion: visibilidad de "Administrar usuarios" (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('muestra la card para un usuario Administrador', async () => {
    renderConfiguracion(crearToken({ role: 'Administrador' }));
    expect(screen.getByText('Administrar usuarios')).toBeInTheDocument();
    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument();
  });

  it('oculta la card para un usuario Empleado', () => {
    renderConfiguracion(crearToken({ role: 'Empleado' }));
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card para un usuario Cliente', () => {
    renderConfiguracion(crearToken({ role: 'Cliente' }));
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card cuando el token no decodifica (fail-closed)', () => {
    renderConfiguracion('token-que-no-es-un-jwt');
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });

  it('oculta la card cuando no hay token', () => {
    renderConfiguracion(null);
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Administración de usuarios (interacción)
// ============================================================================

describe('Configuracion: administrar usuarios (issue #99)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
    vi.mocked(authService.listarUsuarios).mockResolvedValue([...USUARIOS_MOCK]);
  });

  it('carga la lista y muestra las acciones al seleccionar un usuario', async () => {
    renderConfiguracion(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();

    await waitFor(() => expect(authService.listarUsuarios).toHaveBeenCalledTimes(1));

    await seleccionarUsuario(card, '2');
    expect(within(card).getByLabelText('Nuevo rol para juan')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Cambiar rol' })).toBeInTheDocument();
  });

  it('cambia el rol de OTRO usuario sin refrescar el token propio', async () => {
    vi.mocked(authService.cambiarRol).mockResolvedValue('Rol modificado');
    renderConfiguracion(crearToken({ role: 'Administrador', nameid: '1' }));
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

    renderConfiguracion(tokenAdmin);
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
    renderConfiguracion(crearToken({ role: 'Administrador' }));
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

    renderConfiguracion(crearToken({ role: 'Administrador' }));
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
    renderConfiguracion(crearToken({ role: 'Administrador' }));
    const card = getAdminUsersCard();
    await seleccionarUsuario(card, '2');

    fireEvent.change(within(card).getByLabelText('Contraseña nueva para juan'), {
      target: { value: 'nueva123' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(authService.cambiarContrasenaAdmin).toHaveBeenCalledWith(2, null, 'nueva123'),
    );
  });
});
