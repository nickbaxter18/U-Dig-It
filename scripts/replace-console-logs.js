#!/usr/bin/env node

/**
 * Console Log Replacement Script
 *
 * This script systematically replaces console.log statements with proper logger calls
 * across the entire frontend codebase.
 *
 * Usage: node scripts/replace-console-logs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_DIR = path.join(__dirname, '../frontend/src');
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];
const EXCLUDE_FILES = ['logger.ts']; // Don't modify the logger itself

// Patterns to replace
const REPLACEMENTS = [
  // Console.log patterns
  {
    pattern: /console\.log\(([^)]+)\);?/g,
    replacement: (match, content) => {
      // Extract the message and any additional parameters
      const cleanContent = content.trim();
      return `logger.debug(${cleanContent}, { component: '${getComponentName()}', action: 'debug' });`;
    }
  },
  // Console.error patterns
  {
    pattern: /console\.error\(([^)]+)\);?/g,
    replacement: (match, content) => {
      const cleanContent = content.trim();
      return `logger.error(${cleanContent}, { component: '${getComponentName()}', action: 'error' });`;
    }
  },
  // Console.warn patterns
  {
    pattern: /console\.warn\(([^)]+)\);?/g,
    replacement: (match, content) => {
      const cleanContent = content.trim();
      return `logger.warn(${cleanContent}, { component: '${getComponentName()}', action: 'warning' });`;
    }
  },
  // Console.info patterns
  {
    pattern: /console\.info\(([^)]+)\);?/g,
    replacement: (match, content) => {
      const cleanContent = content.trim();
      return `logger.info(${cleanContent}, { component: '${getComponentName()}', action: 'info' });`;
    }
  }
];

let currentFile = '';

function getComponentName() {
  if (!currentFile) return 'unknown';

  const relativePath = path.relative(FRONTEND_DIR, currentFile);
  const pathParts = relativePath.split(path.sep);

  // Extract meaningful component name from file path
  if (pathParts.includes('api')) {
    return `api-${pathParts[pathParts.length - 2] || 'unknown'}`;
  } else if (pathParts.includes('components')) {
    return pathParts[pathParts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
  } else if (pathParts.includes('lib')) {
    return pathParts[pathParts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
  } else if (pathParts.includes('app')) {
    return `app-${pathParts[pathParts.length - 1].replace(/\.(tsx?|jsx?)$/, '')}`;
  }

  return pathParts[pathParts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
}

function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  // Only process TypeScript/JavaScript files
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return false;
  }

  // Skip excluded files
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }

  return true;
}

function shouldProcessDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return !EXCLUDE_DIRS.includes(dirName);
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file already imports logger
    const hasLoggerImport = content.includes("import { logger }") || content.includes("from '@/lib/logger'");

    // Check if file has console statements
    const hasConsoleStatements = /console\.(log|error|warn|info|debug)/.test(content);

    if (!hasConsoleStatements) {
      return; // No console statements to replace
    }

    currentFile = filePath;
    let newContent = content;
    let hasChanges = false;

    // Apply replacements
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      const beforeReplace = newContent;
      newContent = newContent.replace(pattern, replacement);
      if (newContent !== beforeReplace) {
        hasChanges = true;
      }
    });

    // Add logger import if needed and changes were made
    if (hasChanges && !hasLoggerImport) {
      // Find the best place to add the import
      const lines = newContent.split('\n');
      let importIndex = -1;

      // Look for existing imports
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          importIndex = i;
        } else if (lines[i].trim() === '' && importIndex !== -1) {
          break;
        }
      }

      if (importIndex !== -1) {
        lines.splice(importIndex + 1, 0, "import { logger } from '@/lib/logger';");
        newContent = lines.join('\n');
      }
    }

    // Write file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (shouldProcessDirectory(itemPath)) {
          processDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        if (shouldProcessFile(itemPath)) {
          processFile(itemPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log('🔄 Starting console log replacement...');
console.log(`📁 Processing directory: ${FRONTEND_DIR}`);

if (!fs.existsSync(FRONTEND_DIR)) {
  console.error(`❌ Directory not found: ${FRONTEND_DIR}`);
  process.exit(1);
}

processDirectory(FRONTEND_DIR);

console.log('✅ Console log replacement completed!');
console.log('📝 Note: Please review the changes and adjust logger context as needed.');
