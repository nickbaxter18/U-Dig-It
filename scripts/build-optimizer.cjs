const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Build Optimizer - Starting optimized build process...');

// Check if cache exists
const cacheDir = '.build-cache';
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ Build cache directory created');
}

// Run parallel builds
console.log('🔧 Running parallel builds...');
try {
  execSync('pnpm --recursive --parallel run build', { stdio: 'inherit' });
  console.log('✅ Parallel builds completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build optimization complete!');
