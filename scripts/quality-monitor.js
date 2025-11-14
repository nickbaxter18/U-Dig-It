const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QualityMonitor {
  constructor() {
    this.qualityMetrics = {
      typeCheck: false,
      linting: false,
      formatting: false,
      tests: false,
      security: false,
      dependencies: false
    };
  }

  async runQualityCheck() {
    console.log('🔍 Quality Monitor - Running comprehensive quality check...');
    
    // Run all quality checks
    await this.runTypeCheck();
    await this.runLinting();
    await this.runFormatting();
    await this.runTests();
    await this.runSecurityAudit();
    await this.runDependencyCheck();
    
    // Generate quality report
    this.generateQualityReport();
    
    // Check if all quality gates passed
    const allPassed = Object.values(this.qualityMetrics).every(status => status);
    
    if (allPassed) {
      console.log('✅ All quality gates passed!');
      return true;
    } else {
      console.log('❌ Some quality gates failed!');
      return false;
    }
  }

  async runTypeCheck() {
    console.log('📝 Running type check...');
    try {
      execSync('pnpm type-check', { stdio: 'pipe' });
      this.qualityMetrics.typeCheck = true;
      console.log('✅ Type check passed');
    } catch (error) {
      this.qualityMetrics.typeCheck = false;
      console.log('❌ Type check failed');
    }
  }

  async runLinting() {
    console.log('🔧 Running linting...');
    try {
      execSync('pnpm lint:fast', { stdio: 'pipe' });
      this.qualityMetrics.linting = true;
      console.log('✅ Linting passed');
    } catch (error) {
      this.qualityMetrics.linting = false;
      console.log('❌ Linting failed');
    }
  }

  async runFormatting() {
    console.log('🎨 Running formatting check...');
    try {
      execSync('pnpm format:check', { stdio: 'pipe' });
      this.qualityMetrics.formatting = true;
      console.log('✅ Formatting passed');
    } catch (error) {
      this.qualityMetrics.formatting = false;
      console.log('❌ Formatting failed');
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    try {
      execSync('pnpm test:fast', { stdio: 'pipe' });
      this.qualityMetrics.tests = true;
      console.log('✅ Tests passed');
    } catch (error) {
      this.qualityMetrics.tests = false;
      console.log('❌ Tests failed');
    }
  }

  async runSecurityAudit() {
    console.log('🔒 Running security audit...');
    try {
      execSync('pnpm audit --audit-level moderate', { stdio: 'pipe' });
      this.qualityMetrics.security = true;
      console.log('✅ Security audit passed');
    } catch (error) {
      this.qualityMetrics.security = false;
      console.log('❌ Security audit failed');
    }
  }

  async runDependencyCheck() {
    console.log('📦 Running dependency check...');
    try {
      execSync('pnpm validate:dependencies', { stdio: 'pipe' });
      this.qualityMetrics.dependencies = true;
      console.log('✅ Dependencies passed');
    } catch (error) {
      this.qualityMetrics.dependencies = false;
      console.log('❌ Dependencies failed');
    }
  }

  generateQualityReport() {
    console.log('📊 Quality Report:');
    console.log('==================');
    console.log(`📝 Type Check: ${this.qualityMetrics.typeCheck ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔧 Linting: ${this.qualityMetrics.linting ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🎨 Formatting: ${this.qualityMetrics.formatting ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🧪 Tests: ${this.qualityMetrics.tests ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔒 Security: ${this.qualityMetrics.security ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`📦 Dependencies: ${this.qualityMetrics.dependencies ? '✅ PASSED' : '❌ FAILED'}`);
    
    const passedCount = Object.values(this.qualityMetrics).filter(status => status).length;
    const totalCount = Object.keys(this.qualityMetrics).length;
    console.log(`\n📈 Quality Score: ${passedCount}/${totalCount} (${Math.round(passedCount/totalCount*100)}%)`);
  }
}

// Run quality check
const monitor = new QualityMonitor();
monitor.runQualityCheck();
