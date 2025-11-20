# Archived Rules

**Purpose**: Historical rules that have been consolidated or deprecated.

---

## Why Rules Are Archived

Rules are archived when they:
1. Have been consolidated into a master rule (e.g., individual rules → CORE.mdc, SECURITY.mdc, etc.)
2. Are feature-specific and no longer relevant
3. Have been replaced by better implementations
4. Reference unavailable tools (e.g., Snyk)

---

## Archived Rules Index

### Consolidated into CORE.mdc
- `development-standards.mdc` → See CORE.mdc
- `ai-coding-assistance.mdc` → See CORE.mdc
- `extension-integration.mdc` → See CORE.mdc

### Consolidated into SECURITY.mdc
- `rental-payment-security.mdc` → See SECURITY.mdc

### Consolidated into TESTING.mdc
- `browser-testing-login.mdc` → See TESTING.mdc
- `rental-testing-quality-assurance.mdc` → See TESTING.mdc

### Consolidated into BUSINESS.mdc
- `kubota-business-logic.mdc` → See BUSINESS.mdc
- `rental-business-logic.mdc` → See BUSINESS.mdc

### Consolidated into SUPABASE.mdc
- `api-database-standards.mdc` → See SUPABASE.mdc
- `backend-development.mdc` → See SUPABASE.mdc
- `supabase-backend-priority.mdc` → See SUPABASE.mdc
- `supabase-excellence.mdc` → See SUPABASE.mdc

### Tool-Specific (Not Available)
- `snyk_rules.mdc` → Snyk CLI not available in environment
  - Replaced by: `security-scanning.mdc` (manual security review)

### General/Redundant
- `ultimate-coding-agent.mdc` → General template, redundant with CORE.mdc
- `cognitive-architecture.mdc` → Advanced reasoning patterns, rarely needed
- `murmuration-coordinator.mdc` → Experimental coordination system
- `rule-design-excellence-framework.mdc` → Meta-rule for rule design
- `rental-platform-coordinator.mdc` → Experimental coordinator
- `rental-performance-optimization.mdc` → Consolidated into performance rules

---

## Accessing Archived Rules

If you need functionality from an archived rule:
1. Check the consolidated rule referenced above
2. Use @ mentions to request the consolidated rule
3. If truly needed, the archived rule can be restored

Example:
```
"@ mention SECURITY.mdc for payment security standards"
```

---

**Note**: Archived rules are kept for historical reference but are not loaded by Cursor.

