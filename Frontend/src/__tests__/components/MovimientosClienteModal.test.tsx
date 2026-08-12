import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MovimientosClienteModal } from '../../components/MovimientosClienteModal';
import type { MovimientoBalance, TipoMovimiento } from '../../types';

// ── Mocks ────────────────────────────────────────────────

const { movimientosMock, setIsDetailModalOpenMock } = vi.hoisted(() => ({
  movimientosMock: vi.fn<() => MovimientoBalance[]>(),
  setIsDetailModalOpenMock: vi.fn(),
}));

vi.mock('../../hooks/useMovimientosCliente', () => ({
  useMovimientosCliente: () => ({ data: movimientosMock(), isLoading: false, error: null }),
  useModificarMovimiento: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEliminarMovimiento: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../store', () => ({
  useStore: () => setIsDetailModalOpenMock,
}));

// ── Fixtures ─────────────────────────────────────────────

function crearMovimiento(id: number, tipo: TipoMovimiento, monto: number, descripcion = ''): MovimientoBalance {
  return { id, idCliente: 1, tipo, monto, descripcion, fecha: '2026-08-11' };
}

const props = { clienteId: 1, nombreCliente: 'Cliente Test', isOpen: true, onClose: vi.fn() };

/** Lee el valor mostrado en la fila del footer (Créditos / Débitos / Balance). */
function valorFooter(rotulo: 'Créditos' | 'Débitos' | 'Balance'): HTMLElement {
  const fila = screen.getByText(rotulo).parentElement;
  expect(fila).not.toBeNull();
  return within(fila as HTMLElement).getByText(/^\$|^-\$|^U\$\S/);
}

describe('MovimientosClienteModal (balance incluye Ajuste — issue #128)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('incluye un Ajuste positivo en créditos y en el balance', () => {
    movimientosMock.mockReturnValue([
      crearMovimiento(1, 'Pago', 100, 'Pago parcial'),
      crearMovimiento(2, 'Ajuste', 30, 'Ajuste a favor'),
      crearMovimiento(3, 'Cargo', -40, 'Cargo servicio'),
    ]);

    render(<MovimientosClienteModal {...props} />);

    // Footer: créditos = 100 + 30 (Ajuste positivo), débitos = 40, balance = 90
    expect(valorFooter('Créditos')).toHaveTextContent('$130');
    expect(valorFooter('Débitos')).toHaveTextContent('$40');
    expect(valorFooter('Balance')).toHaveTextContent('$90');
  });

  it('incluye un Ajuste negativo en débitos y en el balance', () => {
    // Caso del bug reportado: Pago +100, Cargo -50, Ajuste -30 → balance = 20
    movimientosMock.mockReturnValue([
      crearMovimiento(1, 'Pago', 100, 'Pago parcial'),
      crearMovimiento(2, 'Cargo', -50, 'Cargo servicio'),
      crearMovimiento(3, 'Ajuste', -30, 'Ajuste en contra'),
    ]);

    render(<MovimientosClienteModal {...props} />);

    expect(valorFooter('Créditos')).toHaveTextContent('$100');
    expect(valorFooter('Débitos')).toHaveTextContent('$80');
    expect(valorFooter('Balance')).toHaveTextContent('$20');
  });

  it('el balance del modal es exactamente la suma de todos los montos (invariante Cliente.Balance)', () => {
    // Mezcla completa: créditos (Pago + Anticipo + Ajuste +15) y débitos
    // (Cargo + Compra + Ajuste -30) → Σ = 100 + 50 - 50 - 20 - 30 + 15 = 65
    movimientosMock.mockReturnValue([
      crearMovimiento(1, 'Pago', 100, 'Pago parcial'),
      crearMovimiento(2, 'Anticipo', 50, 'Anticipo trabajo'),
      crearMovimiento(3, 'Cargo', -50, 'Cargo servicio'),
      crearMovimiento(4, 'Compra', -20, 'Compra insumos'),
      crearMovimiento(5, 'Ajuste', -30, 'Ajuste en contra'),
      crearMovimiento(6, 'Ajuste', 15, 'Ajuste a favor'),
    ]);

    render(<MovimientosClienteModal {...props} />);

    expect(valorFooter('Créditos')).toHaveTextContent('$165');
    expect(valorFooter('Débitos')).toHaveTextContent('$100');
    expect(valorFooter('Balance')).toHaveTextContent('$65');

    // Las filas siguen mostrándose (visual intacto): los Ajuste se listan como tal
    expect(screen.getAllByText('Ajuste')).toHaveLength(2);
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Anticipo')).toBeInTheDocument();
    expect(screen.getByText('Cargo')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
  });

  it('un Ajuste con monto 0 no altera el balance', () => {
    movimientosMock.mockReturnValue([
      crearMovimiento(1, 'Pago', 100, 'Pago parcial'),
      crearMovimiento(2, 'Ajuste', 0, 'Ajuste sin monto'),
    ]);

    render(<MovimientosClienteModal {...props} />);

    expect(valorFooter('Créditos')).toHaveTextContent('$100');
    expect(valorFooter('Débitos')).toHaveTextContent('$0');
    expect(valorFooter('Balance')).toHaveTextContent('$100');
  });
});
