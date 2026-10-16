/**
 * Validaciones de presupuesto compartidas entre el form y los tests (issue #148).
 *
 * Los límites son la **fuente única** del rango y deben reflejar el DTO del
 * backend (`PresupuestoDTOcreacion.HorasEstimadas` → `[Range(1, 1000)]`).
 */

export const LIMITES_HORAS_ESTIMADAS = { min: 1, max: 1000 } as const;

/** Mensaje idéntico al que devuelve el backend para el rango de horas. */
export const MENSAJE_HORAS_ESTIMADAS = `El campo horas estimadas tiene que estar entre ${LIMITES_HORAS_ESTIMADAS.min} y ${LIMITES_HORAS_ESTIMADAS.max}`;

/**
 * Valida el valor crudo del input de horas estimadas.
 *
 * @returns `null` si es válido; el mensaje de error si no lo es.
 */
export function validarHorasEstimadas(valor: string): string | null {
  const normalizado = valor.trim();
  if (normalizado.length === 0) return MENSAJE_HORAS_ESTIMADAS;

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return MENSAJE_HORAS_ESTIMADAS;
  if (numero < LIMITES_HORAS_ESTIMADAS.min || numero > LIMITES_HORAS_ESTIMADAS.max) {
    return MENSAJE_HORAS_ESTIMADAS;
  }

  return null;
}
