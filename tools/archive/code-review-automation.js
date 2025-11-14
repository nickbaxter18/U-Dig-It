#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE CODE REVIEW AUTOMATION
 * Automated code review with quality scoring, security analysis, and best practices validation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 CODE REVIEW AUTOMATION STARTING...\n');

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

class CodeReviewAutomation {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.metrics = {
      totalFiles: 0,
      linesOfCode: 0,
      complexity: 0,
      testCoverage: 0,
      securityScore: 0,
      maintainabilityScore: 0,
    };
  }

  async runFullReview() {
    log('cyan', '🔍 COMPREHENSIVE CODE REVIEW ANALYSIS');
    log('white', '='.repeat(60));

    try {
      // 1. Code Quality Analysis
      await this.analyzeCodeQuality();

      // 2. Security Analysis
      await this.analyzeSecurity();

      // 3. Performance Analysis
      await this.analyzePerformance();

      // 4. Testing Analysis
      await this.analyzeTesting();

      // 5. Documentation Analysis
      await this.analyzeDocumentation();

      // 6. Architecture Analysis
      await this.analyzeArchitecture();

      // 7. Generate Report
      this.generateReviewReport();

      return this.calculateOverallScore();
    } catch (error) {
      log('red', `❌ Code review failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeCodeQuality() {
    log('cyan', '\n📊 CODE QUALITY ANALYSIS');
    log('white', '-'.repeat(30));

    // TypeScript compilation check
    try {
      runCommand('pnpm type-check:verbose', 'TypeScript compilation');
      this.addMetric('typescript', 100, 'TypeScript compilation passed');
    } catch (error) {
      this.addIssue(
        'critical',
        'typescript',
        'TypeScript compilation failed',
        'Fix type errors'
      );
      this.addMetric('typescript', 0, 'TypeScript compilation failed');
    }

    // ESLint analysis
    try {
      const lintOutput = runCommand('pnpm lint:fast', 'ESLint analysis', {
        silent: true,
      });
      if (lintOutput && lintOutput.includes('error')) {
        this.addIssue(
          'high',
          'eslint',
          'ESLint found errors',
          'Fix linting errors'
        );
        this.addMetric('eslint', 60, 'ESLint errors found');
      } else {
        this.addMetric('eslint', 95, 'ESLint passed');
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'eslint',
        'ESLint execution failed',
        'Check ESLint configuration'
      );
      this.addMetric('eslint', 50, 'ESLint execution failed');
    }

    // Prettier formatting check
    try {
      runCommand('pnpm format:check', 'Prettier formatting check');
      this.addMetric('formatting', 100, 'Code formatting correct');
    } catch (error) {
      this.addIssue(
        'low',
        'formatting',
        'Code formatting issues',
        'Run prettier formatting'
      );
      this.addMetric('formatting', 80, 'Formatting issues found');
    }
  }

  async analyzeSecurity() {
    log('cyan', '\n🔒 SECURITY ANALYSIS');
    log('white', '-'.repeat(30));

    // Dependency vulnerabilities
    try {
      const auditOutput = runCommand(
        'pnpm audit --audit-level moderate',
        'Security audit',
        { silent: true }
      );
      if (auditOutput && auditOutput.includes('vulnerabilities')) {
        this.addIssue(
          'high',
          'security',
          'Security vulnerabilities found',
          'Update vulnerable dependencies'
        );
        this.addMetric('security', 70, 'Vulnerable dependencies found');
      } else {
        this.addMetric('security', 95, 'No security vulnerabilities');
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'security',
        'Security audit failed',
        'Check package.json and dependencies'
      );
      this.addMetric('security', 50, 'Security audit failed');
    }

    // Check for hardcoded secrets
    await this.checkHardcodedSecrets();

    // Check for insecure patterns
    await this.checkInsecurePatterns();
  }

  async checkHardcodedSecrets() {
    const sensitivePatterns = [
      /password.*=.*['"][^'"]{3,}['"]/gi,
      /secret.*=.*['"][^'"]{3,}['"]/gi,
      /api[_-]?key.*=.*['"][^'"]{3,}['"]/gi,
      /token.*=.*['"][^'"]{3,}['"]/gi,
    ];

    try {
      const files = this.findFiles([
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
      ]);
      let secretsFound = 0;

      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          sensitivePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              secretsFound += matches.length;
              this.addIssue(
                'critical',
                'security',
                `Potential hardcoded secret in ${file}`,
                'Remove hardcoded secrets'
              );
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (secretsFound > 0) {
        this.addMetric(
          'security',
          20,
          `${secretsFound} potential secrets found`
        );
      } else {
        this.addMetric('security', 100, 'No hardcoded secrets detected');
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'security',
        'Secret scanning failed',
        'Check file permissions'
      );
    }
  }

  async checkInsecurePatterns() {
    const insecurePatterns = [
      /console\.log/g,
      /debugger/g,
      /eval\(/g,
      /innerHTML.*=.*\+/g,
      /document\.write/g,
    ];

    try {
      const files = this.findFiles([
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
      ]);
      let insecureFound = 0;

      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          insecurePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              insecureFound += matches.length;
              this.addIssue(
                'medium',
                'security',
                `Insecure pattern in ${file}`,
                'Review and fix insecure patterns'
              );
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (insecureFound > 0) {
        this.addMetric(
          'security',
          80,
          `${insecureFound} insecure patterns found`
        );
      } else {
        this.addMetric('security', 95, 'No insecure patterns detected');
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'security',
        'Insecure pattern scanning failed',
        'Check file permissions'
      );
    }
  }

  async analyzePerformance() {
    log('cyan', '\n⚡ PERFORMANCE ANALYSIS');
    log('white', '-'.repeat(30));

    // Bundle size analysis
    try {
      const bundleOutput = runCommand('pnpm build:analyze', 'Bundle analysis', {
        silent: true,
      });
      if (bundleOutput) {
        // Analyze bundle size (simplified)
        const sizeMatch = bundleOutput.match(/(\d+(?:\.\d+)?)\s*(KB|MB)/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2];

          if ((unit === 'MB' && size > 5) || (unit === 'KB' && size > 500)) {
            this.addIssue(
              'medium',
              'performance',
              'Large bundle size detected',
              'Optimize bundle size'
            );
            this.addMetric('performance', 70, `Bundle size: ${size}${unit}`);
          } else {
            this.addMetric('performance', 90, `Bundle size: ${size}${unit}`);
          }
        }
      }
    } catch (error) {
      this.addIssue(
        'low',
        'performance',
        'Bundle analysis failed',
        'Check build configuration'
      );
      this.addMetric('performance', 50, 'Bundle analysis failed');
    }

    // Check for performance anti-patterns
    await this.checkPerformanceAntiPatterns();
  }

  async checkPerformanceAntiPatterns() {
    const antiPatterns = [
      /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/g, // Empty dependency array
      /setState\(\{.*\}\)/g, // Object spread in setState
      /JSON\.stringify\(/g, // JSON.stringify in render
    ];

    try {
      const files = this.findFiles(['**/*.tsx', '**/*.ts']);
      let antiPatternsFound = 0;

      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          antiPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              antiPatternsFound += matches.length;
              this.addIssue(
                'low',
                'performance',
                `Performance anti-pattern in ${file}`,
                'Optimize performance patterns'
              );
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (antiPatternsFound > 0) {
        this.addMetric(
          'performance',
          80,
          `${antiPatternsFound} performance anti-patterns found`
        );
      } else {
        this.addMetric(
          'performance',
          95,
          'No performance anti-patterns detected'
        );
      }
    } catch (error) {
      this.addIssue(
        'low',
        'performance',
        'Performance pattern analysis failed',
        'Check file permissions'
      );
    }
  }

  async analyzeTesting() {
    log('cyan', '\n🧪 TESTING ANALYSIS');
    log('white', '-'.repeat(30));

    // Test coverage check
    try {
      const coverageOutput = runCommand(
        'pnpm test:coverage',
        'Test coverage analysis',
        { silent: true }
      );
      if (coverageOutput) {
        // Parse coverage (simplified)
        const linesMatch = coverageOutput.match(/Lines\s*:\s*(\d+(?:\.\d+)?)%/);
        if (linesMatch) {
          const coverage = parseFloat(linesMatch[1]);
          if (coverage < 70) {
            this.addIssue(
              'medium',
              'testing',
              `Low test coverage: ${coverage}%`,
              'Increase test coverage'
            );
            this.addMetric('testing', 60, `Test coverage: ${coverage}%`);
          } else {
            this.addMetric('testing', 90, `Test coverage: ${coverage}%`);
          }
        }
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'testing',
        'Test coverage analysis failed',
        'Check test configuration'
      );
      this.addMetric('testing', 50, 'Test coverage analysis failed');
    }

    // Check for test files
    await this.checkTestFiles();
  }

  async checkTestFiles() {
    try {
      const sourceFiles = this.findFiles(
        ['**/*.ts', '**/*.tsx'],
        ['**/*.test.ts', '**/*.spec.ts', '**/test/**']
      );
      const testFiles = this.findFiles(['**/*.test.ts', '**/*.spec.ts']);

      const testRatio = (testFiles.length / sourceFiles.length) * 100;

      if (testRatio < 50) {
        this.addIssue(
          'medium',
          'testing',
          `Low test file ratio: ${testRatio.toFixed(1)}%`,
          'Add more test files'
        );
        this.addMetric(
          'testing',
          70,
          `Test file ratio: ${testRatio.toFixed(1)}%`
        );
      } else {
        this.addMetric(
          'testing',
          90,
          `Test file ratio: ${testRatio.toFixed(1)}%`
        );
      }
    } catch (error) {
      this.addIssue(
        'low',
        'testing',
        'Test file analysis failed',
        'Check directory structure'
      );
    }
  }

  async analyzeDocumentation() {
    log('cyan', '\n📚 DOCUMENTATION ANALYSIS');
    log('white', '-'.repeat(30));

    // Check README quality
    try {
      const readmePath = path.resolve(__dirname, '../README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');

        const hasTitle = content.match(/^#\s+.+$/m);
        const hasDescription = content.length > 200;
        const hasSetup =
          content.includes('## Installation') || content.includes('## Setup');
        const hasUsage =
          content.includes('## Usage') ||
          content.includes('## Getting Started');

        if (hasTitle && hasDescription && hasSetup && hasUsage) {
          this.addMetric('documentation', 95, 'README well-structured');
        } else {
          this.addIssue(
            'low',
            'documentation',
            'README missing essential sections',
            'Improve README structure'
          );
          this.addMetric('documentation', 70, 'README needs improvement');
        }
      } else {
        this.addIssue(
          'medium',
          'documentation',
          'README.md not found',
          'Create README.md'
        );
        this.addMetric('documentation', 30, 'README missing');
      }
    } catch (error) {
      this.addIssue(
        'low',
        'documentation',
        'README analysis failed',
        'Check README.md file'
      );
    }

    // Check code comments
    await this.checkCodeComments();
  }

  async checkCodeComments() {
    try {
      const files = this.findFiles(['**/*.ts', '**/*.tsx']);
      let totalLines = 0;
      let commentLines = 0;

      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach(line => {
            totalLines++;
            if (
              line.trim().startsWith('//') ||
              line.trim().startsWith('*') ||
              line.trim().startsWith('/**')
            ) {
              commentLines++;
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      const commentRatio = (commentLines / totalLines) * 100;

      if (commentRatio < 10) {
        this.addIssue(
          'low',
          'documentation',
          `Low comment ratio: ${commentRatio.toFixed(1)}%`,
          'Add more code comments'
        );
        this.addMetric(
          'documentation',
          70,
          `Comment ratio: ${commentRatio.toFixed(1)}%`
        );
      } else {
        this.addMetric(
          'documentation',
          90,
          `Comment ratio: ${commentRatio.toFixed(1)}%`
        );
      }
    } catch (error) {
      this.addIssue(
        'low',
        'documentation',
        'Comment analysis failed',
        'Check file permissions'
      );
    }
  }

  async analyzeArchitecture() {
    log('cyan', '\n🏗️  ARCHITECTURE ANALYSIS');
    log('white', '-'.repeat(30));

    // Check for proper folder structure
    await this.checkFolderStructure();

    // Check for proper imports and dependencies
    await this.checkImportStructure();
  }

  async checkFolderStructure() {
    const requiredFolders = [
      'src/components',
      'src/lib',
      'src/hooks',
      'src/types',
      'src/utils',
      'src/styles',
    ];

    let structureScore = 0;

    requiredFolders.forEach(folder => {
      const fullPath = path.resolve(__dirname, '../frontend', folder);
      if (fs.existsSync(fullPath)) {
        structureScore += 20;
      }
    });

    this.addMetric(
      'architecture',
      structureScore,
      `Folder structure: ${structureScore}% complete`
    );
  }

  async checkImportStructure() {
    try {
      const files = this.findFiles(['**/*.ts', '**/*.tsx']);
      let importIssues = 0;

      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const imports = content.match(/import.*from/g) || [];

          // Check for relative imports that could be absolute
          const relativeImports = imports.filter(
            imp => imp.includes('./') || imp.includes('../')
          );

          if (relativeImports.length > 5) {
            importIssues++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (importIssues > 0) {
        this.addIssue(
          'low',
          'architecture',
          `${importIssues} files with complex import structure`,
          'Use absolute imports where possible'
        );
        this.addMetric(
          'architecture',
          80,
          'Import structure needs optimization'
        );
      } else {
        this.addMetric('architecture', 95, 'Import structure optimized');
      }
    } catch (error) {
      this.addIssue(
        'low',
        'architecture',
        'Import analysis failed',
        'Check file permissions'
      );
    }
  }

  findFiles(patterns, excludePatterns = []) {
    const files = [];
    const glob = require('glob');

    patterns.forEach(pattern => {
      try {
        const found = glob.sync(pattern, {
          cwd: path.resolve(__dirname, '../'),
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            ...excludePatterns,
          ],
        });
        files.push(...found);
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

  addMetric(category, score, description) {
    this.metrics[`${category}Score`] = score;
    this.recommendations.push({
      category,
      score,
      description,
    });
  }

  calculateOverallScore() {
    const categories = [
      'typescript',
      'eslint',
      'formatting',
      'security',
      'performance',
      'testing',
      'documentation',
      'architecture',
    ];
    const totalScore = categories.reduce((sum, category) => {
      return sum + (this.metrics[`${category}Score`] || 0);
    }, 0);

    return Math.round(totalScore / categories.length);
  }

  generateReviewReport() {
    log('cyan', '\n📋 CODE REVIEW REPORT');
    log('white', '='.repeat(60));

    const overallScore = this.calculateOverallScore();

    log('cyan', `🎯 OVERALL CODE QUALITY SCORE: ${overallScore}/100`);

    if (overallScore >= 90) {
      log('green', '✅ EXCELLENT - Production ready code');
    } else if (overallScore >= 75) {
      log('yellow', '⚠️  GOOD - Minor improvements needed');
    } else if (overallScore >= 60) {
      log('yellow', '⚠️  FAIR - Significant improvements needed');
    } else {
      log('red', '❌ POOR - Major issues require attention');
    }

    // Category breakdown
    log('cyan', '\n📊 CATEGORY BREAKDOWN');
    const categories = [
      'typescript',
      'eslint',
      'formatting',
      'security',
      'performance',
      'testing',
      'documentation',
      'architecture',
    ];

    categories.forEach(category => {
      const score = this.metrics[`${category}Score`] || 0;
      const color = score >= 90 ? 'green' : score >= 75 ? 'yellow' : 'red';
      log(color, `   ${category.toUpperCase()}: ${score}/100`);
    });

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

    // Recommendations
    log('cyan', '\n💡 TOP RECOMMENDATIONS');
    this.recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((rec, index) => {
        const color =
          rec.score >= 90 ? 'green' : rec.score >= 75 ? 'yellow' : 'red';
        log(color, `   ${index + 1}. ${rec.category}: ${rec.description}`);
      });

    // Save report
    this.saveReport(overallScore);
  }

  saveReport(score) {
    const reportPath = path.resolve(__dirname, '../code-review-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: score,
      metrics: this.metrics,
      issues: this.issues,
      recommendations: this.recommendations,
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      log('green', `✅ Code review report saved to ${reportPath}`);
    } catch (error) {
      log('red', `❌ Failed to save code review report: ${error.message}`);
    }
  }
}

function runCommand(command, description, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '../'),
      timeout: options.timeout || 60000,
      stdio: options.silent ? 'pipe' : 'inherit',
    });

    if (options.silent) {
      log('green', `✅ ${description} completed successfully`);
    }
    return output;
  } catch (error) {
    if (!options.silent) {
      log('red', `❌ ${description} failed: ${error.message}`);
    }
    return null;
  }
}

async function runCodeReview() {
  const reviewer = new CodeReviewAutomation();
  const score = await reviewer.runFullReview();

  // Exit with appropriate code based on score
  if (score >= 80) {
    log('green', '🎉 Code review passed with excellent score!');
    process.exit(0);
  } else if (score >= 60) {
    log('yellow', '⚠️  Code review completed - improvements recommended');
    process.exit(0);
  } else {
    log('red', '❌ Code review failed - critical issues require attention');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCodeReview().catch(error => {
    log('red', `❌ Code review automation failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { CodeReviewAutomation, runCodeReview };
