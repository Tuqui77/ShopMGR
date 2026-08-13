import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';
import { Nav } from '../../components/Nav';

/**
 * Mobile (issue #84) — project 'chromium-mobile' (iPhone 12) con storageState:
 * valida que la sesión persiste y que la navegación usa la BottomNav
 * (labels distintos a la sidebar desktop: "Presup." / "Config.").
 */
test.describe('Mobile', () => {
  test('sesión persistida y navegación con bottom nav', async ({ page }) => {
    await page.goto('/');
    await new DashboardPage(page).verDashboard();

    const nav = new Nav(page);
    await nav.navegarDesdeBottomNav('Clientes');
    await expect(page).toHaveURL(/\/clientes$/, { timeout: 15_000 });

    await nav.navegarDesdeBottomNav('Trabajos');
    await expect(page).toHaveURL(/\/trabajos$/, { timeout: 15_000 });

    await nav.navegarDesdeBottomNav('Presup.');
    await expect(page).toHaveURL(/\/presupuestos$/, { timeout: 15_000 });
  });
});
