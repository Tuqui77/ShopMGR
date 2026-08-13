import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM del Dashboard `/` (issue #84). Sirve de punto de verificación de sesión. */
export class DashboardPage extends BasePage {
  readonly enlaceInicio = this.page.getByRole('link', { name: 'Inicio' });

  /** El dashboard autenticado muestra la sidebar con el link "Inicio". */
  async verDashboard(): Promise<void> {
    await expect(this.enlaceInicio).toBeVisible({ timeout: 15_000 });
  }
}
