import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock window.location.
//
// Debe conservar la API completa de Location: pathname/search/hash se derivan del
// history real de jsdom (vía document.URL) para que BrowserRouter/react-router
// funcionen en tests que renderizan <App /> (issue #67). El mock anterior solo
// tenía href/origin/replace y dejaba window.location.pathname en undefined, lo
// que rompía el matching de rutas y provocaba bucles infinitos de re-render.
let rawHref = 'http://localhost/';
const locationMock = {
  get href() {
    return rawHref;
  },
  set href(value: unknown) {
    rawHref = String(value);
    // Sincroniza el history real de jsdom para que document.URL/pathname
    // reflejen la navegación (mismo comportamiento que un navegador).
    try {
      window.history.pushState({}, '', rawHref);
    } catch {
      // URL inválida: se conserva el valor crudo para la lectura.
    }
  },
  get origin() {
    return 'http://localhost';
  },
  get pathname() {
    return new URL(document.URL).pathname;
  },
  get search() {
    return new URL(document.URL).search;
  },
  get hash() {
    return new URL(document.URL).hash;
  },
  replace: vi.fn(),
  assign: vi.fn(),
  reload: vi.fn(),
};
Object.defineProperty(globalThis, 'location', { value: locationMock, writable: true });

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
