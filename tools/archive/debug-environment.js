#!/usr/bin/env node

/**
 * 🚀 ENVIRONMENT DEBUGGER
 * Comprehensive environment variable analysis and debugging
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from multiple locations
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 ENVIRONMENT DEBUGGER STARTING...\n');

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

// Environment Analysis
log('cyan', '🔐 ENVIRONMENT VARIABLES ANALYSIS');
log('white', '='.repeat(50));

const requiredEnvVars = {
  // Database
  DATABASE_URL: 'Database connection string',
  SUPABASE_URL: 'Supabase project URL',
  SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',

  // Authentication
  JWT_SECRET: 'JWT signing secret',
  JWT_REFRESH_SECRET: 'JWT refresh token secret',

  // External Services
  STRIPE_SECRET_KEY: 'Stripe secret key',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  DOCUSIGN_CLIENT_ID: 'DocuSign client ID',
  DOCUSIGN_CLIENT_SECRET: 'DocuSign client secret',
  DOCUSIGN_ACCOUNT_ID: 'DocuSign account ID',

  // Email
  SENDGRID_API_KEY: 'SendGrid API key',
  EMAIL_FROM: 'From email address',

  // Monitoring
  SENTRY_DSN: 'Sentry DSN for error tracking',

  // Development
  NODE_ENV: 'Node environment',
  PORT: 'Application port',
  FRONTEND_URL: 'Frontend URL',
};

let missingVars = [];
let presentVars = [];

Object.entries(requiredEnvVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (value) {
    presentVars.push({
      key,
      description,
      value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
    });
  } else {
    missingVars.push({ key, description });
  }
});

// Display present variables
log('green', `\n✅ FOUND VARIABLES (${presentVars.length})`);
log('white', '-'.repeat(30));
presentVars.forEach(({ key, description, value }) => {
  log('white', `   ${key}: ${value}`);
  log('blue', `       ${description}`);
});

// Display missing variables
if (missingVars.length > 0) {
  log('red', `\n❌ MISSING VARIABLES (${missingVars.length})`);
  log('white', '-'.repeat(30));
  missingVars.forEach(({ key, description }) => {
    log('red', `   ${key}: MISSING`);
    log('yellow', `       ${description}`);
  });
}

// Environment file analysis
log('cyan', '\n📁 ENVIRONMENT FILES ANALYSIS');
log('white', '-'.repeat(30));

const envFiles = [
  { path: '../backend/.env', name: 'Backend .env' },
  { path: '../frontend/.env.local', name: 'Frontend .env.local' },
  { path: '../.env', name: 'Root .env' },
];

envFiles.forEach(({ path: filePath, name }) => {
  const fullPath = path.resolve(__dirname, filePath);
  try {
    require('fs').accessSync(fullPath);
    log('green', `✅ ${name}: Found`);
  } catch {
    log('red', `❌ ${name}: Not found`);
  }
});

// Node.js version and system info
log('cyan', '\n🖥️  SYSTEM INFORMATION');
log('white', '-'.repeat(30));
log('white', `   Node.js Version: ${process.version}`);
log('white', `   Platform: ${process.platform}`);
log('white', `   Architecture: ${process.arch}`);
log(
  'white',
  `   Memory: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
);
log('white', `   CPU Cores: ${require('os').cpus().length}`);

// Summary
log('cyan', '\n🎯 ENVIRONMENT DEBUG SUMMARY');
log('white', '='.repeat(50));
log('green', `✅ Found: ${presentVars.length} environment variables`);
log('red', `❌ Missing: ${missingVars.length} environment variables`);
log('white', `🚀 Environment analysis complete!`);

if (missingVars.length > 0) {
  log('yellow', '\n💡 TIPS:');
  log('yellow', '   • Check that all required .env files exist');
  log('yellow', '   • Verify environment variable names match exactly');
  log('yellow', '   • Ensure sensitive values are not exposed in logs');
  process.exit(1);
}
