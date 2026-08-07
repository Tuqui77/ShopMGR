import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Configuracion } from '../../pages/Configuracion';

// ============================================================================
// Mocks
// ============================================================================

// Evita llamadas de red reales (query de costo hora + mutations).
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: 100 }),
    request: vi.fn().mockResolvedValue({ data: undefined }),
  },
}));

// ============================================================================
// Helpers de prueba
// ============================================================================

function renderConfiguracion() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Configuracion />
    </QueryClientProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Configuracion (issue #112: sin administración de usuarios)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza las cards de preferencias', async () => {
    renderConfiguracion();
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getByText('Tema')).toBeInTheDocument();
    expect(screen.getByText('Valor hora de trabajo')).toBeInTheDocument();
    expect(await screen.findByText('Formato de fecha')).toBeInTheDocument();
    expect(screen.getByText('Formato de hora')).toBeInTheDocument();
    expect(screen.getByText('Símbolo de moneda')).toBeInTheDocument();
  });

  it('ya NO contiene "Administrar usuarios" (movido a /perfil, issue #112)', () => {
    renderConfiguracion();
    expect(screen.queryByText('Administrar usuarios')).not.toBeInTheDocument();
  });
});
