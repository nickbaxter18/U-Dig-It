# Security Audit Plan Template

## Overview
**Scope:** {component|feature|entire_application}
**Date:** {date}
**Auditor:** {name}

---

## Phase 1: Code Review

### Tasks
- [ ] Review authentication implementation
- [ ] Review authorization (RBAC)
- [ ] Review input validation
- [ ] Review input sanitization
- [ ] Review SQL injection prevention
- [ ] Review XSS prevention
- [ ] Review CSRF protection
- [ ] Review rate limiting
- [ ] Review error handling (no info leakage)

### Findings
- [ ] Document security issues
- [ ] Categorize by severity (Critical, High, Medium, Low)
- [ ] Assign remediation tasks

---

## Phase 2: Dependency Scan

### Tasks
- [ ] Run Snyk code scan
- [ ] Run Snyk SCA scan
- [ ] Review dependency vulnerabilities
- [ ] Check for outdated packages
- [ ] Review license compliance

### Findings
- [ ] Document vulnerabilities
- [ ] Prioritize fixes
- [ ] Plan updates

---

## Phase 3: API Security

### Tasks
- [ ] Review API authentication
- [ ] Review API authorization
- [ ] Review rate limiting
- [ ] Review request validation
- [ ] Review response security headers
- [ ] Review CORS configuration
- [ ] Test API endpoints for vulnerabilities

### Findings
- [ ] Document API security issues
- [ ] Test authentication bypass attempts
- [ ] Test authorization bypass attempts

---

## Phase 4: Database Security

### Tasks
- [ ] Review RLS policies
- [ ] Test RLS policy effectiveness
- [ ] Review database indexes
- [ ] Review connection security
- [ ] Review data encryption
- [ ] Review audit logging

### Findings
- [ ] Document database security issues
- [ ] Test RLS policy bypass attempts
- [ ] Verify data protection

---

## Phase 5: Frontend Security

### Tasks
- [ ] Review XSS prevention
- [ ] Review CSRF protection
- [ ] Review secure storage
- [ ] Review client-side validation
- [ ] Review dependency security
- [ ] Review Content Security Policy

### Findings
- [ ] Document frontend security issues
- [ ] Test XSS vulnerabilities
- [ ] Test CSRF vulnerabilities

---

## Phase 6: Remediation

### Tasks
- [ ] Fix critical issues immediately
- [ ] Fix high-priority issues
- [ ] Plan medium/low priority fixes
- [ ] Re-scan after fixes
- [ ] Document remediation

### Acceptance Criteria
- [ ] All critical issues fixed
- [ ] All high-priority issues fixed
- [ ] Re-scan shows no new issues
- [ ] Remediation documented

---

## Report

### Summary
- Total issues found: {count}
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}

### Recommendations
- {recommendation_1}
- {recommendation_2}
- {recommendation_3}

