import { expect, type Locator, type Page } from '@playwright/test';
import { esperarCierreModal } from '../utils/wait-helpers';

/**
 * Formulario de trabajo (modal) — vía FAB "Crear Trabajo".
 * IMPORTANTE: a diferencia de los otros forms, NO muestra mensaje de éxito:
 * onSuccess cierra el modal y la lista `/trabajos` es la fuente de verdad.
 */
export class TrabajoFormComponent {
  readonly modal: Locator;

  constructor(private readonly page: Page) {
    this.modal = this.page.locator('.modal-content').last();
  }

  async completar(titulo: string, nombreCliente: string): Promise<void> {
    await this.modal.getByPlaceholder('Ej: Cambio de aceite').fill(titulo);
    await this.modal.getByRole('combobox').first().selectOption({ label: nombreCliente });
  }

  /** Envía y espera el cierre del modal (creación exitosa). */
  async enviar(): Promise<void> {
    await this.modal.getByRole('button', { name: 'Crear', exact: true }).click();
    await esperarCierreModal(this.modal);
  }
}
