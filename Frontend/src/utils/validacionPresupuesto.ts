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
 * El `min` es configurable porque el DTO de **modificación** no tiene `[Range]`:
 * al editar no se debe bloquear un registro existente con `0` horas (decisión de
 * producto pendiente); al crear se respeta el contrato del DTO (`[Range(1, 1000)]`).
 * En ambos casos se siguen rechazando vacío, valores no numéricos y negativos.
 *
 * @param opciones.min - Mínimo aceptado (por defecto `LIMITES_HORAS_ESTIMADAS.min`).
 * @returns `null` si es válido; el mensaje de error si no lo es.
 */
export function validarHorasEstimadas(valor: string, opciones?: { min?: number }): string | null {
  const min = opciones?.min ?? LIMITES_HORAS_ESTIMADAS.min;
  const normalizado = valor.trim();
  if (normalizado.length === 0) return MENSAJE_HORAS_ESTIMADAS;

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return MENSAJE_HORAS_ESTIMADAS;
  if (numero < min || numero > LIMITES_HORAS_ESTIMADAS.max) {
    return MENSAJE_HORAS_ESTIMADAS;
  }

  return null;
}
