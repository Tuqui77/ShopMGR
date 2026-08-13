/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/types.ts',
        'src/**/index.css',
        'src/main.tsx',
        'src/App.tsx',
        'src/__tests__/**',
      ],
      // Quality gate (#85): baseline 2026-08-13 = 51.92% líneas.
      thresholds: {
        lines: 50,
      },
    },
  },
})
