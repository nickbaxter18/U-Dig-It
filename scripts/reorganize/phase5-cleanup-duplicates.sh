#!/bin/bash

# Phase 5: Clean Duplicate Files
# This script removes .backup, .preview, and other duplicate files

set -e  # Exit on error

echo "🧹 Starting Phase 5: Clean Duplicate Files"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Safety check
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup branch...${NC}"
git checkout -b backup/cleanup-duplicates-$(date +%Y%m%d-%H%M%S) || true
git add . || true
git commit -m "Backup before cleaning duplicates" || true

# Find and list duplicate files
echo -e "${YELLOW}Scanning for duplicate files...${NC}"
echo ""

duplicates_found=0

# Find .backup files
echo "🔍 Searching for .backup files..."
backup_files=$(find . -type f -name "*.backup.*" -o -name "*.backup" | grep -v node_modules | grep -v .git || true)
if [ -n "$backup_files" ]; then
    echo "$backup_files"
    duplicates_found=$((duplicates_found + $(echo "$backup_files" | wc -l)))
fi

# Find .preview files
echo ""
echo "🔍 Searching for .preview files..."
preview_files=$(find . -type f -name "*.preview.*" | grep -v node_modules | grep -v .git || true)
if [ -n "$preview_files" ]; then
    echo "$preview_files"
    duplicates_found=$((duplicates_found + $(echo "$preview_files" | wc -l)))
fi

# Find .old files
echo ""
echo "🔍 Searching for .old files..."
old_files=$(find . -type f -name "*.old" -o -name "*.old.*" | grep -v node_modules | grep -v .git || true)
if [ -n "$old_files" ]; then
    echo "$old_files"
    duplicates_found=$((duplicates_found + $(echo "$old_files" | wc -l)))
fi

# Find specific known duplicates
echo ""
echo "🔍 Searching for known duplicate components..."
known_duplicates=(
    "frontend/src/components/EquipmentShowcase.backup.tsx"
    "frontend/src/components/EquipmentShowcase.preview.tsx"
    "frontend/src/lib/mock-api.ts.backup"
    "frontend/src/components/EnhancedBookingFlowV2.tsx"  # V2 is duplicate if V1 exists
)

for file in "${known_duplicates[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
        duplicates_found=$((duplicates_found + 1))
    fi
done

echo ""
echo -e "${YELLOW}Found $duplicates_found duplicate files${NC}"

if [ $duplicates_found -eq 0 ]; then
    echo -e "${GREEN}No duplicates found! Codebase is clean.${NC}"
    exit 0
fi

# Ask for confirmation
echo ""
echo -e "${RED}⚠️  WARNING: This will DELETE the files listed above${NC}"
echo -e "${YELLOW}Do you want to continue? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Create archive directory for deleted files (just in case)
archive_dir="_archive/duplicates-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$archive_dir"

# Remove backup files
echo ""
echo -e "${GREEN}Removing .backup files...${NC}"
if [ -n "$backup_files" ]; then
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "  Archiving: $file"
            mkdir -p "$archive_dir/$(dirname "$file")"
            mv "$file" "$archive_dir/$file"
        fi
    done <<< "$backup_files"
fi

# Remove preview files
echo ""
echo -e "${GREEN}Removing .preview files...${NC}"
if [ -n "$preview_files" ]; then
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "  Archiving: $file"
            mkdir -p "$archive_dir/$(dirname "$file")"
            mv "$file" "$archive_dir/$file"
        fi
    done <<< "$preview_files"
fi

# Remove old files
echo ""
echo -e "${GREEN}Removing .old files...${NC}"
if [ -n "$old_files" ]; then
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "  Archiving: $file"
            mkdir -p "$archive_dir/$(dirname "$file")"
            mv "$file" "$archive_dir/$file"
        fi
    done <<< "$old_files"
fi

# Remove known duplicates
echo ""
echo -e "${GREEN}Removing known duplicate components...${NC}"
for file in "${known_duplicates[@]}"; do
    if [ -f "$file" ]; then
        echo "  Archiving: $file"
        mkdir -p "$archive_dir/$(dirname "$file")"
        mv "$file" "$archive_dir/$file"
    fi
done

# Create archive README
cat > "$archive_dir/README.md" << EOF
# Duplicate Files Archive

**Archived:** $(date +"%Y-%m-%d %H:%M:%S")
**Reason:** Cleanup of duplicate/backup files during codebase reorganization

## Files Archived

These files were duplicates with .backup, .preview, or .old extensions:

$(find "$archive_dir" -type f -not -name "README.md" | sed 's|^|  - |')

## Recovery

If you need to recover any of these files:

\`\`\`bash
# Copy from archive
cp $archive_dir/path/to/file ./path/to/file
\`\`\`

However, these files should not be needed as they are duplicates of existing files.

## Why Were These Removed?

- Reduce codebase clutter
- Eliminate confusion about which file is "active"
- Improve navigation and searchability
- Follow single source of truth principle

The active, canonical versions of these files remain in the codebase.

---

**Safe to delete this archive after verification (1 week retention recommended)**
EOF

# Summary
echo ""
echo -e "${GREEN}✅ Phase 5 Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "==========="
archived_count=$(find "$archive_dir" -type f -not -name "README.md" | wc -l)
echo "Files archived: $archived_count"
echo "Archive location: $archive_dir"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Verify application still works: cd frontend && pnpm run dev"
echo "2. Check for any broken imports: pnpm run type-check"
echo "3. Run tests: pnpm test"
echo "4. If everything works, commit:"
echo "   git add ."
echo "   git commit -m 'Phase 5: Clean duplicate files'"
echo "5. After 1 week, can delete archive if no issues"
echo ""
echo -e "${YELLOW}Archived files saved in: $archive_dir${NC}"
echo -e "${YELLOW}Can rollback with: git checkout backup/cleanup-duplicates-*${NC}"


