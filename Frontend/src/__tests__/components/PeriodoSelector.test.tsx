import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodoSelector } from '../../components/PeriodoSelector';

function renderSelector({
  anio = 2026,
  mes = 8,
  aniosDisponibles = [2026, 2025],
  mesesDisponibles = [8, 7, 6],
  mesesPorAnio,
  esMesActual = false,
  disabled = false,
  onChange = vi.fn(),
  onIrAlMesActual = vi.fn(),
}: Partial<Parameters<typeof PeriodoSelector>[0]> = {}) {
  return {
    onChange,
    onIrAlMesActual,
    ...render(
      <PeriodoSelector
        anio={anio}
        mes={mes}
        aniosDisponibles={aniosDisponibles}
        mesesDisponibles={mesesDisponibles}
        mesesPorAnio={mesesPorAnio}
        esMesActual={esMesActual}
        onChange={onChange}
        onIrAlMesActual={onIrAlMesActual}
        disabled={disabled}
      />
    ),
  };
}

describe('PeriodoSelector (issue #118 §2.2)', () => {
  it('renderiza select de año, select de mes (nombre es-AR) y botón "Este mes"', () => {
    renderSelector();

    expect(screen.getByLabelText('Año')).toBeInTheDocument();
    const selectMes = screen.getByLabelText('Mes');
    expect(selectMes).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Agosto' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Julio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
  });

  it('los selects reflejan el período seleccionado', () => {
    renderSelector({ anio: 2025, mes: 7 });

    expect(screen.getByLabelText('Año')).toHaveValue('2025');
    expect(screen.getByLabelText('Mes')).toHaveValue('7');
  });

  it('cambiar el mes → onChange(anio, mesNuevo)', () => {
    const { onChange } = renderSelector();

    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '6' } });

    expect(onChange).toHaveBeenCalledWith(2026, 6);
  });

  it('cambiar el año conserva el mes (sin mesesPorAnio)', () => {
    const { onChange } = renderSelector();

    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2025' } });

    expect(onChange).toHaveBeenCalledWith(2025, 8);
  });

  it('E1 (5.3): al cambiar de año, mes sin datos → primer mes con datos del año nuevo', () => {
    const { onChange } = renderSelector({
      anio: 2026,
      mes: 8,
      mesesPorAnio: new Map([
        [2026, [8, 7, 6]],
        [2025, [3, 1]],
      ]),
    });

    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2025' } });

    // Mes 8 no existe en 2025 → auto-selecciona el primer mes con datos (3).
    expect(onChange).toHaveBeenCalledWith(2025, 3);
  });

  it('E1: si el mes existe en el año nuevo, lo mantiene', () => {
    const { onChange } = renderSelector({
      anio: 2026,
      mes: 8,
      mesesPorAnio: new Map([
        [2026, [8, 7]],
        [2025, [12, 8, 3]],
      ]),
    });

    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2025' } });

    expect(onChange).toHaveBeenCalledWith(2025, 8);
  });

  it('botón "Este mes" → onIrAlMesActual', () => {
    const { onIrAlMesActual } = renderSelector();

    fireEvent.click(screen.getByRole('button', { name: 'Este mes' }));

    expect(onIrAlMesActual).toHaveBeenCalledTimes(1);
  });

  it('"Este mes" deshabilitado cuando el período seleccionado ES el mes actual', () => {
    renderSelector({ esMesActual: true });
    expect(screen.getByRole('button', { name: 'Este mes' })).toBeDisabled();
  });

  it('disabled → los selects se deshabilitan (mientras cargan períodos)', () => {
    renderSelector({ disabled: true });
    expect(screen.getByLabelText('Año')).toBeDisabled();
    expect(screen.getByLabelText('Mes')).toBeDisabled();
  });
});
