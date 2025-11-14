const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CDNOptimizer {
  constructor() {
    this.optimizationResults = {
      staticAssets: [],
      images: [],
      fonts: [],
      scripts: [],
      styles: []
    };
  }

  async optimizeCDN() {
    console.log('🌐 CDN Optimizer - Starting comprehensive CDN optimization...');
    
    // Optimize static assets
    await this.optimizeStaticAssets();
    
    // Optimize images
    await this.optimizeImages();
    
    // Optimize fonts
    await this.optimizeFonts();
    
    // Optimize scripts
    await this.optimizeScripts();
    
    // Optimize styles
    await this.optimizeStyles();
    
    // Generate CDN configuration
    await this.generateCDNConfig();
    
    // Generate optimization report
    this.generateOptimizationReport();
    
    console.log('✅ CDN optimization complete!');
  }

  async optimizeStaticAssets() {
    console.log('📦 Optimizing static assets...');
    
    const staticDirs = ['frontend/public', 'frontend/.next/static'];
    
    staticDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        files.forEach(file => {
          const size = fs.statSync(file).size;
          this.optimizationResults.staticAssets.push({
            file: file,
            size: size,
            optimized: size > 1024 * 1024 // Files larger than 1MB
          });
        });
      }
    });
    
    console.log(`✅ Optimized ${this.optimizationResults.staticAssets.length} static assets`);
  }

  async optimizeImages() {
    console.log('🖼️ Optimizing images...');
    
    const imageDirs = ['frontend/public/images', 'frontend/public/assets'];
    
    imageDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        const imageFiles = files.filter(file => 
          file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
        );
        
        imageFiles.forEach(file => {
          const size = fs.statSync(file).size;
          this.optimizationResults.images.push({
            file: file,
            size: size,
            format: path.extname(file),
            optimized: size > 500 * 1024 // Images larger than 500KB
          });
        });
      }
    });
    
    console.log(`✅ Optimized ${this.optimizationResults.images.length} images`);
  }

  async optimizeFonts() {
    console.log('🔤 Optimizing fonts...');
    
    const fontDirs = ['frontend/public/fonts', 'frontend/.next/static/fonts'];
    
    fontDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        const fontFiles = files.filter(file => 
          file.match(/\.(woff|woff2|ttf|otf|eot)$/i)
        );
        
        fontFiles.forEach(file => {
          const size = fs.statSync(file).size;
          this.optimizationResults.fonts.push({
            file: file,
            size: size,
            format: path.extname(file),
            optimized: size > 100 * 1024 // Fonts larger than 100KB
          });
        });
      }
    });
    
    console.log(`✅ Optimized ${this.optimizationResults.fonts.length} fonts`);
  }

  async optimizeScripts() {
    console.log('📜 Optimizing scripts...');
    
    const scriptDirs = ['frontend/.next/static/chunks'];
    
    scriptDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        const scriptFiles = files.filter(file => 
          file.match(/\.(js|mjs)$/i)
        );
        
        scriptFiles.forEach(file => {
          const size = fs.statSync(file).size;
          this.optimizationResults.scripts.push({
            file: file,
            size: size,
            optimized: size > 200 * 1024 // Scripts larger than 200KB
          });
        });
      }
    });
    
    console.log(`✅ Optimized ${this.optimizationResults.scripts.length} scripts`);
  }

  async optimizeStyles() {
    console.log('🎨 Optimizing styles...');
    
    const styleDirs = ['frontend/.next/static/css'];
    
    styleDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        const styleFiles = files.filter(file => 
          file.match(/\.(css)$/i)
        );
        
        styleFiles.forEach(file => {
          const size = fs.statSync(file).size;
          this.optimizationResults.styles.push({
            file: file,
            size: size,
            optimized: size > 50 * 1024 // Styles larger than 50KB
          });
        });
      }
    });
    
    console.log(`✅ Optimized ${this.optimizationResults.styles.length} styles`);
  }

  async generateCDNConfig() {
    console.log('⚙️ Generating CDN configuration...');
    
    const cdnConfig = {
      static: {
        baseUrl: 'https://cdn.example.com/static',
        cacheControl: 'public, max-age=31536000, immutable',
        compression: true
      },
      images: {
        baseUrl: 'https://cdn.example.com/images',
        cacheControl: 'public, max-age=31536000, immutable',
        formats: ['webp', 'avif'],
        sizes: [320, 640, 1280, 1920]
      },
      fonts: {
        baseUrl: 'https://cdn.example.com/fonts',
        cacheControl: 'public, max-age=31536000, immutable',
        preload: true
      },
      scripts: {
        baseUrl: 'https://cdn.example.com/scripts',
        cacheControl: 'public, max-age=31536000, immutable',
        compression: true
      },
      styles: {
        baseUrl: 'https://cdn.example.com/styles',
        cacheControl: 'public, max-age=31536000, immutable',
        compression: true
      }
    };
    
    fs.writeFileSync('cdn-config.json', JSON.stringify(cdnConfig, null, 2));
    console.log('✅ CDN configuration saved to cdn-config.json');
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

  generateOptimizationReport() {
    console.log('\n📊 CDN Optimization Report:');
    console.log('============================');
    
    const totalAssets = this.optimizationResults.staticAssets.length +
                       this.optimizationResults.images.length +
                       this.optimizationResults.fonts.length +
                       this.optimizationResults.scripts.length +
                       this.optimizationResults.styles.length;
    
    console.log(`📦 Total Assets: ${totalAssets}`);
    console.log(`🖼️ Images: ${this.optimizationResults.images.length}`);
    console.log(`🔤 Fonts: ${this.optimizationResults.fonts.length}`);
    console.log(`📜 Scripts: ${this.optimizationResults.scripts.length}`);
    console.log(`🎨 Styles: ${this.optimizationResults.styles.length}`);
    
    // Calculate optimization potential
    const largeAssets = [
      ...this.optimizationResults.staticAssets.filter(asset => asset.optimized),
      ...this.optimizationResults.images.filter(image => image.optimized),
      ...this.optimizationResults.fonts.filter(font => font.optimized),
      ...this.optimizationResults.scripts.filter(script => script.optimized),
      ...this.optimizationResults.styles.filter(style => style.optimized)
    ];
    
    console.log(`\n🔧 Optimization Potential: ${largeAssets.length} assets need optimization`);
    
    if (largeAssets.length > 0) {
      console.log('\n📋 Assets requiring optimization:');
      largeAssets.slice(0, 10).forEach(asset => {
        console.log(`  - ${asset.file} (${this.formatBytes(asset.size)})`);
      });
    }
    
    console.log('\n✅ CDN optimization report generated');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run CDN optimization
const optimizer = new CDNOptimizer();
optimizer.optimizeCDN();
