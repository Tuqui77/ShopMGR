import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ConfirmDialogComponent } from '../components/ConfirmDialogComponent';

/** POM del detalle de presupuesto `/presupuestos/:id` (issue #84). */
export class PresupuestoDetallePage extends BasePage {
  readonly botonOpciones = this.page.getByRole('button', { name: 'Opciones' });

  /**
   * Dropdown del menú "Opciones" (ancla estructural común a los detalles;
   * el ancho varía por componente — sin w-* en el selector).
   */
  readonly menuOpciones = this.page.locator('.absolute.right-0.top-full.mt-1');

  /**
   * Acepta el presupuesto vía UI: menú → Aceptar → confirmar modal
   * "Aceptar y crear trabajo". Al aceptar se crea un trabajo automáticamente.
   */
  async aceptarPresupuesto(): Promise<void> {
    await this.botonOpciones.click();
    await this.menuOpciones.getByRole('button', { name: 'Aceptar', exact: true }).click();
    await new ConfirmDialogComponent().confirmar(this.page, 'Aceptar y crear trabajo');
    await this.verBadgeEstado('Aceptado');
  }

  /** Rechaza el presupuesto vía UI (menú → Rechazar → confirmar). */
  async rechazarPresupuesto(): Promise<void> {
    await this.botonOpciones.click();
    await this.menuOpciones.getByRole('button', { name: 'Rechazar', exact: true }).click();
    await new ConfirmDialogComponent().confirmar(this.page, 'Rechazar');
    await this.verBadgeEstado('Rechazado');
  }

  /** El badge de estado del detalle (Pendiente/Aceptado/Rechazado). */
  async verBadgeEstado(estado: string): Promise<void> {
    await expect(this.page.getByText(estado, { exact: true })).toBeVisible({ timeout: 15_000 });
  }
}
