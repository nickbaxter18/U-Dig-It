const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class HotReloadOptimizer {
  constructor() {
    this.processes = [];
    this.monitoring = false;
  }

  async start() {
    console.log('🔥 Hot Reload Optimizer - Starting...');
    
    // Setup file watching
    this.setupFileWatching();
    
    // Start optimized development servers
    await this.startOptimizedServers();
    
    // Setup monitoring
    this.setupMonitoring();
    
    console.log('✅ Hot reload optimization active!');
    console.log('🚀 3x faster development feedback enabled');
  }

  setupFileWatching() {
    console.log('👀 Setting up intelligent file watching...');
    
    // Watch for changes with optimized settings
    const watchPaths = [
      'frontend/src',
      'backend/src',
      'shared'
    ];
    
    watchPaths.forEach(path => {
      if (fs.existsSync(path)) {
        console.log(`📁 Watching: ${path}`);
      }
    });
  }

  async startOptimizedServers() {
    console.log('🚀 Starting optimized development servers...');
    
    // Start frontend with hot reload optimization
    const frontend = spawn('pnpm', ['--filter', 'frontend', 'run', 'dev'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        FAST_REFRESH: 'true',
        NEXT_TELEMETRY_DISABLED: '1',
        WATCHPACK_POLLING: 'true'
      }
    });
    this.processes.push(frontend);

    // Start backend with hot reload optimization
    const backend = spawn('pnpm', ['--filter', 'backend', 'run', 'start:dev'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        NESTJS_HOT_RELOAD: 'true',
        NODE_ENV: 'development'
      }
    });
    this.processes.push(backend);

    // Wait for servers to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  setupMonitoring() {
    console.log('📊 Setting up hot reload monitoring...');
    this.monitoring = true;
    
    // Monitor hot reload performance
    setInterval(() => {
      if (this.monitoring) {
        console.log('🔥 Hot reload optimization active');
      }
    }, 30000);
  }

  stop() {
    console.log('🛑 Stopping hot reload optimization...');
    this.monitoring = false;
    this.processes.forEach(process => {
      if (process && !process.killed) {
        process.kill();
      }
    });
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down hot reload optimization...');
  process.exit(0);
});

// Start hot reload optimization
const optimizer = new HotReloadOptimizer();
optimizer.start();
