import clsx from 'clsx';
import { nombreMes, resolverE1 } from '../utils/periodos';

export interface PeriodoSelectorProps {
  /** Período seleccionado. */
  anio: number;
  /** 1-12. */
  mes: number;
  /** Años disponibles — desc (con datos, o fallback 50 años). */
  aniosDisponibles: number[];
  /** Meses con datos del año elegido — desc (o 1..12 en fallback). */
  mesesDisponibles: number[];
  /** Mapa año → meses con datos (desc). Opcional: permite resolver E1 al
   *  cambiar de año (si el mes actual no existe en el año nuevo, auto-selecciona
   *  el primer mes con datos de ese año). Sin este mapa se conserva el mes. */
  mesesPorAnio?: ReadonlyMap<number, readonly number[]>;
  /** true → deshabilita el botón "Este mes". */
  esMesActual: boolean;
  onChange: (anio: number, mes: number) => void;
  onIrAlMesActual: () => void;
  /** true mientras cargan los períodos. */
  disabled?: boolean;
}

/** Selector de período: 2 selects nativos (año + mes) + botón "Este mes" (issue #118 §2.2). */
export function PeriodoSelector({
  anio,
  mes,
  aniosDisponibles,
  mesesDisponibles,
  mesesPorAnio,
  esMesActual,
  onChange,
  onIrAlMesActual,
  disabled = false,
}: PeriodoSelectorProps) {
  const handleCambioAnio = (anioNuevo: number) => {
    // Edge E1 (5.3): al cambiar de año, si el mes seleccionado no tiene datos
    // en el año nuevo → primer mes con datos de ese año (la lista ya viene desc).
    const mesesDelNuevoAnio = mesesPorAnio?.get(anioNuevo);
    if (mesesDelNuevoAnio && mesesDelNuevoAnio.length > 0) {
      onChange(anioNuevo, resolverE1(anioNuevo, mes, [...mesesDelNuevoAnio]));
    } else {
      onChange(anioNuevo, mes);
    }
  };

  return (
    <div className="card !p-3 space-y-2 lg:flex lg:items-center lg:gap-2 lg:space-y-0">
      <div className="flex gap-2 flex-1">
        <label className="sr-only" htmlFor="periodo-anio">Año</label>
        <select
          id="periodo-anio"
          className="input flex-1 min-w-0"
          value={anio}
          disabled={disabled}
          onChange={(e) => handleCambioAnio(Number(e.target.value))}
        >
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="periodo-mes">Mes</label>
        <select
          id="periodo-mes"
          className="input flex-1 min-w-0"
          value={mes}
          disabled={disabled}
          onChange={(e) => onChange(anio, Number(e.target.value))}
        >
          {mesesDisponibles.map((m) => (
            <option key={m} value={m}>{nombreMes(m)}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={clsx('btn-secondary w-full lg:w-auto', esMesActual && 'opacity-50 cursor-not-allowed')}
        onClick={onIrAlMesActual}
        disabled={esMesActual}
      >
        Este mes
      </button>
    </div>
  );
}
