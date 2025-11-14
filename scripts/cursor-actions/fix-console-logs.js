#!/usr/bin/env node
/**
 * Auto-fix console.log statements to logger
 * Run: node scripts/cursor-actions/fix-console-logs.js [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT_DIR = process.cwd();
const FRONTEND_SRC = join(ROOT_DIR, 'frontend', 'src');

// Patterns to replace
const REPLACEMENTS = [
  {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: (match, content) => {
      const trimmed = content.trim();
      // If it's a simple string, use logger.info
      if ((trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.startsWith('`')) && 
          (trimmed.endsWith('"') || trimmed.endsWith("'") || trimmed.endsWith('`'))) {
        return `logger.info(${trimmed});`;
      }
      // If it has multiple args, use logger.info with metadata
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim());
        const message = parts[0];
        const metadata = parts.slice(1).join(', ');
        return `logger.info(${message}, { metadata: ${metadata} });`;
      }
      return `logger.info(${trimmed});`;
    }
  },
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: (match, content) => {
      const trimmed = content.trim();
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim());
        const message = parts[0];
        const error = parts.slice(1).join(', ');
        return `logger.error(${message}, { error: ${error} }, ${error});`;
      }
      return `logger.error(${trimmed});`;
    }
  },
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: (match, content) => {
      const trimmed = content.trim();
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim());
        const message = parts[0];
        const metadata = parts.slice(1).join(', ');
        return `logger.warn(${message}, { metadata: ${metadata} });`;
      }
      return `logger.warn(${trimmed});`;
    }
  },
  {
    pattern: /console\.debug\((.*?)\);?/g,
    replacement: (match, content) => {
      const trimmed = content.trim();
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim());
        const message = parts[0];
        const metadata = parts.slice(1).join(', ');
        return `logger.debug(${message}, { metadata: ${metadata} });`;
      }
      return `logger.debug(${trimmed});`;
    }
  }
];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))) {
      // Skip test files for now
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];
  
  // Check if logger is imported
  const hasLoggerImport = content.includes("import { logger }") || content.includes("import logger");
  
  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const newCode = typeof replacement === 'function' 
          ? replacement(match)
          : match.replace(pattern, replacement);
        
        if (newCode !== match) {
          changes.push({ old: match, new: newCode });
          content = content.replace(match, newCode);
          modified = true;
        }
      });
    }
  });
  
  // Add logger import if needed and file was modified
  if (modified && !hasLoggerImport) {
    // Try to find import section
    const importMatch = content.match(/^import .+ from ['"]@\/lib\/logger['"];?/m);
    if (!importMatch) {
      // Add import after other imports or at the top
      const lastImport = content.match(/^import .+ from .+;?$/gm);
      if (lastImport && lastImport.length > 0) {
        const lastImportLine = lastImport[lastImport.length - 1];
        const lastImportIndex = content.indexOf(lastImportLine) + lastImportLine.length;
        content = content.slice(0, lastImportIndex) + 
          '\nimport { logger } from \'@/lib/logger\';' + 
          content.slice(lastImportIndex);
      } else {
        content = 'import { logger } from \'@/lib/logger\';\n' + content;
      }
    }
  }
  
  if (modified && !DRY_RUN) {
    writeFileSync(filePath, content, 'utf8');
  }
  
  return { modified, changes };
}

// Main execution
console.log('🔍 Scanning for console.* statements...\n');

const files = getAllFiles(FRONTEND_SRC);
let totalFiles = 0;
let modifiedFiles = 0;
let totalChanges = 0;

files.forEach(file => {
  totalFiles++;
  const result = fixFile(file);
  
  if (result.modified) {
    modifiedFiles++;
    totalChanges += result.changes.length;
    
    console.log(`📝 ${file.replace(ROOT_DIR + '/', '')}`);
    result.changes.forEach(({ old, new: newCode }) => {
      console.log(`   - ${old.substring(0, 50)}...`);
      console.log(`   + ${newCode.substring(0, 50)}...`);
    });
    console.log('');
  }
});

console.log('\n📊 Summary:');
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files modified: ${modifiedFiles}`);
console.log(`   Total changes: ${totalChanges}`);

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN MODE - No files were modified');
  console.log('   Run without --dry-run to apply changes');
} else {
  console.log('\n✅ All changes applied!');
  console.log('   Remember to review the changes and test your code.');
}
