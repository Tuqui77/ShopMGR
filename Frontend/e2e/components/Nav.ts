import { expect, type Page } from '@playwright/test';

/**
 * Componentes de navegación (issue #84): Sidebar (desktop), BottomNav
 * (mobile) y FAB. Se usa el contenedor `aside.sidebar` / `nav.bottom-nav`
 * para desambiguar links duplicados (ej: "Trabajos" existe en ambos).
 */
export class Nav {
  constructor(private readonly page: Page) {}

  private get sidebar() {
    return this.page.locator('aside.sidebar');
  }

  private get bottomNav() {
    return this.page.locator('nav.bottom-nav');
  }

  /** Navega desde la sidebar (desktop). */
  async navegarDesdeSidebar(label: string): Promise<void> {
    await this.sidebar.getByRole('link', { name: label, exact: true }).click();
  }

  /** Navega desde la bottom nav (mobile). */
  async navegarDesdeBottomNav(label: string): Promise<void> {
    await this.bottomNav.getByRole('link', { name: label }).click();
  }

  /** Cierra sesión desde la sidebar (botón con aria-label dedicado). */
  async cerrarSesion(): Promise<void> {
    await this.sidebar.getByRole('button', { name: 'Cerrar sesión' }).click();
  }

  /** Abre el menú del FAB. */
  async abrirFAB(): Promise<void> {
    await this.page.getByRole('button', { name: 'Abrir menú' }).click();
  }

  /** Cierra el menú del FAB si está abierto (Escape). */
  async cerrarFAB(): Promise<void> {
    const boton = this.page.getByRole('button', { name: 'Cerrar menú' });
    if (await boton.isVisible().catch(() => false)) {
      await this.page.keyboard.press('Escape');
    }
  }

  /** Acción del FAB: crear trabajo (abre TrabajoForm). */
  async crearTrabajoDesdeFAB(): Promise<void> {
    await this.abrirFAB();
    await this.page.getByRole('button', { name: 'Crear Trabajo' }).click();
    await expect(this.page.locator('.modal-content').last()).toBeVisible({ timeout: 15_000 });
  }

  /** Acción del FAB: crear cliente (abre ClienteForm). */
  async crearClienteDesdeFAB(): Promise<void> {
    await this.abrirFAB();
    await this.page.getByRole('button', { name: 'Crear Cliente' }).click();
    await expect(this.page.locator('.modal-content').last()).toBeVisible({ timeout: 15_000 });
  }

  /** Acción del FAB: crear presupuesto (abre PresupuestoForm). */
  async crearPresupuestoDesdeFAB(): Promise<void> {
    await this.abrirFAB();
    await this.page.getByRole('button', { name: 'Crear Presupuesto' }).click();
    await expect(this.page.locator('.modal-content').last()).toBeVisible({ timeout: 15_000 });
  }
}
