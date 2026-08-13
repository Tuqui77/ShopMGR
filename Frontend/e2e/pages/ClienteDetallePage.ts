import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ConfirmDialogComponent } from '../components/ConfirmDialogComponent';

/** POM del detalle de cliente `/clientes/:id` (issue #84). */
export class ClienteDetallePage extends BasePage {
  readonly botonOpciones = this.page.getByRole('button', { name: 'Opciones' });

  /**
   * Dropdown del menú "Opciones", anclado por estructura (el ancho varía por
   * componente: cliente w-40, presupuesto w-44, trabajo w-48 — por eso el
   * selector NO fija el ancho). Scope obligatorio: getByRole sin scope
   * matchea también los botones del FAB de ProtectedLayout
   * (case-insensitive).
   */
  readonly menuOpciones = this.page.locator('.absolute.right-0.top-full.mt-1');

  /** El nombre del cliente se muestra en el header del detalle. */
  async verNombre(nombre: string): Promise<void> {
    await expect(this.page.getByText(nombre, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  /** Abre el menú de 3 puntos. */
  private async abrirMenu(): Promise<void> {
    await this.botonOpciones.click();
  }

  /**
   * Elimina el cliente vía UI: menú → Eliminar → confirmar diálogo.
   * Al confirmar, la app navega de vuelta a `/clientes`.
   */
  async eliminarCliente(): Promise<void> {
    await this.abrirMenu();
    await this.menuOpciones.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await new ConfirmDialogComponent().confirmar(this.page, 'Eliminar');
    await this.verURL(/\/clientes$/);
  }
}
