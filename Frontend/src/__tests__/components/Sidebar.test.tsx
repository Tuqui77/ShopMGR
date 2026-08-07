import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { useStore } from '../../store';
import { authService } from '../../services/auth';

// ============================================================================
// Mocks
// ============================================================================

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

function renderSidebar(accessToken: string | null, path: string = '/') {
  useStore.setState({ accessToken });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Sidebar footer (issue #112: nombre + cerrar sesión compacto)', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.clearAllMocks();
  });

  it('muestra el nombre de usuario a la izquierda del footer cuando el token lo trae', () => {
    renderSidebar(crearToken({ unique_name: 'Juan', role: 'Empleado' }));
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });

  it('muestra el fallback "Mi cuenta" cuando el token no trae el nombre', () => {
    renderSidebar(crearToken({ role: 'Empleado', nameid: '7' }));
    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
  });

  it('el nombre es un link que navega a /perfil (queda activo)', () => {
    renderSidebar(crearToken({ unique_name: 'Juan', role: 'Empleado' }), '/');
    const link = screen.getByText('Juan').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', '/perfil');
    expect(link).not.toHaveClass('active');

    fireEvent.click(link);
    expect(link).toHaveClass('active');
  });

  it('tiene un botón chico de cerrar sesión con aria-label y title', () => {
    renderSidebar(crearToken({ role: 'Empleado' }), '/');
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' });
    expect(boton).toHaveAttribute('title', 'Cerrar sesión');
    // Solo el icono: el botón no tiene texto visible de etiqueta.
    expect(boton.textContent).toBe('');
  });

  it('el botón de cerrar sesión llama a authService.cerrarSesion y limpia el store', async () => {
    vi.mocked(authService.cerrarSesion).mockResolvedValue(undefined);
    renderSidebar(crearToken({ role: 'Empleado' }), '/');
    expect(useStore.getState().accessToken).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(authService.cerrarSesion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useStore.getState().accessToken).toBeNull());
  });

  it('sigue mostrando el link de Configuración en el footer', () => {
    renderSidebar(crearToken({ role: 'Empleado' }), '/');
    const linkConfiguracion = screen.getByText('Configuración').closest('a') as HTMLAnchorElement;
    expect(linkConfiguracion).toHaveAttribute('href', '/configuracion');
  });
});
