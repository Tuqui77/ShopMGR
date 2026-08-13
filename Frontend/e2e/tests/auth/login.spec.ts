import { test, expect } from '@playwright/test';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

/**
 * Flujo de autenticación (issue #84) — project 'auth', SIN storageState:
 * cada test parte de credenciales reales.
 *
 * El logout vive en logout.spec.ts con storageState del setup: verificar el
 * logout NO requiere re-login, y cada login evita chocar con el rate limit
 * 5/min/IP del backend (setup 1 + login válido 1 + login inválido 1 = 3 por
 * corrida).
 *
 * ⚠️ No declarar `test.use({ storageState })` aquí: un test.use al final de
 * un describe se aplica a TODOS los tests del archivo (no solo a los que le
 * siguen), lo que inyectaba la sesión del setup en los tests de login y
 * ocultaba el form (`/login` con token no muestra los inputs).
 */
test.describe('Autenticación', () => {
  test('login con credenciales válidas redirige al dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);
    await new DashboardPage(page).verDashboard();
  });

  test('login con credenciales inválidas muestra error y permanece en /login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.login('usuario-invalido', 'clave-invalida');
    await loginPage.verErrorCredenciales();
    await loginPage.verURL(/\/login$/);
  });
});
