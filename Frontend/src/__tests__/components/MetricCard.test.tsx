import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../../components/MetricCard';

describe('MetricCard (issue #118 §2.2 — contrato null)', () => {
  it('renderiza un valor numérico con formato es-AR y su label', () => {
    render(<MetricCard value={1500} label="Ingresos" />);
    expect(screen.getByText('1.500')).toBeInTheDocument();
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
  });

  it('null → "—" (aria-hidden) + sr-only "Sin datos" (nunca 0, nunca %)', () => {
    render(<MetricCard value={null} label="Ingresos" />);

    const guion = screen.getByText('—');
    expect(guion).toBeInTheDocument();
    expect(guion).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    // Sin "0" ni "%" inventados:
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('0 → se muestra "0" (solo el null representa falta de datos)', () => {
    render(<MetricCard value={0} label="Trabajos" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('size="lg" aplica text-3xl (hero); default sm aplica text-lg', () => {
    const { rerender } = render(<MetricCard value={1} label="A" size="lg" />);
    expect(screen.getByText('1')).toHaveClass('text-3xl');

    rerender(<MetricCard value={1} label="A" />);
    expect(screen.getByText('1')).toHaveClass('text-lg');
  });

  it('muted pinta el valor con el token muted', () => {
    render(<MetricCard value={100} label="A" muted />);
    expect(screen.getByText('100')).toHaveStyle({ color: 'var(--color-muted)' });
  });
});
