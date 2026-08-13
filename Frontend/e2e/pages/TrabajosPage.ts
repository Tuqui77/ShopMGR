import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM de la lista de trabajos `/trabajos` (issue #84). */
export class TrabajosPage extends BasePage {
  readonly vacio = this.page.getByText('No hay trabajos');

  /** Navega al detalle de un trabajo por su tarjeta (link con título). */
  async abrirTrabajo(titulo: string): Promise<void> {
    await this.tarjetaTrabajo(titulo).click();
  }

  /** El trabajo debe estar visible en la lista (creado). */
  async verTrabajo(titulo: string): Promise<void> {
    await expect(this.tarjetaTrabajo(titulo)).toBeVisible({ timeout: 15_000 });
  }

  /** El trabajo debe haber desaparecido de la lista (eliminado). */
  async verTrabajoOculto(titulo: string): Promise<void> {
    await expect(this.tarjetaTrabajo(titulo)).toHaveCount(0, { timeout: 15_000 });
  }

  private tarjetaTrabajo(titulo: string) {
    return this.page.getByRole('link', { name: new RegExp(titulo) });
  }
}
