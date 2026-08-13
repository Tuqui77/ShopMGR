import type { PeriodoMetrica } from '../types';

// ============================================================================
// Helpers puros de períodos (issue #118) — sin estado, sin side effects.
// ============================================================================

/**
 * Ordena desc (año, luego mes) y dedupea por (anio, mes).
 * Se usa defensivamente sobre lo que devuelva /Metricas/ObtenerMesesConDatos.
 */
export function normalizarPeriodos(periodos: PeriodoMetrica[]): PeriodoMetrica[] {
  const vistos = new Set<string>();
  const unicos: PeriodoMetrica[] = [];
  for (const periodo of periodos) {
    const clave = `${periodo.anio}-${periodo.mes}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicos.push(periodo);
  }
  return unicos.sort((a, b) => b.anio - a.anio || b.mes - a.mes);
}

/**
 * Agrupa períodos por año → meses con datos (desc).
 */
export function agruparPorAnio(periodos: PeriodoMetrica[]): Map<number, number[]> {
  const porAnio = new Map<number, number[]>();
  for (const { anio, mes } of periodos) {
    const meses = porAnio.get(anio);
    if (meses) {
      meses.push(mes);
    } else {
      porAnio.set(anio, [mes]);
    }
  }
  for (const meses of porAnio.values()) {
    meses.sort((a, b) => b - a);
  }
  return porAnio;
}

/**
 * Fallback de años disponibles cuando /Metricas/ObtenerMesesConDatos falla o
 * devuelve lista vacía (D2): [anioActual, anioActual-1, ..., anioActual-(n-1)].
 */
export function aniosFallback(anioActual: number, cantidad = 50): number[] {
  return Array.from({ length: cantidad }, (_, i) => anioActual - i);
}

/**
 * Edge E1: al cambiar de año, si el mes seleccionado no existe en el nuevo año
 * → devuelve el primer mes con datos de ese año (la lista ya viene desc, es el
 * más reciente). Si existe → lo mantiene. Lista vacía → devuelve el mes actual
 * (el select no podrá seleccionar nada; lo cubre el disabled del selector).
 *
 * @param _anioNuevo Año al que se cambia (parte del contrato de la spec;
 *   la resolución usa solo `mesesDelAnio`, que ya es del año nuevo).
 */
export function resolverE1(
  _anioNuevo: number,
  mesSeleccionado: number,
  mesesDelAnio: number[],
): number {
  if (mesesDelAnio.includes(mesSeleccionado)) return mesSeleccionado;
  return mesesDelAnio[0] ?? mesSeleccionado;
}

// ============================================================================
// Nombres de mes (es-AR) — sublabels de las cards comparativas (D4)
// ============================================================================

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Nombre del mes en español: nombreMes(8) → "Agosto". Fallback numérico. */
export function nombreMes(mes: number): string {
  return NOMBRES_MESES[mes - 1] ?? String(mes);
}

// ============================================================================
// Período en la URL (?periodo=AAAA-MM)
// ============================================================================

/** Formatea un período como AAAA-MM para la URL (?periodo=). */
export function formatPeriodo(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

/** Parsea AAAA-MM de la URL. null si el formato es inválido (mes fuera de 1-12). */
export function parsePeriodo(valor: string | null): PeriodoMetrica | null {
  if (!valor) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) return null;
  return { anio, mes };
}

/** Mes anterior con rollover de año: enero → diciembre del año previo. */
export function periodoAnterior(anio: number, mes: number): PeriodoMetrica {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}
