import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM del detalle de trabajo `/trabajos/:id` (issue #84). */
export class TrabajoDetallePage extends BasePage {
  readonly botonOpciones = this.page.getByRole('button', { name: 'Opciones' });

  /**
   * Dropdown del menú "Opciones", anclado por estructura (ancla común a los
   * detalles; el ancho varía por componente — sin w-* en el selector). Es
   * obligatorio scoperlo: el FAB de ProtectedLayout también expone un botón
   * "Registrar Horas" (getByRole matchea case-insensitive → strict violation).
   */
  readonly menuOpciones = this.page.locator('.absolute.right-0.top-full.mt-1');

  /** El resumen de horas debe mostrar `Xh registradas`. */
  async verHorasRegistradas(horas: number): Promise<void> {
    await expect(this.page.getByText(new RegExp(`${horas}h registradas`))).toBeVisible({
      timeout: 15_000,
    });
  }

  /**
   * Marca el trabajo como iniciado desde el menú del detalle.
   * No requiere diálogo (acción directa del backend).
   */
  async iniciarTrabajo(): Promise<void> {
    await this.botonOpciones.click();
    await this.menuOpciones.getByRole('button', { name: 'Iniciar trabajo' }).click();
    await expect(this.page.getByText('En curso')).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Termina el trabajo. Dispara un `confirm()` nativo del browser:
   * el test debe aceptar el diálogo ANTES de clickear.
   */
  async terminarTrabajo(page: Page): Promise<void> {
    page.once('dialog', (dialog) => dialog.accept());
    await this.botonOpciones.click();
    await this.menuOpciones.getByRole('button', { name: 'Terminar trabajo' }).click();
    await expect(this.page.getByText('Terminado')).toBeVisible({ timeout: 15_000 });
  }
}
