#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get ESLint output
const lintOutput = execSync('pnpm lint 2>&1', {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024
});

// Parse unused variable warnings
const unusedVarRegex = /(.+?):(\d+):(\d+)\s+warning\s+'(.+?)' is (?:assigned a value but never used|defined but never used)/g;
const matches = [...lintOutput.matchAll(unusedVarRegex)];

console.log(`Found ${matches.length} unused variable warnings`);

// Group by file
const fileChanges = new Map();
for (const match of matches) {
  const [, filePath, line, , varName] = match;
  const cleanPath = filePath.replace('/home/vscode/Kubota-rental-platform/frontend/', '');
  
  if (!fileChanges.has(cleanPath)) {
    fileChanges.set(cleanPath, []);
  }
  
  fileChanges.get(cleanPath).push({
    line: parseInt(line),
    varName: varName
  });
}

console.log(`\nProcessing ${fileChanges.size} files...`);

let totalFixed = 0;

for (const [filePath, changes] of fileChanges) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  // Sort changes by line number in reverse to avoid line number shifts
  changes.sort((a, b) => b.line - a.line);
  
  for (const change of changes) {
    const lineIndex = change.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex];
    const varName = change.varName;
    
    // Skip if already prefixed with underscore
    if (varName.startsWith('_')) continue;
    
    // Match different patterns: const/let/function param
    const patterns = [
      // const/let assignments: const varName =
      new RegExp(`\\b(const|let)\\s+(${varName})\\s*=`, 'g'),
      // function parameters: (varName: type)
      new RegExp(`\\(([^)]*\\b)(${varName})(\\s*:)`, 'g'),
      // function parameters: , varName: type
      new RegExp(`(,\\s*)(${varName})(\\s*:)`, 'g'),
      // destructuring: { varName }
      new RegExp(`(\\{\\s*[^}]*\\b)(${varName})(\\b[^}]*\\})`, 'g'),
    ];
    
    let newLine = line;
    let replaced = false;
    
    for (const pattern of patterns) {
      const testLine = newLine.replace(pattern, (match, g1, g2, g3) => {
        replaced = true;
        return g1 + '_' + g2 + (g3 || '');
      });
      
      if (replaced) {
        newLine = testLine;
        break;
      }
    }
    
    if (replaced) {
      lines[lineIndex] = newLine;
      totalFixed++;
      console.log(`✅ ${filePath}:${change.line} - Prefixed '${varName}' with underscore`);
    } else {
      console.log(`⚠️  ${filePath}:${change.line} - Could not auto-fix '${varName}'`);
    }
  }
  
  // Write back to file
  fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
}

console.log(`\n✨ Fixed ${totalFixed} unused variables across ${fileChanges.size} files`);

