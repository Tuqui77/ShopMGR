import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Modal de registro de horas (issue #84). Dos vistas: carga de horas
 * (spinbutton + descripción + "Guardar Horas") y confirmación ("¡Listo!").
 *
 * Nota: el modal abre directamente sobre el trabajo activo — NO hay vista de
 * búsqueda de trabajo (el plan original la contemplaba, la SUT no).
 *
 * El botón "Guardar Horas" queda disabled si no hay costo hora configurado
 * (valorHora === 0/undefined) — el spec debe precargarlo vía API.
 */
export class HoursModalComponent {
  readonly modal: Locator;

  constructor(private readonly page: Page) {
    this.modal = this.page.locator('.modal-content').last();
  }

  /** Carga horas + descripción y guarda. */
  async completarYGuardar(horas: number, descripcion: string): Promise<void> {
    await this.modal.getByRole('spinbutton').first().fill(String(horas));
    await this.modal.getByPlaceholder('Cambio de pastillas, Inspección...').fill(descripcion);
    await this.modal.getByRole('button', { name: 'Guardar Horas' }).click();
  }

  /** Vista de confirmación: heading "¡Listo!" + "Horas registradas". */
  async verExito(horas: number): Promise<void> {
    await expect(this.modal.getByText('Horas registradas')).toBeVisible({ timeout: 15_000 });
    await expect(this.modal.getByText('¡Listo!')).toBeVisible();
  }
}
