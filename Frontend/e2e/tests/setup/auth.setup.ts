import { test as setup } from '@playwright/test';
import { AUTH_STATE, ADMIN_USERNAME, ADMIN_PASSWORD } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

/**
 * Setup global de sesión (issue #84): un único login por UI que persiste el
 * storageState (localStorage con accessToken) para todos los specs de negocio.
 * Es la ÚNICA llamada a /Auth/IniciarSesion por UI del suite autenticado.
 */
setup('sesión de administrador', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto('/login');
  await loginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);
  await new DashboardPage(page).verDashboard();
  await page.context().storageState({ path: AUTH_STATE });
});
