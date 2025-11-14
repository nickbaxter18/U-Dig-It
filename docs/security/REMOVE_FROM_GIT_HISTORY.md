# 🗑️ Remove Exposed API Key from Git History

**Priority**: HIGH
**Time Required**: 10-20 minutes
**Difficulty**: Medium

---

## ⚠️ Important Warnings

### Before You Start:
1. **This rewrites git history** - All commit hashes will change
2. **Requires force push** - Can break things for collaborators
3. **Backup first** - Create a backup branch before proceeding
4. **Coordinate with team** - If you have collaborators, tell them first
5. **GitHub may cache** - Old commits may still be visible in GitHub's cache for up to 30 days

### Is This Worth It?
- ✅ **YES** - Removes the key from git history permanently
- ✅ **YES** - Prevents future discovery by security scanners
- ⚠️ **BUT** - The key is already exposed, so regenerating it is MORE important
- ⚠️ **BUT** - GitHub keeps caches, so key may still be visible for ~30 days

**Recommendation**: Do BOTH - Regenerate the key (immediate protection) AND clean history (long-term security).

---

## 🚀 Method 1: BFG Repo-Cleaner (RECOMMENDED - Easiest & Fastest)

This is the easiest and safest method for removing sensitive data from git history.

### Step 1: Install BFG Repo-Cleaner

**macOS:**
```bash
brew install bfg
```

**Linux (Ubuntu/Debian):**
```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O ~/bfg.jar

# Make it executable
alias bfg='java -jar ~/bfg.jar'
```

**Windows:**
```bash
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Then run: java -jar bfg-1.14.0.jar
```

---

### Step 2: Create Backup

**CRITICAL: Always backup before rewriting history!**

```bash
cd /home/vscode/Kubota-rental-platform

# Create backup branch
git branch backup-before-bfg-$(date +%Y%m%d)

# Verify backup exists
git branch -a | grep backup
```

---

### Step 3: Create Replacement File

Create a file with the exposed key to be replaced:

```bash
cd /home/vscode/Kubota-rental-platform

# Create replacement file
cat > replacements.txt << 'EOF'
AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk==>***REMOVED***
EOF
```

---

### Step 4: Run BFG to Clean History

```bash
# Clean the repository
bfg --replace-text replacements.txt

# Alternative (if you want to be more aggressive):
# bfg --replace-text replacements.txt --no-blob-protection
```

**What this does:**
- Scans ALL commits in history
- Replaces the exposed API key with `***REMOVED***`
- Keeps your current files untouched (HEAD is protected by default)

---

### Step 5: Clean Up and Expire Old Objects

```bash
# Clean up the repository
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# This removes the old objects from git's internal database
```

---

### Step 6: Review Changes

```bash
# Check that the key is gone from history
git log --all --source --full-history -S "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk"

# If this returns nothing, the key is successfully removed!
```

---

### Step 7: Force Push to GitHub

⚠️ **WARNING: This rewrites history on GitHub!**

```bash
# Push to origin (force with lease is safer than --force)
git push origin --force-with-lease --all

# Push tags too
git push origin --force-with-lease --tags

# Alternative (if force-with-lease doesn't work):
# git push origin --force --all
# git push origin --force --tags
```

---

### Step 8: Verify on GitHub

1. Go to your GitHub repository
2. Search for the API key: `AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk`
3. Should show **no results** in code
4. Old commits may still show in GitHub's cache for ~24-48 hours

---

### Step 9: Notify Collaborators (If Any)

If you have collaborators, they need to re-sync:

```bash
# They should run:
git fetch origin
git reset --hard origin/main  # or master, or their branch name
```

---

## 🛠️ Method 2: Git Filter-Repo (Alternative - More Powerful)

This is more powerful but requires installation.

### Step 1: Install git-filter-repo

```bash
# macOS
brew install git-filter-repo

# Linux
pip3 install git-filter-repo
```

---

### Step 2: Create Backup

```bash
cd /home/vscode/Kubota-rental-platform
git branch backup-before-filter-$(date +%Y%m%d)
```

---

### Step 3: Run Filter-Repo

```bash
# Replace the API key in all commits
git filter-repo --replace-text <(echo "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk==>***REMOVED***")
```

---

### Step 4: Re-add Remote and Force Push

```bash
# Filter-repo removes remotes, so re-add it
git remote add origin https://github.com/nickbaxter18/Kubota-rental-platform.git

# Force push
git push origin --force-with-lease --all
git push origin --force-with-lease --tags
```

---

## 🔧 Method 3: Interactive Rebase (If Recent Commit)

**Only use this if the exposed key is in a RECENT commit (last 5-10 commits).**

### Step 1: Find the Commit

```bash
# Find which commit exposed the key
git log --all --source --full-history -S "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk" --oneline
```

**Example output:**
```
b7b01d7 Add Google Maps autocomplete to booking flow
```

---

### Step 2: Interactive Rebase

```bash
# Start interactive rebase from BEFORE that commit
# If commit is b7b01d7, use the parent commit
git rebase -i b7b01d7^

# In the editor that opens, change 'pick' to 'edit' for the problematic commit:
# edit b7b01d7 Add Google Maps autocomplete to booking flow
# Save and exit
```

---

### Step 3: Amend the Commit

```bash
# Now you're at that commit. Edit the file(s) to remove the key:
# Edit frontend/src/app/api/maps/autocomplete/route.ts (remove hardcoded key)
# Edit frontend/src/app/api/maps/distance/route.ts (remove hardcoded key)
# Edit frontend/src/app/api/maps/geocode/route.ts (remove hardcoded key)
# Edit frontend/src/components/LocationPicker.tsx (remove hardcoded key)

# (Actually, we already fixed these files, so they should be good)

# Stage the changes
git add frontend/src/app/api/maps/autocomplete/route.ts
git add frontend/src/app/api/maps/distance/route.ts
git add frontend/src/app/api/maps/geocode/route.ts
git add frontend/src/components/LocationPicker.tsx

# Amend the commit
git commit --amend --no-edit

# Continue the rebase
git rebase --continue
```

---

### Step 4: Force Push

```bash
git push origin --force-with-lease
```

---

## ✅ Verification Checklist

After cleaning git history:

- [ ] Backup branch created
- [ ] BFG or filter-repo run successfully
- [ ] Git reflog expired and gc run
- [ ] Changes force-pushed to GitHub
- [ ] Verified key not in GitHub search
- [ ] Collaborators notified (if any)
- [ ] API key regenerated in Google Cloud Console
- [ ] New key added to `.env.local`
- [ ] Application tested and working

---

## 🔍 How to Verify It Worked

### 1. Search Git History Locally:
```bash
# This should return NOTHING if successful
git log --all --source --full-history -S "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk"

# Also check with grep
git grep "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk" $(git rev-list --all)
```

### 2. Search on GitHub:
1. Go to: https://github.com/nickbaxter18/Kubota-rental-platform
2. Press `/` to open search
3. Search for: `AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk`
4. Should show **no results**

### 3. Check Specific Commit:
Go to the commit that exposed the key:
```
https://github.com/nickbaxter18/Kubota-rental-platform/commit/b7b01d75f5d1eebaac4b1a0e36a9e367f71407a1
```
- After force push, this commit hash will no longer exist!
- GitHub will show "This commit does not exist"

---

## ⚠️ Important Notes

### 1. GitHub Caching
- GitHub caches old commits for ~30 days
- The key may still appear in GitHub's search for a few days
- This is normal - it will eventually disappear

### 2. If You Have Forks
- Anyone who forked your repo still has the exposed key
- Contact GitHub Support to purge it: https://support.github.com/contact

### 3. If You Have Pull Requests
- Old PRs may still show the exposed key
- These are cached by GitHub and harder to remove

### 4. Secret Scanning Alerts
- GitHub may have already scanned and reported this
- Even after removal, the alert may persist
- Regenerating the key is the REAL fix

---

## 🎯 Recommended Approach

**Do This (In Order):**

1. ✅ **Regenerate API Key** (FIRST - Most Important!)
   - Go to Google Cloud Console
   - Regenerate the key
   - Add restrictions
   - This makes the old key useless IMMEDIATELY

2. ✅ **Clean Git History** (SECOND - For Long-term Security)
   - Use BFG Repo-Cleaner (easiest)
   - Removes key from all commits
   - Prevents future discovery

3. ✅ **Update `.env.local`** (THIRD - Get Back to Work)
   - Add new regenerated key
   - Test application
   - Continue development

**Total Time**: ~20 minutes (10 min regenerate, 10 min clean history)

---

## 🆘 Troubleshooting

### "BFG didn't remove the key"
**Solution**: Use `--no-blob-protection` flag:
```bash
bfg --replace-text replacements.txt --no-blob-protection
```

### "Force push rejected"
**Solution**: Your branch is protected. Temporarily disable branch protection on GitHub:
1. Go to Settings → Branches
2. Disable protection for `main`/`master`
3. Force push
4. Re-enable protection

### "Collaborators can't pull"
**Solution**: They need to re-clone:
```bash
# Save any uncommitted work first!
git stash

# Hard reset to match origin
git fetch origin
git reset --hard origin/main
```

### "Still seeing key on GitHub"
**Solution**: Wait 24-48 hours for GitHub's cache to clear. Or contact GitHub Support.

---

## 📞 GitHub Support (If Needed)

If the key is still visible on GitHub after 48 hours:

**Contact GitHub Support:**
- https://support.github.com/contact
- Subject: "Request to purge sensitive data from cache"
- Include: Repository URL and commit hash
- They can force-purge from their cache

---

## 🔐 Prevention for Future

### Add Pre-Commit Hook:

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Prevent committing API keys

if git diff --cached | grep -E "AIza[a-zA-Z0-9_-]{35}"; then
    echo "❌ ERROR: Google Maps API key detected!"
    echo "Remove the API key before committing."
    exit 1
fi

if git diff --cached | grep -E "sk_live_[a-zA-Z0-9]{24,}"; then
    echo "❌ ERROR: Stripe live key detected!"
    exit 1
fi

exit 0
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## ✅ Summary

| Method | Difficulty | Time | Recommended |
|--------|-----------|------|-------------|
| **BFG Repo-Cleaner** | Easy | 10 min | ✅ **YES** - Easiest |
| **git-filter-repo** | Medium | 15 min | ✅ Good alternative |
| **Interactive Rebase** | Medium | 10 min | ⚠️ Only if recent commit |

**My Recommendation**: Use **BFG Repo-Cleaner** - it's the easiest and most reliable.

---

## 🚀 Quick Command Reference

```bash
# 1. Backup
git branch backup-before-clean-$(date +%Y%m%d)

# 2. Create replacement file
echo "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk==>***REMOVED***" > replacements.txt

# 3. Run BFG
bfg --replace-text replacements.txt

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push origin --force-with-lease --all
git push origin --force-with-lease --tags

# 6. Verify
git log --all -S "AIzaSyAqGOtQHggjCf31e31uWD0lgS--sUuw7Pk"
# Should return nothing!
```

---

**Status**: Ready to clean git history
**Time Required**: 10-20 minutes
**Next Step**: Choose a method and follow the steps above

**Remember**: Regenerating the API key is MORE important than cleaning history. Do that FIRST! 🔒

