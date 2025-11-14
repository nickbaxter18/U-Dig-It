const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.analysisResults = {};
  }

  async analyze() {
    console.log('📊 Bundle Analyzer - Starting intelligent analysis...');

    // Analyze frontend bundle
    await this.analyzeFrontend();

    // Analyze backend bundle
    await this.analyzeBackend();

    // Generate optimization recommendations
    this.generateRecommendations();

    console.log('✅ Bundle analysis complete!');
  }

  async analyzeFrontend() {
    console.log('🔍 Analyzing frontend bundle...');

    try {
      // Build frontend with analysis
      execSync('pnpm --filter frontend run build', { stdio: 'pipe' });

      // Analyze bundle size
      const buildDir = 'frontend/.next';
      if (fs.existsSync(buildDir)) {
        const stats = this.getDirectoryStats(buildDir);
        this.analysisResults.frontend = stats;
        console.log(`📦 Frontend bundle: ${stats.size} (${stats.files} files)`);
      }
    } catch (error) {
      console.error('❌ Frontend analysis failed:', error.message);
    }
  }

  async analyzeBackend() {
    console.log('🔍 Analyzing backend bundle...');

    try {
      // Build backend
      execSync('pnpm --filter backend run build', { stdio: 'pipe' });

      // Analyze bundle size
      const buildDir = 'backend/dist';
      if (fs.existsSync(buildDir)) {
        const stats = this.getDirectoryStats(buildDir);
        this.analysisResults.backend = stats;
        console.log(`📦 Backend bundle: ${stats.size} (${stats.files} files)`);
      }
    } catch (error) {
      console.error('❌ Backend analysis failed:', error.message);
    }
  }

  getDirectoryStats(dir) {
    const files = this.getAllFiles(dir);
    const totalSize = files.reduce((sum, file) => {
      try {
        return sum + fs.statSync(file).size;
      } catch {
        return sum;
      }
    }, 0);

    return {
      files: files.length,
      size: this.formatBytes(totalSize),
      totalSize,
    };
  }

  getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateRecommendations() {
    console.log('💡 Optimization Recommendations:');
    console.log('================================');

    if (this.analysisResults.frontend) {
      const frontendSize = this.analysisResults.frontend.totalSize;
      if (frontendSize > 5 * 1024 * 1024) {
        // 5MB
        console.log('🔧 Frontend bundle is large - consider code splitting');
      }
    }

    if (this.analysisResults.backend) {
      const backendSize = this.analysisResults.backend.totalSize;
      if (backendSize > 10 * 1024 * 1024) {
        // 10MB
        console.log('🔧 Backend bundle is large - consider optimization');
      }
    }

    console.log('✅ Bundle analysis recommendations generated');
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze();
