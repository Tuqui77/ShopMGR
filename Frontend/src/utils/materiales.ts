// ============================================================================
// Cálculos de materiales
// ============================================================================

/**
 * Calcula el subtotal de un material en el frontend.
 *
 * El backend NO envía el subtotal por material (la tabla `Materiales` no tiene
 * esa columna), así que se calcula acá como `cantidad * precio`.
 *
 * `cantidad` es `double` en el backend, por lo que en JS pueden aparecer errores
 * de representación de punto flotante (ej. `0.1 * 3 = 0.30000000000000004`).
 * Se redondea a 2 decimales para que `formatCurrency` (que usa `toLocaleString()`
 * sin decimales fijos) no muestre ruido.
 *
 * `Number.EPSILON` se suma antes del redondeo para mitigar errores de
 * representación en casos límite (ej. `1.005 * 100`). Valores `NaN` devuelven 0.
 */
export function calcularSubtotal(cantidad: number, precio: number): number {
  const monto = cantidad * precio;
  if (!Number.isFinite(monto)) return 0;
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}