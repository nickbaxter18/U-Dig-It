#!/usr/bin/env node

/**
 * 🚀 API ENDPOINTS DEBUGGER
 * Comprehensive API endpoint testing and analysis
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 API ENDPOINTS DEBUGGER STARTING...\n');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testApiEndpoints() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  log('cyan', '🌐 API ENDPOINTS ANALYSIS');
  log('white', '='.repeat(50));

  // 1. Backend API Health Check
  log('cyan', '\n🏥 BACKEND API HEALTH CHECK');
  log('white', '-'.repeat(30));

  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.json();
      log('green', `✅ Backend API responding`);
      log('white', `   Status: ${response.status}`);
      log('white', `   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      log('red', `❌ Backend API not responding: ${response.status}`);
    }
  } catch (error) {
    log('red', `❌ Backend API connection failed: ${error.message}`);
  }

  // 2. Frontend API Check
  log('cyan', '\n🎨 FRONTEND API CHECK');
  log('white', '-'.repeat(30));

  try {
    const response = await fetch(`${frontendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      log('green', `✅ Frontend API responding`);
      log('white', `   Status: ${response.status}`);
    } else {
      log('red', `❌ Frontend API not responding: ${response.status}`);
    }
  } catch (error) {
    log('red', `❌ Frontend API connection failed: ${error.message}`);
  }

  // 3. Supabase API Check
  if (supabaseUrl && supabaseAnonKey) {
    log('cyan', '\n🚀 SUPABASE API CHECK');
    log('white', '-'.repeat(30));

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Test basic connection
      const { data, error } = await supabase
        .from('_supabase_migrations')
        .select('version')
        .limit(1);

      if (error) {
        log('yellow', `⚠️  Supabase connection test: ${error.message}`);
      } else {
        log('green', `✅ Supabase API responding`);
      }

      // Test auth
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      if (authError) {
        log('yellow', `⚠️  Supabase auth test: ${authError.message}`);
      } else {
        log('green', `✅ Supabase auth working`);
      }
    } catch (error) {
      log('red', `❌ Supabase API test failed: ${error.message}`);
    }
  }

  // 4. Test Common API Endpoints
  log('cyan', '\n🔗 COMMON ENDPOINTS TEST');
  log('white', '-'.repeat(30));

  const endpoints = [
    { path: '/api/equipment', method: 'GET', description: 'Equipment listing' },
    { path: '/api/bookings', method: 'GET', description: 'Bookings listing' },
    { path: '/api/users/profile', method: 'GET', description: 'User profile' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${backendUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.ok) {
        log(
          'green',
          `✅ ${endpoint.method} ${endpoint.path} - ${endpoint.description}`
        );
      } else if (response.status === 401) {
        log(
          'yellow',
          `⚠️  ${endpoint.method} ${endpoint.path} - Unauthorized (expected)`
        );
      } else if (response.status === 404) {
        log('yellow', `⚠️  ${endpoint.method} ${endpoint.path} - Not found`);
      } else {
        log(
          'red',
          `❌ ${endpoint.method} ${endpoint.path} - ${response.status}`
        );
      }
    } catch (error) {
      log('red', `❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
    }
  }

  // 5. Performance Metrics
  log('cyan', '\n⚡ PERFORMANCE METRICS');
  log('white', '-'.repeat(30));

  const performanceTests = [
    { name: 'Backend Health Check', url: `${backendUrl}/health` },
    { name: 'Frontend Health Check', url: `${frontendUrl}/` },
  ];

  for (const test of performanceTests) {
    const startTime = Date.now();
    try {
      await fetch(test.url, { timeout: 5000 });
      const duration = Date.now() - startTime;
      log('green', `✅ ${test.name}: ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      log('red', `❌ ${test.name}: ${error.message} (${duration}ms)`);
    }
  }

  // 6. Summary
  log('cyan', '\n🎯 API DEBUG SUMMARY');
  log('white', '='.repeat(50));
  log('green', `✅ API debugging complete!`);
  log('white', `🚀 Backend URL: ${backendUrl}`);
  log('white', `🚀 Frontend URL: ${frontendUrl}`);

  if (supabaseUrl) {
    log('white', `🚀 Supabase URL: ${supabaseUrl}`);
  }

  log('white', `🚀 API endpoint analysis finished`);
}

// Run the API debug
testApiEndpoints().catch(error => {
  log('red', `❌ API debugging failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
