const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyUpdater {
  constructor() {
    this.updateLog = [];
    this.securityIssues = [];
  }

  async updateDependencies() {
    console.log('📦 Smart Dependency Manager - Starting automated updates...');

    // Check for outdated dependencies
    await this.checkOutdatedDependencies();

    // Check for security vulnerabilities
    await this.checkSecurityVulnerabilities();

    // Update dependencies safely
    await this.updateDependenciesSafely();

    // Generate update report
    this.generateUpdateReport();

    console.log('✅ Dependency management complete!');
  }

  async checkOutdatedDependencies() {
    console.log('🔍 Checking for outdated dependencies...');

    try {
      const outdated = execSync('pnpm outdated --json', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdated);

      if (Object.keys(outdatedData).length > 0) {
        console.log(
          `📦 Found ${Object.keys(outdatedData).length} outdated dependencies`
        );
        this.updateLog.push(
          `Found ${Object.keys(outdatedData).length} outdated dependencies`
        );
      } else {
        console.log('✅ All dependencies are up to date');
      }
    } catch (error) {
      console.log('⚠️ Could not check outdated dependencies');
    }
  }

  async checkSecurityVulnerabilities() {
    console.log('🔒 Checking for security vulnerabilities...');

    try {
      const audit = execSync('pnpm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(audit);

      if (
        auditData.vulnerabilities &&
        Object.keys(auditData.vulnerabilities).length > 0
      ) {
        const vulnerabilityCount = Object.keys(
          auditData.vulnerabilities
        ).length;
        console.log(`⚠️ Found ${vulnerabilityCount} security vulnerabilities`);
        this.securityIssues.push(
          `Found ${vulnerabilityCount} security vulnerabilities`
        );
      } else {
        console.log('✅ No security vulnerabilities found');
      }
    } catch (error) {
      console.log('⚠️ Could not check security vulnerabilities');
    }
  }

  async updateDependenciesSafely() {
    console.log('🔄 Updating dependencies safely...');

    try {
      // Update patch versions only (safest)
      execSync('pnpm update --recursive', { stdio: 'inherit' });
      console.log('✅ Dependencies updated successfully');
      this.updateLog.push('Dependencies updated successfully');
    } catch (error) {
      console.log('❌ Failed to update dependencies:', error.message);
      this.updateLog.push('Failed to update dependencies');
    }
  }

  generateUpdateReport() {
    console.log('📊 Dependency Update Report:');
    console.log('============================');

    this.updateLog.forEach(log => {
      console.log(`📝 ${log}`);
    });

    if (this.securityIssues.length > 0) {
      console.log('\n🔒 Security Issues:');
      this.securityIssues.forEach(issue => {
        console.log(`⚠️ ${issue}`);
      });
    }

    console.log('\n✅ Dependency management report generated');
  }
}

// Run dependency update
const updater = new DependencyUpdater();
updater.updateDependencies();
