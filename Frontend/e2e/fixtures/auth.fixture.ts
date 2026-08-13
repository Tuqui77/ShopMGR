import { expect, test, type Page } from '@playwright/test';

import { fileURLToPath } from 'node:url';

/** Storage state compartido: lo genera `tests/setup/auth.setup.ts`. */
export const AUTH_STATE = fileURLToPath(
  new URL('../test-results/.auth/admin.json', import.meta.url)
);

/**
 * Credenciales de admin: viajan por env (secrets en CI), nunca hardcoded.
 * Los defaults coinciden con el seeder local (environment.env → SysAdmin).
 */
export const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'SysAdmin';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'changeme';

/**
 * Garantiza sesión iniciada en `page` de forma idempotente.
 *
 * - Si el storageState ya trae el accessToken, la app redirige a `/` y esta
 *   función no hace nada (caso nominal de los specs de negocio).
 * - Si el login expiró o se llega sin storageState, completa el login por UI.
 */
export async function ensureInicioSesion(page: Page): Promise<void> {
  await test.step('Asegurar sesión iniciada', async () => {
    await page.goto('/');
    const loginForm = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
    if (await loginForm.isVisible().catch(() => false)) {
      // role=textbox: evita el substring match de getByLabel contra el toggle
      // "Mostrar contraseña" (role=button) del issue #96.
      await page.getByRole('textbox', { name: 'Usuario' }).fill(ADMIN_USERNAME);
      await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
      await loginForm.click();
    }
    await expect(page.getByRole('link', { name: 'Inicio' })).toBeVisible({
      timeout: 15_000,
    });
  });
}

/**
 * Garantiza cierre de sesión de forma idempotente.
 * Se usa en el flujo de logout y como cleanup defensivo.
 */
export async function ensureCierreSesion(page: Page): Promise<void> {
  await test.step('Cerrar sesión', async () => {
    await page.goto('/');
    const logoutButton = page.getByRole('button', { name: 'Cerrar sesión' });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    } else {
      await expect(
        page.getByRole('button', { name: 'Iniciar sesión', exact: true })
      ).toBeVisible({
        timeout: 15_000,
      });
    }
  });
}
