import { expect, type Locator, type Page } from '@playwright/test';
import { esperarCierreModal } from '../utils/wait-helpers';

/**
 * Formulario de presupuesto (modal) — vía FAB "Crear Presupuesto".
 * Flujo en 2 pasos: selección de cliente (search) → datos (título/horas).
 */
export class PresupuestoFormComponent {
  readonly modal: Locator;

  constructor(private readonly page: Page) {
    this.modal = this.page.locator('.modal-content').last();
  }

  /** Paso 1: busca y selecciona el cliente por nombre. */
  async seleccionarCliente(nombreCliente: string): Promise<void> {
    await this.modal.getByPlaceholder('Buscar cliente...').fill(nombreCliente);
    await this.modal.getByRole('button', { name: new RegExp(nombreCliente) }).click();
  }

  /** Paso 2: completa título y horas estimadas. */
  async completarDatos(titulo: string, horasEstimadas = 4): Promise<void> {
    await this.modal.getByPlaceholder('Reparación de motor').fill(titulo);
    const horasInput = this.modal.getByRole('spinbutton').first();
    await horasInput.fill(String(horasEstimadas));
  }

  /** Envía y espera el estado de éxito inline ("Presupuesto creado"). */
  async enviar(): Promise<void> {
    await this.modal.getByRole('button', { name: 'Crear Presupuesto', exact: true }).click();
    await expect(this.modal.getByText('Presupuesto creado')).toBeVisible({ timeout: 15_000 });
    await esperarCierreModal(this.modal);
  }
}
