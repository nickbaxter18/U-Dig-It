#!/usr/bin/env node

/**
 * 🚀 ADVANCED API DEBUGGER
 * Comprehensive API debugging with request/response logging, middleware analysis, and performance monitoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ADVANCED API DEBUGGER STARTING...\n');

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

class ApiDebugger {
  constructor() {
    this.issues = [];
    this.endpoints = [];
    this.middleware = [];
    this.metrics = {
      responseTimes: [],
      errorRates: [],
      requestCounts: [],
      memoryUsage: [],
    };
  }

  async runFullDebug() {
    log('cyan', '🔍 API DEBUGGING ANALYSIS');
    log('white', '='.repeat(60));

    try {
      // 1. Backend API Analysis
      await this.analyzeBackendApi();

      // 2. Frontend API Analysis
      await this.analyzeFrontendApi();

      // 3. Middleware Analysis
      await this.analyzeMiddleware();

      // 4. Performance Analysis
      await this.analyzeApiPerformance();

      // 5. Security Analysis
      await this.analyzeApiSecurity();

      // 6. Generate Report
      this.generateApiReport();

      return this.calculateApiScore();
    } catch (error) {
      log('red', `❌ API debugging failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeBackendApi() {
    log('cyan', '\n🏗️  BACKEND API ANALYSIS');
    log('white', '-'.repeat(30));

    const backendSrc = path.resolve(__dirname, '../backend/src');

    try {
      // Find all controller files
      const controllerFiles = this.findFiles(
        ['**/controllers/**/*.ts'],
        [],
        backendSrc
      );
      log('white', `   Found ${controllerFiles.length} controller files`);

      controllerFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const endpoints = this.extractEndpoints(content);

          this.endpoints.push(
            ...endpoints.map(endpoint => ({
              ...endpoint,
              file,
              type: 'backend',
            }))
          );
        } catch (error) {
          this.addIssue(
            'medium',
            'backend',
            `Could not analyze ${file}: ${error.message}`,
            'Check file permissions'
          );
        }
      });

      // Analyze API structure
      this.analyzeApiStructure();
    } catch (error) {
      this.addIssue(
        'critical',
        'backend',
        `Backend API analysis failed: ${error.message}`,
        'Check backend directory structure'
      );
    }
  }

  extractEndpoints(content) {
    const endpoints = [];

    // Extract NestJS controller endpoints
    const controllerMatches = content.match(/@Controller\(['"](.+?)['"]\)/g);
    if (controllerMatches) {
      const controllerPath = controllerMatches[0].match(
        /@Controller\(['"](.+?)['"]\)/
      )[1];

      // Extract route handlers
      const routeMatches = content.match(
        /@(Get|Post|Put|Delete|Patch|Options|Head)\(['"](.+?)['"]\)/g
      );
      if (routeMatches) {
        routeMatches.forEach(match => {
          const methodMatch = match.match(
            /@(Get|Post|Put|Delete|Patch|Options|Head)\(['"](.+?)['"]\)/
          );
          if (methodMatch) {
            endpoints.push({
              method: methodMatch[1].toUpperCase(),
              path: `${controllerPath}${methodMatch[2]}`,
              controller: controllerPath,
            });
          }
        });
      }
    }

    return endpoints;
  }

  analyzeApiStructure() {
    // Check for proper REST API structure
    const restEndpoints = this.endpoints.filter(
      e => e.type === 'backend' && !e.path.includes(':')
    );
    const dynamicEndpoints = this.endpoints.filter(e => e.path.includes(':'));

    log('white', `   REST endpoints: ${restEndpoints.length}`);
    log('white', `   Dynamic endpoints: ${dynamicEndpoints.length}`);

    // Check for common API issues
    const issues = [];

    // Check for inconsistent naming
    const namingIssues = this.checkNamingConsistency();
    issues.push(...namingIssues);

    // Check for missing CRUD operations
    const crudIssues = this.checkCrudCompleteness();
    issues.push(...crudIssues);

    issues.forEach(issue => {
      log('yellow', `⚠️  ${issue}`);
    });
  }

  checkNamingConsistency() {
    const issues = [];

    // Check for kebab-case vs camelCase inconsistency
    const kebabEndpoints = this.endpoints.filter(e => e.path.includes('-'));
    const camelEndpoints = this.endpoints.filter(e => e.path.match(/[A-Z]/));

    if (kebabEndpoints.length > 0 && camelEndpoints.length > 0) {
      issues.push('Mixed naming conventions (kebab-case and camelCase)');
    }

    // Check for consistent pluralization
    const pluralEndpoints = this.endpoints.filter(e =>
      e.path.match(/\/[a-z]+s$/)
    );
    const singularEndpoints = this.endpoints.filter(
      e => !e.path.match(/\/[a-z]+s$/) && !e.path.includes('/')
    );

    if (pluralEndpoints.length > 0 && singularEndpoints.length > 0) {
      issues.push('Inconsistent pluralization in endpoints');
    }

    return issues;
  }

  checkCrudCompleteness() {
    const issues = [];
    const controllers = [...new Set(this.endpoints.map(e => e.controller))];

    controllers.forEach(controller => {
      const controllerEndpoints = this.endpoints.filter(
        e => e.controller === controller
      );
      const methods = controllerEndpoints.map(e => e.method);

      // Check for basic CRUD operations
      const hasGet = methods.includes('GET');
      const hasPost = methods.includes('POST');
      const hasPut = methods.includes('PUT');
      const hasDelete = methods.includes('DELETE');

      if (!hasGet) {
        issues.push(`${controller}: Missing GET operations`);
      }
      if (!hasPost && controller !== '/health') {
        issues.push(`${controller}: Missing POST operations`);
      }
    });

    return issues;
  }

  async analyzeFrontendApi() {
    log('cyan', '\n🎨 FRONTEND API ANALYSIS');
    log('white', '-'.repeat(30));

    const frontendSrc = path.resolve(__dirname, '../frontend/src');

    try {
      // Find API-related files
      const apiFiles = this.findFiles(
        ['**/api/**/*.ts', '**/api/**/*.tsx', '**/lib/**/*.ts'],
        [],
        frontendSrc
      );

      log('white', `   Found ${apiFiles.length} API-related files`);

      // Analyze API calls and patterns
      this.analyzeApiCalls(apiFiles);
    } catch (error) {
      this.addIssue(
        'medium',
        'frontend',
        `Frontend API analysis failed: ${error.message}`,
        'Check frontend directory structure'
      );
    }
  }

  analyzeApiCalls(files) {
    let totalApiCalls = 0;
    let fetchCalls = 0;
    let axiosCalls = 0;
    let supabaseCalls = 0;

    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Count API call patterns
        const fetchMatches = (content.match(/fetch\(/g) || []).length;
        const axiosMatches = (content.match(/axios\./g) || []).length;
        const supabaseMatches = (content.match(/supabase\./g) || []).length;

        totalApiCalls += fetchMatches + axiosMatches + supabaseMatches;
        fetchCalls += fetchMatches;
        axiosCalls += axiosMatches;
        supabaseCalls += supabaseMatches;
      } catch (error) {
        // Skip files that can't be read
      }
    });

    log('white', `   Total API calls: ${totalApiCalls}`);
    log('white', `   Fetch calls: ${fetchCalls}`);
    log('white', `   Axios calls: ${axiosCalls}`);
    log('white', `   Supabase calls: ${supabaseCalls}`);

    // Check for API call patterns
    if (fetchCalls > 0 && axiosCalls > 0) {
      this.addIssue(
        'low',
        'frontend',
        'Mixed HTTP client usage (fetch + axios)',
        'Standardize on one HTTP client'
      );
    }

    if (totalApiCalls > 50) {
      log(
        'yellow',
        '⚠️  High number of API calls detected - consider optimization'
      );
    }
  }

  async analyzeMiddleware() {
    log('cyan', '\n🔧 MIDDLEWARE ANALYSIS');
    log('white', '-'.repeat(30));

    try {
      // Check for common middleware patterns
      const middlewareFiles = this.findFiles(
        ['**/middleware/**/*.ts', '**/guards/**/*.ts'],
        [],
        path.resolve(__dirname, '../backend/src')
      );

      log('white', `   Found ${middlewareFiles.length} middleware/guard files`);

      // Analyze middleware complexity
      middlewareFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const complexity = this.calculateComplexity(content);

          if (complexity > 10) {
            this.addIssue(
              'medium',
              'middleware',
              `Complex middleware in ${file} (${complexity} complexity)`,
              'Simplify middleware logic'
            );
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    } catch (error) {
      this.addIssue(
        'low',
        'middleware',
        `Middleware analysis failed: ${error.message}`,
        'Check middleware directory structure'
      );
    }
  }

  calculateComplexity(content) {
    // Simple complexity calculation based on control structures
    const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
    const forLoops = (content.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (content.match(/\bwhile\s*\(/g) || []).length;
    const switchStatements = (content.match(/\bswitch\s*\(/g) || []).length;
    const tryBlocks = (content.match(/\btry\s*\{/g) || []).length;

    return ifStatements + forLoops + whileLoops + switchStatements + tryBlocks;
  }

  async analyzeApiPerformance() {
    log('cyan', '\n⚡ API PERFORMANCE ANALYSIS');
    log('white', '-'.repeat(30));

    // Check for performance anti-patterns
    await this.checkPerformanceAntiPatterns();

    // Analyze response patterns
    await this.analyzeResponsePatterns();
  }

  async checkPerformanceAntiPatterns() {
    const antiPatterns = [
      /JSON\.stringify\(/g, // JSON.stringify in responses
      /console\.log\(/g, // Console logs in production code
      /setTimeout\(/g, // setTimeout in API handlers
      /new Promise\(/g, // Manual promise creation
    ];

    try {
      const apiFiles = this.findFiles(
        ['**/*.controller.ts', '**/*.service.ts', '**/*.middleware.ts'],
        [],
        path.resolve(__dirname, '../backend/src')
      );
      let antiPatternsFound = 0;

      apiFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          antiPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              antiPatternsFound += matches.length;
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (antiPatternsFound > 0) {
        log(
          'yellow',
          `⚠️  Found ${antiPatternsFound} performance anti-patterns`
        );
        this.addIssue(
          'medium',
          'performance',
          `${antiPatternsFound} performance anti-patterns found`,
          'Review and optimize API performance'
        );
      } else {
        log('green', '✅ No performance anti-patterns detected');
      }
    } catch (error) {
      this.addIssue(
        'low',
        'performance',
        'Performance analysis failed',
        'Check file permissions'
      );
    }
  }

  async analyzeResponsePatterns() {
    try {
      const controllerFiles = this.findFiles(
        ['**/*.controller.ts'],
        [],
        path.resolve(__dirname, '../backend/src')
      );

      let responseIssues = 0;

      controllerFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for inconsistent response formats
          const returnStatements =
            content.match(/return\s+[\w\s\.\[\]]+/g) || [];
          const inconsistentReturns = returnStatements.filter(
            ret =>
              !ret.includes('ResponseEntity') && !ret.includes('res.status')
          );

          if (inconsistentReturns.length > 0) {
            responseIssues++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (responseIssues > 0) {
        this.addIssue(
          'medium',
          'responses',
          `${responseIssues} files with inconsistent response patterns`,
          'Standardize API response format'
        );
      } else {
        log('green', '✅ Consistent response patterns detected');
      }
    } catch (error) {
      this.addIssue(
        'low',
        'responses',
        'Response analysis failed',
        'Check controller files'
      );
    }
  }

  async analyzeApiSecurity() {
    log('cyan', '\n🔒 API SECURITY ANALYSIS');
    log('white', '-'.repeat(30));

    // Check for security issues
    await this.checkSecurityIssues();
  }

  async checkSecurityIssues() {
    const securityIssues = [
      /password.*=.*['"][^'"]{3,}['"]/gi, // Hardcoded passwords
      /secret.*=.*['"][^'"]{3,}['"]/gi, // Hardcoded secrets
      /api[_-]?key.*=.*['"][^'"]{3,}['"]/gi, // Hardcoded API keys
      /token.*=.*['"][^'"]{3,}['"]/gi, // Hardcoded tokens
      /eval\(/g, // eval() usage
      /innerHTML.*=.*\+/g, // Dangerous innerHTML
    ];

    try {
      const apiFiles = this.findFiles(
        ['**/*.ts', '**/*.tsx'],
        [],
        path.resolve(__dirname, '../')
      );
      let securityIssuesFound = 0;

      apiFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          securityIssues.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              securityIssuesFound += matches.length;
              this.addIssue(
                'critical',
                'security',
                `Security issue in ${file}`,
                'Remove hardcoded secrets and fix security vulnerabilities'
              );
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (securityIssuesFound > 0) {
        this.addIssue(
          'critical',
          'security',
          `${securityIssuesFound} security issues found`,
          'Fix security vulnerabilities immediately'
        );
      } else {
        log('green', '✅ No security issues detected');
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'security',
        'Security analysis failed',
        'Check file permissions'
      );
    }
  }

  findFiles(
    patterns,
    includePatterns = [],
    baseDir = path.resolve(__dirname, '../')
  ) {
    const files = [];
    const glob = require('glob');

    patterns.forEach(pattern => {
      try {
        const found = glob.sync(pattern, {
          cwd: baseDir,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            ...includePatterns,
          ],
        });
        files.push(...found.map(f => path.join(baseDir, f)));
      } catch (error) {
        // Skip invalid patterns
      }
    });

    return files;
  }

  addIssue(severity, category, message, recommendation) {
    this.issues.push({
      severity,
      category,
      message,
      recommendation,
      timestamp: new Date().toISOString(),
    });
  }

  calculateApiScore() {
    const criticalIssues = this.issues.filter(
      issue => issue.severity === 'critical'
    ).length;
    const highIssues = this.issues.filter(
      issue => issue.severity === 'high'
    ).length;
    const mediumIssues = this.issues.filter(
      issue => issue.severity === 'medium'
    ).length;

    // Weighted scoring for API health
    const score = Math.max(
      0,
      100 - criticalIssues * 25 - highIssues * 15 - mediumIssues * 8
    );

    return Math.round(score);
  }

  generateApiReport() {
    log('cyan', '\n📋 API DEBUG REPORT');
    log('white', '='.repeat(60));

    const apiScore = this.calculateApiScore();

    log('cyan', `🎯 API HEALTH SCORE: ${apiScore}/100`);

    if (apiScore >= 90) {
      log('green', '✅ EXCELLENT - API is well-architected');
    } else if (apiScore >= 75) {
      log('yellow', '⚠️  GOOD - Minor API improvements needed');
    } else if (apiScore >= 60) {
      log('yellow', '⚠️  FAIR - Significant API optimizations needed');
    } else {
      log('red', '❌ POOR - Major API issues require attention');
    }

    // Summary statistics
    log('cyan', '\n📊 API STATISTICS');
    log(
      'white',
      `   Backend endpoints: ${this.endpoints.filter(e => e.type === 'backend').length}`
    );
    log(
      'white',
      `   Frontend API calls: ${this.endpoints.filter(e => e.type === 'frontend').length}`
    );
    log('white', `   Middleware files: ${this.middleware.length}`);

    // Critical issues
    const criticalIssues = this.issues.filter(
      issue => issue.severity === 'critical'
    );
    if (criticalIssues.length > 0) {
      log('red', `\n🚨 CRITICAL ISSUES (${criticalIssues.length})`);
      criticalIssues.forEach((issue, index) => {
        log('red', `   ${index + 1}. ${issue.message}`);
        log('blue', `      💡 ${issue.recommendation}`);
      });
    }

    // Performance metrics
    log('cyan', '\n📈 PERFORMANCE METRICS');
    log('white', `   Total endpoints analyzed: ${this.endpoints.length}`);
    log(
      'white',
      `   Security issues found: ${this.issues.filter(i => i.category === 'security').length}`
    );
    log(
      'white',
      `   Performance issues found: ${this.issues.filter(i => i.category === 'performance').length}`
    );

    // Recommendations
    log('cyan', '\n💡 API OPTIMIZATION RECOMMENDATIONS');
    const recommendations = [
      'Implement consistent error handling across all endpoints',
      'Add request/response logging for debugging',
      'Implement rate limiting and security middleware',
      'Add API versioning strategy',
      'Implement proper pagination for list endpoints',
      'Add comprehensive input validation',
      'Implement caching for frequently accessed data',
      'Add health check endpoints',
    ];

    recommendations.slice(0, 5).forEach((rec, index) => {
      log('blue', `   ${index + 1}. ${rec}`);
    });
  }
}

async function runApiDebug() {
  const apiDebugger = new ApiDebugger();
  const score = await apiDebugger.runFullDebug();

  // Exit with appropriate code
  if (score >= 80) {
    log('green', '🎉 API debugging completed successfully!');
    process.exit(0);
  } else if (score >= 60) {
    log('yellow', '⚠️  API debugging completed - optimizations recommended');
    process.exit(0);
  } else {
    log('red', '❌ API debugging failed - critical issues require attention');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runApiDebug().catch(error => {
    log('red', `❌ API debugging failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { ApiDebugger, runApiDebug };
