import { expect, type Locator } from '@playwright/test';

/**
 * Espera a que un modal (`.modal-content`) desaparezca del DOM.
 * Los modales de ShopMGR se cierran solos tras ~1.5s de success.
 */
export async function esperarCierreModal(modal: Locator): Promise<void> {
  await expect(modal).toBeHidden({ timeout: 10_000 });
}
