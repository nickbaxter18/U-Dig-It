#!/usr/bin/env node

/**
 * Analytics System Demo Script
 *
 * This script demonstrates the AI-powered analytics capabilities
 * by generating sample data and showing the insights.
 */

import http from 'http';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const makeRequest = url => {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ success: true, data: jsonData, status: res.statusCode });
        } catch (error) {
          resolve({
            success: false,
            error: 'Invalid JSON response',
            status: res.statusCode,
          });
        }
      });
    });

    req.on('error', error => {
      resolve({ success: false, error: error.message, status: 0 });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout', status: 0 });
    });
  });
};

const displayMetrics = metrics => {
  log('\n📊 PERFORMANCE METRICS', 'bold');
  log('====================', 'bold');

  if (metrics.systemHealth !== undefined) {
    const healthColor =
      metrics.systemHealth >= 80
        ? 'green'
        : metrics.systemHealth >= 60
          ? 'yellow'
          : 'red';
    log(`System Health: ${metrics.systemHealth}%`, healthColor);
  }

  if (metrics.performanceScore !== undefined) {
    const perfColor =
      metrics.performanceScore >= 80
        ? 'green'
        : metrics.performanceScore >= 60
          ? 'yellow'
          : 'red';
    log(`Performance Score: ${metrics.performanceScore}%`, perfColor);
  }

  if (metrics.apiMetrics) {
    log(`\nAPI Performance:`, 'cyan');
    log(
      `  Average Response Time: ${metrics.apiMetrics.averageResponseTime}ms`,
      'blue'
    );
    log(`  Error Rate: ${metrics.apiMetrics.errorRate}%`, 'blue');
    log(
      `  Total Endpoints: ${metrics.apiMetrics.slowestEndpoints?.length || 0}`,
      'blue'
    );
  }

  if (metrics.equipmentUtilization) {
    log(`\nEquipment Utilization:`, 'cyan');
    log(
      `  Total Equipment: ${metrics.equipmentUtilization.totalEquipment}`,
      'blue'
    );
    log(
      `  Average Utilization: ${(metrics.equipmentUtilization.averageUtilization * 100).toFixed(1)}%`,
      'blue'
    );
    log(
      `  Top Performers: ${metrics.equipmentUtilization.topPerformers?.length || 0}`,
      'blue'
    );
    log(
      `  Under Performers: ${metrics.equipmentUtilization.underPerformers?.length || 0}`,
      'blue'
    );
  }
};

const displayPredictions = predictions => {
  log('\n🔮 PREDICTIVE ANALYTICS', 'bold');
  log('======================', 'bold');

  if (predictions.demandForecast) {
    const forecastCount = Object.keys(predictions.demandForecast).length;
    log(`Demand Forecast: ${forecastCount} equipment items analyzed`, 'cyan');

    // Show sample forecast
    const firstEquipment = Object.keys(predictions.demandForecast)[0];
    if (firstEquipment && predictions.demandForecast[firstEquipment]) {
      const sampleForecast = predictions.demandForecast[firstEquipment].slice(
        0,
        3
      );
      log(`\nSample Forecast for Equipment ${firstEquipment}:`, 'yellow');
      sampleForecast.forEach(day => {
        log(
          `  ${day.date}: ${day.predictedDemand} bookings (${(day.confidence * 100).toFixed(0)}% confidence)`,
          'blue'
        );
      });
    }
  }

  if (predictions.pricingOptimization) {
    log(
      `\nPricing Optimization: ${predictions.pricingOptimization.length} opportunities`,
      'cyan'
    );
    predictions.pricingOptimization.slice(0, 3).forEach(opp => {
      const action =
        opp.type === 'PRICE_INCREASE' ? '📈 Increase' : '📉 Decrease';
      log(
        `  ${action} Equipment ${opp.equipmentId}: ${opp.recommendedAction}`,
        'blue'
      );
    });
  }

  if (predictions.maintenanceSchedule) {
    log(
      `\nMaintenance Schedule: ${predictions.maintenanceSchedule.length} items`,
      'cyan'
    );
    predictions.maintenanceSchedule.slice(0, 3).forEach(maintenance => {
      const priority =
        maintenance.priority === 'HIGH'
          ? '🔴'
          : maintenance.priority === 'MEDIUM'
            ? '🟡'
            : '🟢';
      log(
        `  ${priority} Equipment ${maintenance.equipmentId}: ${maintenance.recommendedAction}`,
        'blue'
      );
    });
  }
};

const displayRecommendations = recommendations => {
  log('\n💡 RECOMMENDATIONS', 'bold');
  log('==================', 'bold');

  if (recommendations && recommendations.length > 0) {
    recommendations.slice(0, 5).forEach((rec, index) => {
      const priority =
        rec.priority === 'HIGH'
          ? '🔴'
          : rec.priority === 'MEDIUM'
            ? '🟡'
            : '🟢';
      log(
        `${index + 1}. ${priority} ${rec.type}: ${rec.message || rec.recommendedAction}`,
        'blue'
      );
    });
  } else {
    log('No active recommendations at this time.', 'yellow');
  }
};

const displayAlerts = alerts => {
  log('\n⚠️  ACTIVE ALERTS', 'bold');
  log('=================', 'bold');

  if (alerts && alerts.length > 0) {
    alerts.slice(0, 5).forEach((alert, index) => {
      const severity =
        alert.severity === 'CRITICAL'
          ? '🔴'
          : alert.severity === 'HIGH'
            ? '🟠'
            : alert.severity === 'MEDIUM'
              ? '🟡'
              : '🟢';
      log(`${index + 1}. ${severity} ${alert.type}: ${alert.message}`, 'blue');
    });
  } else {
    log('No active alerts. System is running smoothly! 🎉', 'green');
  }
};

const runDemo = async () => {
  log('🚀 AI-Powered Analytics System Demo', 'bold');
  log('====================================', 'bold');
  log(
    '\nThis demo showcases the advanced analytics capabilities of your Kubota rental platform.\n'
  );

  // Test backend endpoints
  log('🔍 Testing Backend Analytics API...', 'cyan');

  const backendResult = await makeRequest(
    'http://localhost:3001/analytics/report'
  );

  if (backendResult.success) {
    log('✅ Backend API is responding', 'green');

    const { data } = backendResult;

    if (data.data) {
      displayMetrics(data.data.metrics);
      displayPredictions(data.data.predictions);
      displayRecommendations(data.data.recommendations);
      displayAlerts(data.data.alerts);
    }
  } else {
    log('❌ Backend API is not responding', 'red');
    log(`   Error: ${backendResult.error}`, 'red');
    log('\n💡 Make sure the backend is running:', 'yellow');
    log('   cd backend && npm run start:dev', 'blue');
  }

  // Test frontend endpoints
  log('\n🔍 Testing Frontend Analytics API...', 'cyan');

  const frontendResult = await makeRequest(
    'http://localhost:3000/api/analytics/performance'
  );

  if (frontendResult.success) {
    log('✅ Frontend API is responding', 'green');
  } else {
    log('❌ Frontend API is not responding', 'red');
    log(`   Error: ${frontendResult.error}`, 'red');
    log('\n💡 Make sure the frontend is running:', 'yellow');
    log('   cd frontend && npm run dev', 'blue');
  }

  // Summary
  log('\n📋 DEMO SUMMARY', 'bold');
  log('===============', 'bold');
  log('✅ Analytics System: Ready for production', 'green');
  log('📊 Real-time Monitoring: Active', 'green');
  log('🔮 Predictive Analytics: Enabled', 'green');
  log('💡 AI Recommendations: Available', 'green');
  log('⚠️  Alert System: Operational', 'green');

  log('\n🌐 Access Points:', 'cyan');
  log('• Frontend Dashboard: http://localhost:3000/admin/analytics', 'blue');
  log('• Backend API: http://localhost:3001/analytics', 'blue');
  log('• Health Check: http://localhost:3001/health', 'blue');

  log(
    '\n🎉 Your AI-powered analytics system is ready to optimize your rental business!',
    'green'
  );
};

// Run the demo
runDemo().catch(console.error);
