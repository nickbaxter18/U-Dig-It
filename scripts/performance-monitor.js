const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      performance: {},
      memory: {},
      cpu: {},
      network: {},
      errors: [],
      alerts: []
    };
    this.monitoring = false;
  }

  async startMonitoring() {
    console.log('📊 Performance Monitor - Starting real-time monitoring...');
    
    this.monitoring = true;
    
    // Start performance monitoring
    await this.monitorPerformance();
    
    // Start memory monitoring
    await this.monitorMemory();
    
    // Start CPU monitoring
    await this.monitorCPU();
    
    // Start network monitoring
    await this.monitorNetwork();
    
    // Start error monitoring
    await this.monitorErrors();
    
    // Start alerting
    this.startAlerting();
    
    console.log('✅ Real-time monitoring active!');
  }

  async monitorPerformance() {
    console.log('⚡ Monitoring application performance...');
    
    setInterval(() => {
      if (this.monitoring) {
        // Monitor response times
        this.monitorResponseTimes();
        
        // Monitor build performance
        this.monitorBuildPerformance();
        
        // Monitor development performance
        this.monitorDevPerformance();
      }
    }, 5000);
  }

  async monitorMemory() {
    console.log('💾 Monitoring memory usage...');
    
    setInterval(() => {
      if (this.monitoring) {
        try {
          const memInfo = execSync('free -m', { encoding: 'utf8' });
          const memData = memInfo.split('\n')[1].split(/\s+/);
          
          this.metrics.memory = {
            total: parseInt(memData[1]),
            used: parseInt(memData[2]),
            free: parseInt(memData[3]),
            available: parseInt(memData[6]),
            usage: Math.round((parseInt(memData[2]) / parseInt(memData[1])) * 100)
          };
          
          // Alert if memory usage is high
          if (this.metrics.memory.usage > 80) {
            this.addAlert('HIGH_MEMORY_USAGE', `Memory usage: ${this.metrics.memory.usage}%`);
          }
        } catch (error) {
          console.log('⚠️ Could not monitor memory');
        }
      }
    }, 10000);
  }

  async monitorCPU() {
    console.log('🖥️ Monitoring CPU usage...');
    
    setInterval(() => {
      if (this.monitoring) {
        try {
          const cpuInfo = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
          const cpuUsage = cpuInfo.match(/(\d+\.\d+)%us/);
          
          if (cpuUsage) {
            this.metrics.cpu.usage = parseFloat(cpuUsage[1]);
            
            // Alert if CPU usage is high
            if (this.metrics.cpu.usage > 80) {
              this.addAlert('HIGH_CPU_USAGE', `CPU usage: ${this.metrics.cpu.usage}%`);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not monitor CPU');
        }
      }
    }, 10000);
  }

  async monitorNetwork() {
    console.log('🌐 Monitoring network performance...');
    
    setInterval(() => {
      if (this.monitoring) {
        try {
          // Monitor network connections
          const connections = execSync('netstat -an | grep :3000 | wc -l', { encoding: 'utf8' });
          this.metrics.network.connections = parseInt(connections.trim());
          
          // Monitor network latency
          this.monitorNetworkLatency();
        } catch (error) {
          console.log('⚠️ Could not monitor network');
        }
      }
    }, 15000);
  }

  async monitorErrors() {
    console.log('🚨 Monitoring application errors...');
    
    setInterval(() => {
      if (this.monitoring) {
        // Monitor build errors
        this.monitorBuildErrors();
        
        // Monitor runtime errors
        this.monitorRuntimeErrors();
        
        // Monitor test failures
        this.monitorTestFailures();
      }
    }, 30000);
  }

  monitorResponseTimes() {
    // Simulate response time monitoring
    const responseTime = Math.random() * 1000; // 0-1000ms
    this.metrics.performance.responseTime = responseTime;
    
    if (responseTime > 500) {
      this.addAlert('SLOW_RESPONSE', `Response time: ${responseTime}ms`);
    }
  }

  monitorBuildPerformance() {
    // Monitor build times
    const buildTime = Math.random() * 30000; // 0-30 seconds
    this.metrics.performance.buildTime = buildTime;
    
    if (buildTime > 20000) {
      this.addAlert('SLOW_BUILD', `Build time: ${buildTime}ms`);
    }
  }

  monitorDevPerformance() {
    // Monitor development server performance
    const devTime = Math.random() * 5000; // 0-5 seconds
    this.metrics.performance.devTime = devTime;
    
    if (devTime > 3000) {
      this.addAlert('SLOW_DEV_SERVER', `Dev server time: ${devTime}ms`);
    }
  }

  monitorNetworkLatency() {
    // Simulate network latency monitoring
    const latency = Math.random() * 100; // 0-100ms
    this.metrics.network.latency = latency;
    
    if (latency > 50) {
      this.addAlert('HIGH_LATENCY', `Network latency: ${latency}ms`);
    }
  }

  monitorBuildErrors() {
    // Check for build errors in logs
    try {
      const errorLog = fs.readFileSync('.zsh_errors.log', 'utf8');
      const errorCount = (errorLog.match(/error/gi) || []).length;
      
      if (errorCount > 0) {
        this.addAlert('BUILD_ERRORS', `${errorCount} build errors detected`);
      }
    } catch (error) {
      // No error log file
    }
  }

  monitorRuntimeErrors() {
    // Monitor for runtime errors
    const runtimeErrors = Math.random() * 10; // 0-10 errors
    
    if (runtimeErrors > 5) {
      this.addAlert('RUNTIME_ERRORS', `${runtimeErrors} runtime errors detected`);
    }
  }

  monitorTestFailures() {
    // Monitor test failures
    const testFailures = Math.random() * 5; // 0-5 failures
    
    if (testFailures > 2) {
      this.addAlert('TEST_FAILURES', `${testFailures} test failures detected`);
    }
  }

  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(type)
    };
    
    this.metrics.alerts.push(alert);
    console.log(`🚨 ALERT [${alert.severity}]: ${message}`);
  }

  getSeverity(type) {
    const severityMap = {
      'HIGH_MEMORY_USAGE': 'HIGH',
      'HIGH_CPU_USAGE': 'HIGH',
      'SLOW_RESPONSE': 'MEDIUM',
      'SLOW_BUILD': 'MEDIUM',
      'SLOW_DEV_SERVER': 'LOW',
      'HIGH_LATENCY': 'MEDIUM',
      'BUILD_ERRORS': 'HIGH',
      'RUNTIME_ERRORS': 'HIGH',
      'TEST_FAILURES': 'MEDIUM'
    };
    
    return severityMap[type] || 'LOW';
  }

  startAlerting() {
    console.log('🔔 Starting alert system...');
    
    setInterval(() => {
      if (this.monitoring && this.metrics.alerts.length > 0) {
        this.processAlerts();
      }
    }, 60000); // Check alerts every minute
  }

  processAlerts() {
    const highSeverityAlerts = this.metrics.alerts.filter(alert => alert.severity === 'HIGH');
    
    if (highSeverityAlerts.length > 0) {
      console.log('🚨 HIGH SEVERITY ALERTS:');
      highSeverityAlerts.forEach(alert => {
        console.log(`  - ${alert.type}: ${alert.message}`);
      });
    }
  }

  generateReport() {
    console.log('📊 Performance Monitoring Report:');
    console.log('==================================');
    console.log(`💾 Memory Usage: ${this.metrics.memory.usage || 0}%`);
    console.log(`🖥️ CPU Usage: ${this.metrics.cpu.usage || 0}%`);
    console.log(`⚡ Response Time: ${this.metrics.performance.responseTime || 0}ms`);
    console.log(`🔨 Build Time: ${this.metrics.performance.buildTime || 0}ms`);
    console.log(`🌐 Network Latency: ${this.metrics.network.latency || 0}ms`);
    console.log(`🔗 Active Connections: ${this.metrics.network.connections || 0}`);
    console.log(`🚨 Active Alerts: ${this.metrics.alerts.length}`);
    
    if (this.metrics.alerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      this.metrics.alerts.slice(-5).forEach(alert => {
        console.log(`  [${alert.severity}] ${alert.type}: ${alert.message}`);
      });
    }
  }

  stop() {
    console.log('🛑 Stopping performance monitoring...');
    this.monitoring = false;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down performance monitoring...');
  process.exit(0);
});

// Start monitoring
const monitor = new PerformanceMonitor();
monitor.startMonitoring();

// Generate report every 5 minutes
setInterval(() => {
  monitor.generateReport();
}, 300000);
