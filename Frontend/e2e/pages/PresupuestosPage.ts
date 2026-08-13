import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM de la lista de presupuestos `/presupuestos` (issue #84). */
export class PresupuestosPage extends BasePage {
  /** Navega al detalle de un presupuesto por su tarjeta. */
  async abrirPresupuesto(titulo: string): Promise<void> {
    await this.tarjetaPresupuesto(titulo).click();
  }

  /** El presupuesto debe estar visible en la lista. */
  async verPresupuesto(titulo: string): Promise<void> {
    await expect(this.tarjetaPresupuesto(titulo)).toBeVisible({ timeout: 15_000 });
  }

  /** El badge de estado (Pendiente/Aceptado/Rechazado) debe verse en la tarjeta. */
  async verBadgeEstado(titulo: string, estado: string): Promise<void> {
    await expect(this.tarjetaPresupuesto(titulo).getByText(estado, { exact: true })).toBeVisible();
  }

  /** El presupuesto debe haber desaparecido de la lista (eliminado). */
  async verPresupuestoOculto(titulo: string): Promise<void> {
    await expect(this.tarjetaPresupuesto(titulo)).toHaveCount(0, { timeout: 15_000 });
  }

  private tarjetaPresupuesto(titulo: string) {
    return this.page.getByRole('link', { name: new RegExp(titulo) });
  }
}
