#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Common fixes for linting issues
const fixes = [
  // Fix console statements
  {
    pattern: /console\.(log|error|warn|info)\(/g,
    replacement: match => {
      return `if (process.env.NODE_ENV === 'development') {\n        ${match}`;
    },
    postFix: content => {
      // Add closing brace for console statements
      return content.replace(/console\.(log|error|warn|info)\([^)]*\);?\s*$/gm, match => {
        return match + "\n      }";
      });
    },
  },

  // Fix unused index parameters in map functions
  {
    pattern: /\.map\(\([^,]+,\s*\)index\s*\)\s*=>/g,
    replacement: "($1_index) =>",
  },

  // Fix unused error parameters
  {
    pattern: /catch\s*\(\s*error\s*\)\s*{/g,
    replacement: "catch (_error) {",
  },

  // Fix unused request parameters
  {
    pattern: /\(request\s*:\s*Request\)/g,
    replacement: "(_request: Request)",
  },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    fixes.forEach(fix => {
      if (fix.pattern && fix.replacement) {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }

      if (fix.postFix) {
        const newContent = fix.postFix(content);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        traverse(fullPath);
      } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function main() {
  const frontendDir = path.join(__dirname, "..", "frontend", "src");

  if (!fs.existsSync(frontendDir)) {
    console.error("Frontend directory not found");
    process.exit(1);
  }

  console.log("Finding TypeScript files...");
  const files = findTsxFiles(frontendDir);

  console.log(`Found ${files.length} files to check`);

  let fixedCount = 0;
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} files`);
  console.log("Running ESLint to check remaining issues...");

  try {
    execSync("cd frontend && pnpm lint", { stdio: "inherit" });
  } catch (error) {
    console.log("ESLint found remaining issues that need manual fixing");
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findTsxFiles };
