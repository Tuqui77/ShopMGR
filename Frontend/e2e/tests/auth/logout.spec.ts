import { test, expect } from '@playwright/test';
import { AUTH_STATE } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';
import { Nav } from '../../components/Nav';

/**
 * Logout (issue #84) — project 'auth'.
 *
 * Vive en un archivo separado de login.spec.ts porque el test.use de
 * storageState se aplica a TODOS los tests del archivo: si conviviera con los
 * tests de login, inyectaría la sesión del setup y ocultaría el form de
 * /login. Aquí el use está al inicio del describe (patrón válido) y no hay
 * tests de login en el mismo scope.
 *
 * 0 logins extra: reutiliza el storageState generado por el setup.
 */
test.use({ storageState: AUTH_STATE });
test.describe('Cierre de sesión', () => {
  test('logout desde la sidebar devuelve al login', async ({ page }) => {
    await page.goto('/');
    await new DashboardPage(page).verDashboard();

    await new Nav(page).cerrarSesion();
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  });
});
