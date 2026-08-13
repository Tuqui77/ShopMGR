import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM de `/login` (issue #84). */
export class LoginPage extends BasePage {
  // role=textbox: excluye el toggle "Mostrar contraseña" (role=button, issue
  // #96) que getByLabel matcheaba por substring → strict mode violation.
  readonly usuarioInput = this.page.getByRole('textbox', { name: 'Usuario' });
  readonly contraseñaInput = this.page.getByRole('textbox', { name: 'Contraseña' });
  // exact: excluye "Iniciar sesión con passkey" (botón secundario del login).
  readonly submitButton = this.page.getByRole('button', { name: 'Iniciar sesión', exact: true });
  readonly errorCredenciales = this.page.getByText(/incorrectos/);

  /** Completa el formulario y envía. No asume redirección. */
  async login(usuario: string, contraseña: string): Promise<void> {
    await this.usuarioInput.fill(usuario);
    await this.contraseñaInput.fill(contraseña);
    await this.submitButton.click();
  }

  /** El error de credenciales inválidas debe aparecer (string plano del backend). */
  async verErrorCredenciales(): Promise<void> {
    await expect(this.errorCredenciales).toBeVisible({ timeout: 15_000 });
  }
}
