import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { MetricCardComparativo } from '../../components/MetricCardComparativo';

describe('MetricCardComparativo (issue #118 §2.2 — "Este mes" vs "Mes anterior")', () => {
  it('muestra label + cabeceras de columnas + sublabels de mes (D4)', () => {
    render(
      <MetricCardComparativo
        label="Ingresos del mes"
        valorActual={100}
        valorAnterior={80}
        mesActual="Agosto"
        mesAnterior="Julio"
      />
    );

    expect(screen.getByText('Ingresos del mes')).toBeInTheDocument();
    expect(screen.getByText('Este mes')).toBeInTheDocument();
    expect(screen.getByText('Mes anterior')).toBeInTheDocument();
    expect(screen.getByText('Agosto')).toBeInTheDocument();
    expect(screen.getByText('Julio')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('formato="moneda" → formatCurrency (regex /$\\d+/)', () => {
    render(
      <MetricCardComparativo
        label="Ingresos del mes"
        valorActual={150000}
        valorAnterior={120000}
        mesActual="Agosto"
        mesAnterior="Julio"
        formato="moneda"
      />
    );

    // Una columna por período (actual + anterior):
    const valores = screen.getAllByText(/\$\d+/);
    expect(valores).toHaveLength(2);
  });

  it('formato="horas" → "42.0 hs" (1 decimal + sufijo)', () => {
    render(
      <MetricCardComparativo
        label="Horas trabajadas"
        valorActual={42}
        valorAnterior={35.5}
        mesActual="Agosto"
        mesAnterior="Julio"
        formato="horas"
      />
    );

    expect(screen.getByText('42.0 hs')).toBeInTheDocument();
    expect(screen.getByText('35.5 hs')).toBeInTheDocument();
  });

  it('formato="entero" (default) → es-AR sin sufijo', () => {
    render(
      <MetricCardComparativo
        label="Trabajos terminados"
        valorActual={1234}
        valorAnterior={1000}
        mesActual="Agosto"
        mesAnterior="Julio"
      />
    );

    expect(screen.getByText('1.234')).toBeInTheDocument();
    expect(screen.getByText('1.000')).toBeInTheDocument();
  });

  it('null en ambas columnas → "—" con sr-only (nunca 0 ni %)', () => {
    render(
      <MetricCardComparativo
        label="Ingresos del mes"
        valorActual={null}
        valorAnterior={null}
        mesActual="Agosto"
        mesAnterior="Julio"
        formato="moneda"
      />
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByText('Sin datos')).toHaveLength(2);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('la columna "Mes anterior" SIEMPRE muted (D3)', () => {
    render(
      <MetricCardComparativo
        label="Horas trabajadas"
        valorActual={42}
        valorAnterior={38}
        mesActual="Agosto"
        mesAnterior="Julio"
      />
    );

    const valorAnterior = screen.getByText('38');
    expect(valorAnterior).toHaveStyle({ color: 'var(--color-muted)' });
  });

  it('variant="hero" → card con borde accent y valores text-3xl', () => {
    render(
      <MetricCardComparativo
        label="Ingresos del mes"
        valorActual={100}
        valorAnterior={80}
        mesActual="Agosto"
        mesAnterior="Julio"
        variant="hero"
        icono={TrendingUp}
        colorIcono="var(--color-accent)"
        formato="moneda"
      />
    );

    const card = screen.getByText('Ingresos del mes').closest('div.card') as HTMLElement;
    expect(card).toHaveClass('!p-5');
    // jsdom no resuelve var() en el estilo computado: se verifica el inline style.
    expect(card.getAttribute('style')).toContain('border-color: var(--color-accent)');
    // Valores del hero en text-3xl:
    const valores = screen.getAllByText(/\$\d+/);
    expect(valores).toHaveLength(2);
    for (const valor of valores) {
      expect(valor).toHaveClass('text-3xl');
    }
    expect(screen.getByText('Este mes')).toBeInTheDocument();
  });

  it('grid (default) → valores text-lg', () => {
    render(
      <MetricCardComparativo
        label="Horas trabajadas"
        valorActual={10}
        valorAnterior={5}
        mesActual="Agosto"
        mesAnterior="Julio"
      />
    );

    expect(screen.getByText('10')).toHaveClass('text-lg');
  });
});
