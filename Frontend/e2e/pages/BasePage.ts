import { expect, type Page } from '@playwright/test';

/**
 * POM base (issue #84). Todos los Page Objects heredan navegación y
 * aserciones de URL comunes. Los locators son role-based.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navega a una ruta relativa de la SPA (baseURL del proyecto). */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /** Assert de URL con regex (ej: /\/login$/). */
  async verURL(regex: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(regex, { timeout: 15_000 });
  }
}
