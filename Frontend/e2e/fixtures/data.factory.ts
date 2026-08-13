/**
 * Factories de datos de test (issue #84).
 *
 * Cada dato lleva un sufijo con `Date.now()` para garantizar unicidad entre
 * ejecuciones y workers: los listados del backend ordenan por id/título y no
 * deben colisionar entre corridas paralelas.
 */

export interface DatosE2E {
  nombreCliente: string;
  tituloTrabajo: string;
  tituloPresupuesto: string;
}

/** Crea un set completo de datos E2E con sufijo timestamp único. */
export function crearDatosE2E(): DatosE2E {
  const ts = Date.now();
  return {
    nombreCliente: `Cliente E2E ${ts}`,
    tituloTrabajo: `Trabajo E2E ${ts}`,
    tituloPresupuesto: `Presupuesto E2E ${ts}`,
  };
}

/**
 * Nombre de cliente único por test.
 * El backend valida UNIQUE sobre el nombre completo; usar el mismo nombre en
 * dos tests del mismo worker fallaría con 409/500.
 */
export function crearNombreClienteUnico(): string {
  return `Cliente E2E ${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

/** Título de trabajo único (sin colisión con otros tests). */
export function crearTituloTrabajoUnico(): string {
  return `Trabajo E2E ${Date.now()}`;
}

/** Título de presupuesto único. */
export function crearTituloPresupuestoUnico(): string {
  return `Presupuesto E2E ${Date.now()}`;
}

/**
 * Teléfono sintético único (10 dígitos): prefijo 297 + 4 dígitos del timestamp
 * + 3 random. El backend valida UNIQUE sobre el número de teléfono (issue #96):
 * dos clientes con el mismo teléfono fallan con 400.
 */
export function crearTelefonoE2E(): string {
  const ts = String(Date.now()).slice(-4);
  const sufijo = 100 + Math.floor(Math.random() * 900);
  return `297${ts}${sufijo}`;
}
