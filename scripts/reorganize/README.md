# Codebase Reorganization Scripts

This directory contains automated scripts to help with the codebase reorganization process.

## 📁 Available Scripts

### Phase 1: Documentation Cleanup
**Script:** `phase1-docs-cleanup.sh`
**Purpose:** Archive 276 markdown files into organized documentation structure
**Risk Level:** 🟢 Low
**Duration:** Automated (~2 minutes)
**Manual Review:** ~1-2 hours

```bash
chmod +x phase1-docs-cleanup.sh
./phase1-docs-cleanup.sh
```

**What it does:**
- Creates `docs/` directory with subdirectories (archive, guides, architecture, features, testing, api)
- Moves progress reports (✅, 🎉, 🎊, 🏆, 📋, 🎯) to `docs/archive/`
- Categorizes technical docs by type
- Creates documentation index
- Generates summary report

**After running:**
- Review `docs/` directory structure
- Verify no important docs were missed
- Check `docs/README.md` for navigation
- Commit changes

---

### Phase 2: Remove Legacy Code
**Script:** `phase2-remove-legacy.sh`
**Purpose:** Archive unused NestJS backend and related code
**Risk Level:** 🟡 Medium
**Duration:** Automated (~1 minute)
**Manual Review:** ~1-2 hours

```bash
chmod +x phase2-remove-legacy.sh
./phase2-remove-legacy.sh
```

**What it does:**
- Verifies no active imports to legacy directories
- Archives: `backend/`, `guards/`, `decorators/`, `services/`, `auth/`, `lib/`
- Creates `_archive/legacy-code-YYYYMMDD/` with README
- Generates summary report

**Safety checks:**
- Scans frontend for active imports
- Checks scripts for references
- Creates backup branch automatically
- Archives instead of deletes

**After running:**
- Verify frontend still builds: `cd frontend && pnpm run build`
- Run tests: `pnpm test`
- Review archived code in `_archive/`
- Commit changes

---

## 🚀 Quick Start

### Run All Automated Phases
```bash
# Make scripts executable
chmod +x *.sh

# Run phases in order
./phase1-docs-cleanup.sh
./phase2-remove-legacy.sh
```

### Verify After Each Phase
```bash
# After Phase 1
tree docs/ | less

# After Phase 2
cd frontend && pnpm run build
cd .. && pnpm test
```

---

## 📋 Manual Phases

Some phases require manual execution due to complexity:

### Phase 3: Reorganize Scripts
See: `REORGANIZATION_QUICK_START.md` - Phase 3

### Phase 4: Reorganize Components
See: `REORGANIZATION_QUICK_START.md` - Phase 4
**⚠️ This is the most complex phase - do incrementally**

### Phase 5-10
Follow the Quick Start Guide for remaining phases.

---

## 🛡️ Safety Features

All scripts include:
- ✅ Automatic backup branch creation
- ✅ Git commit checkpoints
- ✅ Safety verification checks
- ✅ Detailed summary reports
- ✅ Rollback instructions

---

## 🔄 Rollback

If something goes wrong:

```bash
# View backup branches
git branch | grep backup/

# Rollback to backup
git checkout backup/docs-cleanup-YYYYMMDD-HHMMSS
```

---

## 📊 Expected Results

### After Phase 1
- `docs/` directory with organized documentation
- <10 MD files remaining in root
- Clear documentation hierarchy

### After Phase 2
- No legacy NestJS directories
- `_archive/legacy-code-YYYYMMDD/` with archived code
- Frontend still builds successfully

---

## ⚠️ Important Notes

1. **Always review changes** before committing
2. **Run tests** after each phase
3. **Keep backups** until fully validated
4. **Don't skip safety checks** in the scripts
5. **Read output carefully** - scripts provide important info

---

## 📞 Troubleshooting

### Script won't run
```bash
# Make executable
chmod +x scriptname.sh

# Check for errors
bash -x scriptname.sh
```

### "Permission denied"
```bash
# Run with explicit bash
bash scriptname.sh
```

### "Not in project root"
```bash
# Navigate to project root first
cd /path/to/Kubota-rental-platform
./scripts/reorganize/scriptname.sh
```

### Script finds active imports
- Review the imports listed
- Update them to use Supabase instead
- Run script again after fixing imports

---

## 📝 Logging

All scripts output to stdout. Capture logs:

```bash
./phase1-docs-cleanup.sh | tee phase1-output.log
```

---

## ✅ Completion Checklist

- [ ] Phase 1 script executed successfully
- [ ] Documentation structure reviewed
- [ ] Phase 1 changes committed
- [ ] Phase 2 script executed successfully
- [ ] Frontend build verified
- [ ] Phase 2 changes committed
- [ ] Manual phases planned
- [ ] Team notified of changes

---

**Created:** November 4, 2025
**Last Updated:** November 4, 2025
**Version:** 1.0

For detailed information, see:
- [CODEBASE_REORGANIZATION_PLAN.md](../../CODEBASE_REORGANIZATION_PLAN.md)
- [REORGANIZATION_QUICK_START.md](../../REORGANIZATION_QUICK_START.md)


