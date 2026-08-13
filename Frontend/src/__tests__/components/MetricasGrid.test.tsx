import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricasGrid } from '../../components/MetricasGrid';

describe('MetricasGrid (issue #118 §2.2 — grid compartido 2x2/4 cols)', () => {
  it('aplica grid 2 columnas mobile y 4 desktop', () => {
    render(
      <MetricasGrid>
        <div>uno</div>
      </MetricasGrid>
    );

    const grid = screen.getByText('uno').parentElement as HTMLElement;
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'lg:grid-cols-4');
  });

  it('renderiza los 4 children del grid de métricas secundarias', () => {
    render(
      <MetricasGrid>
        <div>Horas trabajadas</div>
        <div>Trabajos terminados</div>
        <div>Presupuestos creados</div>
        <div>Presupuestos aceptados</div>
      </MetricasGrid>
    );

    expect(screen.getByText('Horas trabajadas')).toBeInTheDocument();
    expect(screen.getByText('Trabajos terminados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos creados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos aceptados')).toBeInTheDocument();
  });
});
