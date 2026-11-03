/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Same headers as vercel.json so `vite preview` (used by e2e tests) enforces the production CSP.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export default defineConfig({
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
  preview: {
    headers: {
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    },
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
