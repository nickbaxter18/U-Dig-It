const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityScanner {
  constructor() {
    this.securityReport = {
      vulnerabilities: [],
      outdated: [],
      licenses: [],
      recommendations: []
    };
  }

  async scanSecurity() {
    console.log('🔒 Security Scanner - Starting comprehensive security scan...');
    
    // Run security audit
    await this.runSecurityAudit();
    
    // Check for outdated packages
    await this.checkOutdatedPackages();
    
    // Check license compliance
    await this.checkLicenseCompliance();
    
    // Generate security recommendations
    this.generateSecurityRecommendations();
    
    // Generate security report
    this.generateSecurityReport();
    
    console.log('✅ Security scan complete!');
  }

  async runSecurityAudit() {
    console.log('🔍 Running security audit...');
    
    try {
      const audit = execSync('pnpm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(audit);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
          this.securityReport.vulnerabilities.push({
            package: packageName,
            severity: vuln.severity,
            title: vuln.title,
            recommendation: vuln.recommendation
          });
        });
      }
      
      console.log(`🔒 Found ${this.securityReport.vulnerabilities.length} security vulnerabilities`);
    } catch (error) {
      console.log('⚠️ Security audit failed:', error.message);
    }
  }

  async checkOutdatedPackages() {
    console.log('📦 Checking for outdated packages...');
    
    try {
      const outdated = execSync('pnpm outdated --json', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdated);
      
      Object.entries(outdatedData).forEach(([packageName, info]) => {
        this.securityReport.outdated.push({
          package: packageName,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest
        });
      });
      
      console.log(`📦 Found ${this.securityReport.outdated.length} outdated packages`);
    } catch (error) {
      console.log('⚠️ Could not check outdated packages');
    }
  }

  async checkLicenseCompliance() {
    console.log('📄 Checking license compliance...');
    
    try {
      const licenses = execSync('pnpm licenses list --json', { encoding: 'utf8' });
      const licenseData = JSON.parse(licenses);
      
      Object.entries(licenseData).forEach(([packageName, license]) => {
        this.securityReport.licenses.push({
          package: packageName,
          license: license
        });
      });
      
      console.log(`📄 Checked ${this.securityReport.licenses.length} package licenses`);
    } catch (error) {
      console.log('⚠️ Could not check licenses');
    }
  }

  generateSecurityRecommendations() {
    console.log('💡 Generating security recommendations...');
    
    // High severity vulnerabilities
    const highSeverity = this.securityReport.vulnerabilities.filter(v => v.severity === 'high');
    if (highSeverity.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'HIGH',
        issue: 'High severity vulnerabilities found',
        action: 'Update packages immediately',
        count: highSeverity.length
      });
    }
    
    // Outdated packages
    if (this.securityReport.outdated.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'MEDIUM',
        issue: 'Outdated packages found',
        action: 'Update packages to latest versions',
        count: this.securityReport.outdated.length
      });
    }
    
    // License issues
    const problematicLicenses = this.securityReport.licenses.filter(l => 
      l.license.includes('GPL') || l.license.includes('AGPL')
    );
    if (problematicLicenses.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'LOW',
        issue: 'Potentially problematic licenses found',
        action: 'Review package licenses',
        count: problematicLicenses.length
      });
    }
  }

  generateSecurityReport() {
    console.log('📊 Security Report:');
    console.log('==================');
    
    console.log(`🔒 Vulnerabilities: ${this.securityReport.vulnerabilities.length}`);
    console.log(`📦 Outdated packages: ${this.securityReport.outdated.length}`);
    console.log(`📄 Licenses checked: ${this.securityReport.licenses.length}`);
    
    if (this.securityReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.securityReport.recommendations.forEach(rec => {
        console.log(`${rec.priority}: ${rec.issue} (${rec.count} items) - ${rec.action}`);
      });
    }
    
    console.log('\n✅ Security scan report generated');
  }
}

// Run security scan
const scanner = new SecurityScanner();
scanner.scanSecurity();
