# Scripts Directory

Organized utility scripts for development, deployment, testing, and setup.

## 📁 Directory Structure

### setup/ (3 scripts)
Configuration and initial setup scripts.
- `setup-stripe-webhook.sh` - Configure Stripe webhooks
- `setup-supabase-frontend.sh` - Setup Supabase for frontend
- `configure-sendgrid-smtp.sh` - Configure SendGrid email

### deployment/ (4 scripts)
Deployment automation scripts.
- `deploy_all_migrations.sh` - Deploy database migrations
- `CREATE_STRIPE_WEBHOOK.sh` - Create Stripe webhook endpoint
- `COMPLETE_IMAGE_SEO_IMPLEMENTATION.sh` - SEO implementation

### development/ (5 scripts)
Development utilities and tools.
- `cleanup-junk-code.sh` - Clean temporary files
- `fix-precommit-hooks.sh` - Fix pre-commit hooks
- `update-email-templates.sh` - Update email templates
- `update-email-templates-api.sh` - Update email API
- `update-gitignore.sh` - Update gitignore

### testing/ (3 scripts)
Testing and verification scripts.
- `test-card-verification.sh` - Test card verification
- `test-payment-completion.sh` - Test payment completion
- `TEST_YOUR_PLATFORM.sh` - Platform testing

### reorganize/ (6 scripts)
Codebase reorganization automation.
- See `reorganize/README.md` for details

## 🛡️ Protected Scripts (Remain in Root)

These scripts MUST stay in the project root:
- `start-frontend-clean.sh` ⚠️ Used by Cursor on startup
- `start-frontend.sh` ⚠️ Standard frontend startup
- `restart-dev-server.sh` ⚠️ Development restart

**NEVER move these startup scripts!**

## 🚀 Common Usage

```bash
# Initial setup
./scripts/setup/setup-supabase-frontend.sh
./scripts/setup/configure-sendgrid-smtp.sh

# Development
./scripts/development/cleanup-junk-code.sh
./scripts/development/fix-precommit-hooks.sh

# Testing
./scripts/testing/TEST_YOUR_PLATFORM.sh

# Deployment
./scripts/deployment/deploy_all_migrations.sh
```

## 📝 Adding New Scripts

When creating new scripts:
1. Place in appropriate subdirectory
2. Make executable: `chmod +x script-name.sh`
3. Add header documentation
4. Update this README

**Never add startup scripts to subdirectories!**

---

*Last Updated: November 4, 2025*
