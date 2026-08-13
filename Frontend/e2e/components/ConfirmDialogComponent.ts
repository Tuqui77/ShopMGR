import { expect, type Page } from '@playwright/test';

/**
 * Diálogo de confirmación custom (`.modal-content` con título + botones).
 * Usado en: eliminar cliente, eliminar trabajo, aceptar/rechazar presupuesto.
 * (Los flujos Iniciar/Terminar trabajo usan `confirm()` nativo — ver POM.)
 */
export class ConfirmDialogComponent {
  /** Confirma la acción: clickea el botón `confirmLabel` dentro del modal. */
  async confirmar(page: Page, confirmLabel: string): Promise<void> {
    const modal = page.locator('.modal-content').last();
    await modal.getByRole('button', { name: confirmLabel, exact: true }).click();
  }

  /** Cancela la acción. */
  async cancelar(page: Page): Promise<void> {
    const modal = page.locator('.modal-content').last();
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  }
}
