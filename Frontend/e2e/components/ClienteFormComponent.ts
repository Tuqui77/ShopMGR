import { expect, type Locator, type Page } from '@playwright/test';
import { esperarCierreModal } from '../utils/wait-helpers';

/** Formulario de cliente (modal) — `/clientes` o FAB "Crear Cliente". */
export class ClienteFormComponent {
  readonly modal: Locator;

  constructor(private readonly page: Page) {
    this.modal = this.page.locator('.modal-content').last();
  }

  /** Completa el formulario con placeholders estables (sin data-testid). */
  async completar(
    nombre: string,
    telefono: string,
    descripcionTelefono = 'Principal'
  ): Promise<void> {
    await this.modal.getByPlaceholder('Juan Pérez').fill(nombre);
    await this.modal.getByPlaceholder('Número de teléfono').fill(telefono);
    await this.modal.getByPlaceholder('Descripción (ej: Celular, Trabajo)').fill(descripcionTelefono);
  }

  /** Envía y espera el estado de éxito inline ("Cliente creado"). */
  async enviar(): Promise<void> {
    await this.modal.getByRole('button', { name: 'Crear Cliente', exact: true }).click();
    await expect(this.modal.getByText('Cliente creado')).toBeVisible({ timeout: 15_000 });
    await esperarCierreModal(this.modal);
  }
}
