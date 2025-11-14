const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.securityReport = {
      vulnerabilities: [],
      recommendations: [],
      score: 0,
      criticalIssues: [],
      mediumIssues: [],
      lowIssues: []
    };
  }

  async runSecurityAudit() {
    console.log('🔒 Security Auditor - Starting comprehensive security audit...');
    
    // Run dependency security audit
    await this.auditDependencies();
    
    // Run code security audit
    await this.auditCode();
    
    // Run configuration security audit
    await this.auditConfiguration();
    
    // Run environment security audit
    await this.auditEnvironment();
    
    // Generate security score
    this.generateSecurityScore();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Display security report
    this.displaySecurityReport();
    
    console.log('✅ Security audit complete!');
  }

  async auditDependencies() {
    console.log('📦 Auditing dependencies for security vulnerabilities...');
    
    try {
      const audit = execSync('pnpm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(audit);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
          const issue = {
            type: 'DEPENDENCY_VULNERABILITY',
            package: packageName,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.description,
            recommendation: vuln.recommendation
          };
          
          this.securityReport.vulnerabilities.push(issue);
          
          if (vuln.severity === 'critical' || vuln.severity === 'high') {
            this.securityReport.criticalIssues.push(issue);
          } else if (vuln.severity === 'moderate') {
            this.securityReport.mediumIssues.push(issue);
          } else {
            this.securityReport.lowIssues.push(issue);
          }
        });
      }
      
      console.log(`🔍 Found ${this.securityReport.vulnerabilities.length} security vulnerabilities`);
    } catch (error) {
      console.log('⚠️ Could not audit dependencies');
    }
  }

  async auditCode() {
    console.log('🔍 Auditing code for security issues...');
    
    // Check for common security issues in code
    const securityPatterns = [
      { pattern: /eval\s*\(/, severity: 'HIGH', description: 'Use of eval() function' },
      { pattern: /innerHTML\s*=/, severity: 'MEDIUM', description: 'Direct innerHTML assignment' },
      { pattern: /document\.write\s*\(/, severity: 'MEDIUM', description: 'Use of document.write()' },
      { pattern: /localStorage\.setItem\s*\(/, severity: 'LOW', description: 'localStorage usage' },
      { pattern: /sessionStorage\.setItem\s*\(/, severity: 'LOW', description: 'sessionStorage usage' }
    ];
    
    const codeFiles = this.getAllCodeFiles();
    
    codeFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        securityPatterns.forEach(pattern => {
          const matches = content.match(new RegExp(pattern.pattern, 'g'));
          if (matches) {
            const issue = {
              type: 'CODE_SECURITY_ISSUE',
              file: file,
              severity: pattern.severity,
              description: pattern.description,
              matches: matches.length
            };
            
            this.securityReport.vulnerabilities.push(issue);
            
            if (pattern.severity === 'HIGH') {
              this.securityReport.criticalIssues.push(issue);
            } else if (pattern.severity === 'MEDIUM') {
              this.securityReport.mediumIssues.push(issue);
            } else {
              this.securityReport.lowIssues.push(issue);
            }
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });
    
    console.log(`🔍 Audited ${codeFiles.length} code files`);
  }

  async auditConfiguration() {
    console.log('⚙️ Auditing configuration for security issues...');
    
    // Check for insecure configurations
    const configFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      '.env',
      '.env.local'
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for common security misconfigurations
          if (content.includes('NODE_ENV=development') && file.includes('.env')) {
            this.securityReport.mediumIssues.push({
              type: 'CONFIG_SECURITY_ISSUE',
              file: file,
              severity: 'MEDIUM',
              description: 'Development environment in production config'
            });
          }
          
          if (content.includes('DEBUG=true') && file.includes('.env')) {
            this.securityReport.mediumIssues.push({
              type: 'CONFIG_SECURITY_ISSUE',
              file: file,
              severity: 'MEDIUM',
              description: 'Debug mode enabled in production'
            });
          }
          
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
    
    console.log('✅ Configuration audit complete');
  }

  async auditEnvironment() {
    console.log('🌍 Auditing environment for security issues...');
    
    // Check for environment variables
    const envVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'API_KEY',
      'SECRET_KEY'
    ];
    
    envVars.forEach(envVar => {
      if (process.env[envVar]) {
        // Check for weak secrets
        if (envVar.includes('SECRET') || envVar.includes('KEY')) {
          const value = process.env[envVar];
          if (value.length < 32) {
            this.securityReport.mediumIssues.push({
              type: 'ENV_SECURITY_ISSUE',
              variable: envVar,
              severity: 'MEDIUM',
              description: 'Weak secret key detected'
            });
          }
        }
      } else {
        this.securityReport.lowIssues.push({
          type: 'ENV_SECURITY_ISSUE',
          variable: envVar,
          severity: 'LOW',
          description: 'Environment variable not set'
        });
      }
    });
    
    console.log('✅ Environment audit complete');
  }

  getAllCodeFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory('.');
    return files;
  }

  generateSecurityScore() {
    const totalIssues = this.securityReport.vulnerabilities.length;
    const criticalIssues = this.securityReport.criticalIssues.length;
    const mediumIssues = this.securityReport.mediumIssues.length;
    const lowIssues = this.securityReport.lowIssues.length;
    
    // Calculate security score (0-100)
    let score = 100;
    score -= criticalIssues * 20; // -20 points per critical issue
    score -= mediumIssues * 10;  // -10 points per medium issue
    score -= lowIssues * 2;      // -2 points per low issue
    
    this.securityReport.score = Math.max(0, score);
  }

  generateRecommendations() {
    console.log('💡 Generating security recommendations...');
    
    if (this.securityReport.criticalIssues.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'CRITICAL',
        action: 'Fix critical security vulnerabilities immediately',
        count: this.securityReport.criticalIssues.length
      });
    }
    
    if (this.securityReport.mediumIssues.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'HIGH',
        action: 'Address medium severity security issues',
        count: this.securityReport.mediumIssues.length
      });
    }
    
    if (this.securityReport.lowIssues.length > 0) {
      this.securityReport.recommendations.push({
        priority: 'MEDIUM',
        action: 'Review low severity security issues',
        count: this.securityReport.lowIssues.length
      });
    }
    
    // General recommendations
    this.securityReport.recommendations.push({
      priority: 'LOW',
      action: 'Implement security headers',
      count: 1
    });
    
    this.securityReport.recommendations.push({
      priority: 'LOW',
      action: 'Enable HTTPS in production',
      count: 1
    });
    
    this.securityReport.recommendations.push({
      priority: 'LOW',
      action: 'Implement rate limiting',
      count: 1
    });
  }

  displaySecurityReport() {
    console.log('\n🔒 SECURITY AUDIT REPORT');
    console.log('========================');
    
    console.log(`\n📊 Security Score: ${this.securityReport.score}/100`);
    
    console.log('\n🚨 Security Issues:');
    console.log(`🔴 Critical: ${this.securityReport.criticalIssues.length}`);
    console.log(`🟡 Medium: ${this.securityReport.mediumIssues.length}`);
    console.log(`🟢 Low: ${this.securityReport.lowIssues.length}`);
    
    if (this.securityReport.criticalIssues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      this.securityReport.criticalIssues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.description}`);
      });
    }
    
    if (this.securityReport.mediumIssues.length > 0) {
      console.log('\n🟡 MEDIUM ISSUES:');
      this.securityReport.mediumIssues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.description}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    this.securityReport.recommendations.forEach(rec => {
      console.log(`  [${rec.priority}] ${rec.action} (${rec.count} items)`);
    });
    
    // Save report
    const timestamp = new Date().toISOString();
    const filename = `security-audit-${timestamp.split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.securityReport, null, 2));
    console.log(`\n💾 Security report saved to ${filename}`);
  }
}

// Run security audit
const auditor = new SecurityAuditor();
auditor.runSecurityAudit();
