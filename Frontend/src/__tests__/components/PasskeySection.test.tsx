import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasskeySection } from '../../components/PasskeySection';
import { usePasskeys, useEliminarPasskey } from '../../hooks/usePasskeys';
import type { PasskeyCredencial } from '../../types';

// ============================================================================
// Mocks (sin red ni WebAuthn nativo)
// ============================================================================

vi.mock('../../hooks/useModal', () => ({
  useModal: () => ({ isOpen: false, open: vi.fn(), close: vi.fn(), toggle: vi.fn() }),
}));

vi.mock('../../hooks/usePasskeys', () => ({
  usePasskeys: vi.fn(),
  useEliminarPasskey: vi.fn(),
}));

vi.mock('../../components/PasskeyRegisterModal', () => ({
  PasskeyRegisterModal: () => null,
}));
vi.mock('../../components/PasskeyRenameModal', () => ({
  PasskeyRenameModal: () => null,
}));
vi.mock('../../components/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));

const mockedUsePasskeys = vi.mocked(usePasskeys);
const mockedUseEliminarPasskey = vi.mocked(useEliminarPasskey);

// ============================================================================
// Helpers
// ============================================================================

/** PublicKeyCredential puede o no existir en jsdom: lo controlamos por test. */
function conSoporteWebAuthn(): void {
  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: class PublicKeyCredential {},
  });
}

function sinSoporteWebAuthn(): void {
  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: undefined,
  });
}

const PASSKEY_VALIDA: PasskeyCredencial = {
  idCredencial: 'aGVsbG8=',
  nombre: 'iPhone de Juan',
  fechaCreacion: '2026-07-01T10:00:00',
  ultimoUso: '2026-07-02T10:00:00',
};

function mockListaVacia() {
  mockedUsePasskeys.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof usePasskeys>);
}

function mockListaConPasskeys() {
  mockedUsePasskeys.mockReturnValue({
    data: [PASSKEY_VALIDA],
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof usePasskeys>);
}

// ============================================================================
// Tests
// ============================================================================

describe('PasskeySection (issue #113): botón "+" de registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conSoporteWebAuthn();
    mockedUseEliminarPasskey.mockReturnValue({
      mutate: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useEliminarPasskey>);
    mockListaVacia();
  });

  afterEach(() => {
    sinSoporteWebAuthn();
  });

  it('registra dispositivos con un botón de icono "+" sin texto visible (issue #113)', () => {
    render(<PasskeySection />);
    const boton = screen.getByRole('button', { name: 'Registrar dispositivo' });
    expect(boton).toBeInTheDocument();
    // Icono "+" (Lucide) en lugar del texto: el nombre accesible lo da el aria-label.
    expect(boton.querySelector('svg')).not.toBeNull();
    expect(screen.queryByText('Registrar dispositivo')).not.toBeInTheDocument();
  });

  it('oculta el botón de registro cuando el navegador no soporta WebAuthn', () => {
    sinSoporteWebAuthn();
    render(<PasskeySection />);
    expect(screen.queryByRole('button', { name: 'Registrar dispositivo' })).not.toBeInTheDocument();
    expect(screen.getByText('Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador.')).toBeInTheDocument();
  });
});

describe('PasskeySection: lista y modo embedded (issue #112)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conSoporteWebAuthn();
    mockedUseEliminarPasskey.mockReturnValue({
      mutate: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useEliminarPasskey>);
  });

  afterEach(() => {
    sinSoporteWebAuthn();
  });

  it('lista las passkeys con acciones de renombrar y eliminar', () => {
    mockListaConPasskeys();
    render(<PasskeySection />);
    expect(screen.getByText('iPhone de Juan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Renombrar iPhone de Juan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar iPhone de Juan' })).toBeInTheDocument();
  });

  it('en modo embedded no renderiza el wrapper .card (se incrusta en el panel Usuario)', () => {
    mockListaVacia();
    const { container } = render(<PasskeySection embedded />);
    expect(container.querySelector('.card')).toBeNull();
  });
});
