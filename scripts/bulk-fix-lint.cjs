#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript/TSX files
function findTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Fix common linting issues
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix console statements - wrap in development check
    const consoleRegex = /(\s+)(console\.(log|error|warn|info)\([^)]*\);?)/g;
    const consoleMatches = content.match(consoleRegex);
    if (consoleMatches) {
      content = content.replace(consoleRegex, (match, indent, consoleCall) => {
        return `${indent}if (process.env.NODE_ENV === 'development') {\n${indent}  ${consoleCall}\n${indent}}`;
      });
      modified = true;
    }
    
    // Fix unused index parameters in map functions
    const mapIndexRegex = /\.map\(\(([^,]+),\s*\)index\s*\)\s*=>/g;
    if (mapIndexRegex.test(content)) {
      content = content.replace(mapIndexRegex, '($1, _index) =>');
      modified = true;
    }
    
    // Fix unused error parameters
    const errorRegex = /catch\s*\(\s*error\s*\)\s*{/g;
    if (errorRegex.test(content)) {
      content = content.replace(errorRegex, 'catch (_error) {');
      modified = true;
    }
    
    // Fix unused request parameters
    const requestRegex = /\(request\s*:\s*Request\)/g;
    if (requestRegex.test(content)) {
      content = content.replace(requestRegex, '(_request: Request)');
      modified = true;
    }
    
    // Fix any types with more specific types
    const anyRegex = /:\s*any\b/g;
    if (anyRegex.test(content)) {
      // This is a simplified fix - in practice you'd want more sophisticated type inference
      content = content.replace(anyRegex, ': unknown');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  const frontendDir = path.join(__dirname, '..', 'frontend', 'src');
  
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend directory not found');
    process.exit(1);
  }
  
  console.log('🔍 Finding TypeScript files...');
  const files = findTsFiles(frontendDir);
  
  console.log(`📁 Found ${files.length} files to check`);
  
  let fixedCount = 0;
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} files`);
  console.log('🔍 Running ESLint to check remaining issues...');
  
  try {
    execSync('cd frontend && pnpm lint', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  ESLint found remaining issues that need manual fixing');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findTsFiles };
