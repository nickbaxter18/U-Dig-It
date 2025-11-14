import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['src/lib/id-verification/__tests__/**/*.test.ts', 'node'],
    ],
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    // Enhanced test configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'dist/',
        'build/',
        'e2e/',
        'cypress/',
        'storybook-static/',
        '.next/',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.js',
        'vitest.config.ts',
        'playwright.config.ts',
        'jest.config.js',
        'src/types/**',
        'src/styles/**',
        'src/middleware.ts',
      ],
      thresholds: {
        // Progressive global thresholds (start at current ~65%, increase to 80%)
        global: {
          branches: 65,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // Higher thresholds for critical components
        './src/components/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Business logic components need highest coverage
        './src/components/EnhancedBookingFlow.tsx': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        './src/components/BookingFlow.tsx': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // API routes (many untested, start lower)
        './src/app/api/': {
          branches: 60,
          functions: 65,
          lines: 65,
          statements: 65,
        },
        // Critical API routes (higher standards)
        './src/app/api/bookings/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/app/api/stripe/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Lib utilities (target: 90%)
        './src/lib/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Security & validation (must be 100%)
        './src/lib/input-sanitizer.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        './src/lib/validation.ts': {
          branches: 95,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        './src/lib/html-sanitizer.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        // Auth & Supabase (critical: 95%)
        './src/lib/supabase/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      // Watermarks for coverage quality levels (visual indicators)
      watermarks: {
        lines: [65, 90],      // Yellow at 65%, green at 90%
        functions: [70, 90],
        branches: [65, 85],
        statements: [70, 90],
      },
      // Clean coverage directory before each run
      clean: true,
      // Report uncovered lines
      skipFull: false,
      // Include source maps for accurate reporting
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
    // Performance optimizations - simplified for UI stability
    pool: 'threads', // Changed from forks for better UI compatibility
    maxConcurrency: 2, // Reduced for stability
    isolate: true,
    fileParallelism: false, // Disabled for UI
    // Test timeout and retry configuration
    testTimeout: 30000,
    retry: 0,
    // Bail out after first test failure in CI
    bail: process.env.CI ? 1 : 0,
    // Reporter configuration
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
    // Environment variables for tests handled in setup.ts
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
