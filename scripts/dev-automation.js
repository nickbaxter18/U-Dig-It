const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevAutomation {
  constructor() {
    this.processes = [];
  }

  async start() {
    console.log('🚀 Development Automation - Starting...');
    
    // Check if already running
    if (this.isAlreadyRunning()) {
      console.log('⚠️ Development environment already running');
      return;
    }

    // Start services
    await this.startServices();
    
    // Setup monitoring
    this.setupMonitoring();
    
    console.log('✅ Development environment started successfully!');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend: http://localhost:3001');
  }

  isAlreadyRunning() {
    try {
      execSync('lsof -ti:3000,3001', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async startServices() {
    console.log('🔧 Starting services...');
    
    // Start frontend
    const frontend = spawn('pnpm', ['--filter', 'frontend', 'run', 'dev'], {
      stdio: 'pipe',
      detached: true
    });
    this.processes.push(frontend);

    // Start backend
    const backend = spawn('pnpm', ['--filter', 'backend', 'run', 'start:dev'], {
      stdio: 'pipe',
      detached: true
    });
    this.processes.push(backend);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  setupMonitoring() {
    console.log('📊 Setting up monitoring...');
    // Add monitoring setup here
  }

  stop() {
    console.log('🛑 Stopping development environment...');
    this.processes.forEach(process => {
      if (process && !process.killed) {
        process.kill();
      }
    });
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  process.exit(0);
});

// Start automation
const automation = new DevAutomation();
automation.start();
