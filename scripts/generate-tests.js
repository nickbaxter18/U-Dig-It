#!/usr/bin/env node
/**
 * Automated Test Generator
 * Analyzes coverage gaps and generates test stubs with AI assistance
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const FRONTEND_SRC = join(ROOT_DIR, 'frontend', 'src');

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build', 'coverage', '__tests__'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (['.ts', '.tsx'].includes(extname(file)) && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function findTestFile(sourceFile) {
  const ext = extname(sourceFile);
  const baseName = sourceFile.replace(ext, '');
  const testFile = baseName + '.test' + ext;
  return testFile;
}

function analyzeFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const testFile = findTestFile(filePath);
  const hasTest = statSync(testFile).isFile().catch(() => false);
  
  // Extract exports
  const exports = [];
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|async\s+function)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Extract components
  const componentRegex = /export\s+(?:default\s+)?function\s+(\w+)/g;
  const components = [];
  while ((match = componentRegex.exec(content)) !== null) {
    components.push(match[1]);
  }
  
  return {
    file: filePath,
    hasTest,
    exports,
    components,
    needsTests: !hasTest && (exports.length > 0 || components.length > 0)
  };
}

function generateTestStub(filePath, analysis) {
  const relativePath = filePath.replace(ROOT_DIR + '/', '');
  const testFile = findTestFile(filePath);
  const testDir = dirname(testFile);
  
  mkdirSync(testDir, { recursive: true });
  
  const componentName = analysis.components[0] || analysis.exports[0] || 'Component';
  const importPath = relativePath.replace(/\.tsx?$/, '').replace(/^frontend\/src\//, '@/');
  
  const stub = `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ${componentName} from '${importPath}';

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without errors', () => {
    const { container } = render(<${componentName} />);
    expect(container).toBeInTheDocument();
  });

  // TODO: Add more test cases
  // - Test props
  // - Test user interactions
  // - Test error states
  // - Test loading states
});
`;

  writeFileSync(testFile, stub);
  return testFile;
}

function generateTestsForCoverageGaps() {
  console.log('🔍 Analyzing coverage gaps...\n');
  
  const files = getAllFiles(FRONTEND_SRC);
  const needsTests = [];
  
  files.forEach(file => {
    try {
      const analysis = analyzeFile(file);
      if (analysis.needsTests) {
        needsTests.push(analysis);
      }
    } catch (error) {
      // File might not exist or be readable
    }
  });
  
  console.log(`Found ${needsTests.length} files needing tests\n`);
  
  return needsTests;
}

// Main execution
const command = process.argv[2];
const target = process.argv[3];

if (!command || command === '--help') {
  console.log('🧪 Test Generator\n');
  console.log('Usage: node scripts/generate-tests.js <command> [target]\n');
  console.log('Commands:');
  console.log('  coverage-gaps  - Generate tests for files without tests');
  console.log('  file <path>    - Generate test for specific file');
  console.log('  component <name> - Generate test for component\n');
  process.exit(0);
}

if (command === 'coverage-gaps') {
  const needsTests = generateTestsForCoverageGaps();
  console.log('📝 Files needing tests:');
  needsTests.forEach(item => {
    console.log(`  - ${item.file.replace(ROOT_DIR + '/', '')}`);
  });
  console.log('\n💡 Use Cursor Composer to generate tests for these files');
}

if (command === 'file' && target) {
  const filePath = join(FRONTEND_SRC, target);
  const analysis = analyzeFile(filePath);
  const testFile = generateTestStub(filePath, analysis);
  console.log(`✅ Generated test stub: ${testFile}`);
}

console.log('\n💡 Tip: Use Cursor Composer (Ctrl+Shift+C) to fill in test logic');
