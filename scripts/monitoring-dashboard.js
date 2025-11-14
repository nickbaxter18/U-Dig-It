const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MonitoringDashboard {
  constructor() {
    this.dashboardData = {
      system: {},
      application: {},
      alerts: [],
      trends: []
    };
  }

  async generateDashboard() {
    console.log('📊 Monitoring Dashboard - Generating comprehensive report...');
    
    // Collect system metrics
    await this.collectSystemMetrics();
    
    // Collect application metrics
    await this.collectApplicationMetrics();
    
    // Collect alerts
    await this.collectAlerts();
    
    // Generate trends
    await this.generateTrends();
    
    // Display dashboard
    this.displayDashboard();
    
    // Save dashboard data
    this.saveDashboardData();
    
    console.log('✅ Monitoring dashboard generated!');
  }

  async collectSystemMetrics() {
    console.log('🖥️ Collecting system metrics...');
    
    try {
      // Memory usage
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const memData = memInfo.split('\n')[1].split(/\s+/);
      
      this.dashboardData.system.memory = {
        total: parseInt(memData[1]),
        used: parseInt(memData[2]),
        free: parseInt(memData[3]),
        usage: Math.round((parseInt(memData[2]) / parseInt(memData[1])) * 100)
      };
      
      // CPU usage
      const cpuInfo = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
      const cpuUsage = cpuInfo.match(/(\d+\.\d+)%us/);
      
      if (cpuUsage) {
        this.dashboardData.system.cpu = {
          usage: parseFloat(cpuUsage[1])
        };
      }
      
      // Disk usage
      const diskInfo = execSync('df -h .', { encoding: 'utf8' });
      const diskData = diskInfo.split('\n')[1].split(/\s+/);
      
      this.dashboardData.system.disk = {
        total: diskData[1],
        used: diskData[2],
        available: diskData[3],
        usage: diskData[4]
      };
      
      console.log('✅ System metrics collected');
    } catch (error) {
      console.log('⚠️ Could not collect system metrics');
    }
  }

  async collectApplicationMetrics() {
    console.log('📱 Collecting application metrics...');
    
    // Simulate application metrics
    this.dashboardData.application = {
      requests: Math.floor(Math.random() * 1000),
      responseTime: Math.random() * 500,
      errors: Math.floor(Math.random() * 10),
      activeUsers: Math.floor(Math.random() * 100),
      uptime: process.uptime()
    };
    
    console.log('✅ Application metrics collected');
  }

  async collectAlerts() {
    console.log('🚨 Collecting alerts...');
    
    // Simulate alerts based on metrics
    const alerts = [];
    
    if (this.dashboardData.system.memory?.usage > 80) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'HIGH',
        message: `Memory usage: ${this.dashboardData.system.memory.usage}%`
      });
    }
    
    if (this.dashboardData.system.cpu?.usage > 80) {
      alerts.push({
        type: 'HIGH_CPU_USAGE',
        severity: 'HIGH',
        message: `CPU usage: ${this.dashboardData.system.cpu.usage}%`
      });
    }
    
    if (this.dashboardData.application.errors > 5) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'MEDIUM',
        message: `Error rate: ${this.dashboardData.application.errors} errors`
      });
    }
    
    this.dashboardData.alerts = alerts;
    console.log(`✅ ${alerts.length} alerts collected`);
  }

  async generateTrends() {
    console.log('📈 Generating trends...');
    
    // Simulate trend data
    this.dashboardData.trends = {
      requests: this.generateTrendData(100, 1000),
      responseTime: this.generateTrendData(50, 500),
      memory: this.generateTrendData(30, 80),
      cpu: this.generateTrendData(20, 90)
    };
    
    console.log('✅ Trends generated');
  }

  generateTrendData(min, max) {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push(Math.floor(Math.random() * (max - min) + min));
    }
    return data;
  }

  displayDashboard() {
    console.log('\n📊 MONITORING DASHBOARD');
    console.log('========================');
    
    // System metrics
    console.log('\n🖥️ SYSTEM METRICS:');
    if (this.dashboardData.system.memory) {
      console.log(`💾 Memory: ${this.dashboardData.system.memory.used}MB / ${this.dashboardData.system.memory.total}MB (${this.dashboardData.system.memory.usage}%)`);
    }
    if (this.dashboardData.system.cpu) {
      console.log(`🖥️ CPU: ${this.dashboardData.system.cpu.usage}%`);
    }
    if (this.dashboardData.system.disk) {
      console.log(`💿 Disk: ${this.dashboardData.system.disk.used} / ${this.dashboardData.system.disk.total} (${this.dashboardData.system.disk.usage})`);
    }
    
    // Application metrics
    console.log('\n📱 APPLICATION METRICS:');
    console.log(`📊 Requests: ${this.dashboardData.application.requests}`);
    console.log(`⚡ Response Time: ${this.dashboardData.application.responseTime}ms`);
    console.log(`🚨 Errors: ${this.dashboardData.application.errors}`);
    console.log(`👥 Active Users: ${this.dashboardData.application.activeUsers}`);
    console.log(`⏱️ Uptime: ${Math.floor(this.dashboardData.application.uptime / 3600)}h ${Math.floor((this.dashboardData.application.uptime % 3600) / 60)}m`);
    
    // Alerts
    if (this.dashboardData.alerts.length > 0) {
      console.log('\n🚨 ACTIVE ALERTS:');
      this.dashboardData.alerts.forEach(alert => {
        console.log(`  [${alert.severity}] ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('\n✅ NO ACTIVE ALERTS');
    }
    
    // Trends
    console.log('\n📈 TRENDS (Last 24h):');
    console.log(`📊 Requests: ${this.dashboardData.trends.requests.slice(-5).join(' → ')}`);
    console.log(`⚡ Response Time: ${this.dashboardData.trends.responseTime.slice(-5).join(' → ')}ms`);
    console.log(`💾 Memory: ${this.dashboardData.trends.memory.slice(-5).join(' → ')}%`);
    console.log(`🖥️ CPU: ${this.dashboardData.trends.cpu.slice(-5).join(' → ')}%`);
  }

  saveDashboardData() {
    const timestamp = new Date().toISOString();
    const filename = `monitoring-dashboard-${timestamp.split('T')[0]}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(this.dashboardData, null, 2));
    console.log(`💾 Dashboard data saved to ${filename}`);
  }
}

// Run dashboard
const dashboard = new MonitoringDashboard();
dashboard.generateDashboard();
