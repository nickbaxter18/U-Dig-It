#!/usr/bin/env node
/**
 * Cursor Action: Generate React Component
 * Usage: node scripts/cursor-actions/generate-component.js <component-name> [path] [--no-tests]
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const componentName = args[0];
const pathArg = args[1];
const noTests = args.includes('--no-tests');

if (!componentName) {
  console.error('Usage: generate-component.js <component-name> [path] [--no-tests]');
  console.error('Example: generate-component.js BookingCard components/booking');
  process.exit(1);
}

// Determine component path
const componentPath = pathArg 
  ? join(process.cwd(), 'frontend', 'src', pathArg)
  : join(process.cwd(), 'frontend', 'src', 'components');

const componentDir = join(componentPath, componentName);
const componentFile = join(componentDir, `${componentName}.tsx`);
const testFile = join(componentDir, `${componentName}.test.tsx`);

// Ensure directory exists
mkdirSync(componentDir, { recursive: true });

// Component template
const componentTemplate = `'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface ${componentName}Props {
  // Add your props here
}

export default function ${componentName}({ ...props }: ${componentName}Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Add your data loading logic here
        setLoading(false);
      } catch (err) {
        logger.error('Component error', {
          component: '${componentName}',
          error: err instanceof Error ? err.message : 'Unknown error'
        }, err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="${componentName.toLowerCase()}">
      {/* Add your component JSX here */}
    </div>
  );
}
`;

writeFileSync(componentFile, componentTemplate);
console.log(`✅ Component created: ${componentFile}`);

// Test file template
if (!noTests) {
  const testTemplate = `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  describe('when rendered', () => {
    it('should render without errors', () => {
      // Arrange
      const props = {};

      // Act
      const { container } = render(<${componentName} {...props} />);

      // Assert
      expect(container).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator', () => {
      // Test loading state
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', () => {
      // Test error scenarios
    });
  });
});
`;

  writeFileSync(testFile, testTemplate);
  console.log(`✅ Test file created: ${testFile}`);
}

console.log(`📝 Edit the files to add your component logic`);

// Optionally open in editor
try {
  execSync(`code ${componentFile}`, { stdio: 'ignore' });
} catch (e) {
  // VS Code not available, that's okay
}
