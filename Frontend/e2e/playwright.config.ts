import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { AUTH_STATE } from './fixtures/auth.fixture';

const CI = process.env.CI === '1' || process.env.CI === 'true';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * E2E de ShopMGR (issue #84).
 *
 * Projects:
 * - `setup`: un único login por UI que persiste storageState (localStorage con
 *   accessToken). Es la ÚNICA llamada a /Auth/IniciarSesion por UI en los
 *   flujos autenticados (respetar rate limit 5/min/IP del backend).
 * - `auth`: login/logout sin storageState (flujo completo de credenciales).
 * - `chromium-desktop`: specs de negocio con storageState del setup.
 * - `chromium-mobile`: verificación de sesión persistida y navegación mobile.
 *
 * El login por API (fixture `api`) suma ~2 llamadas extra a IniciarSesion en
 * total (beforeAll de trabajo-flujo y presupuesto-flujo). Con workers=2 en CI
 * el budget queda por debajo del límite de 5/min/IP.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : 1,
  reporter: CI
    ? [
        [
          'html',
          {
            open: 'never',
            // Fija el reporte en Frontend/playwright-report/ sin importar el cwd.
            outputFolder: fileURLToPath(new URL('../playwright-report', import.meta.url)),
          },
        ],
        ['github-actions'],
      ]
    : [
        [
          'html',
          {
            open: 'never',
            outputFolder: fileURLToPath(new URL('../playwright-report', import.meta.url)),
          },
        ],
        ['list'],
      ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'auth',
      testDir: './tests/auth',
      // El test de logout reutiliza el storageState del setup (0 logins extra).
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-desktop',
      testDir: './tests',
      testIgnore: ['**/setup/**', '**/auth/**', '**/mobile/**'],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },
    {
      name: 'chromium-mobile',
      testDir: './tests/mobile',
      dependencies: ['setup'],
      use: {
        // Pixel 7 (Chromium) en vez de iPhone 12 (WebKit): WebKit requiere
        // deps del SO (libicu74/libflite1) que no se pueden instalar sin sudo
        // en todos los entornos. El spec mobile verifica sesión persistida +
        // bottom nav + viewport touch, independiente del engine.
        ...devices['Pixel 7'],
        storageState: AUTH_STATE,
      },
    },
  ],
});
