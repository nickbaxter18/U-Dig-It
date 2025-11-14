#!/bin/bash

# Install Cursor/VS Code Extensions
# This script installs all recommended extensions for the Kubota Rental Platform

echo "🚀 Installing Cursor/VS Code Extensions..."
echo ""

# Check if 'code' command is available
if ! command -v code &> /dev/null; then
    echo "❌ Error: 'code' command not found."
    echo "   Please install VS Code command line tools:"
    echo "   - Open VS Code/Cursor"
    echo "   - Press Cmd/Ctrl+Shift+P"
    echo "   - Type: 'Shell Command: Install code command in PATH'"
    exit 1
fi

# Array of extension IDs
extensions=(
    # Critical - Core Diagnostics
    "dbaeumer.vscode-eslint"
    "ms-vscode.vscode-typescript-next"
    
    # Security & Code Quality
    "snyk-security.snyk-vulnerability-scanner"
    "SonarSource.sonarlint-vscode"
    
    # Framework-Specific
    "bradlc.vscode-tailwindcss"
    "stylelint.vscode-stylelint"
    
    # Supabase & Database (NEW)
    "supabase.supabase-vscode"
    "mtxr.sqltools"
    "mtxr.sqltools-driver-pg"
    "cweijan.vscode-database-client2"
    
    # Testing
    "Orta.vscode-jest"
    "ms-playwright.playwright"
    
    # Code Quality & Productivity (NEW)
    "streetsidesoftware.code-spell-checker"
    "usernamehw.errorlens"
    "gruntfuggly.todo-tree"
    "aaron-bond.better-comments"
    "christian-kohler.path-intellisense"
    "wix.vscode-import-cost"
    
    # Git & Version Control (NEW)
    "eamodio.gitlens"
    "mhutchie.git-graph"
    
    # API Testing (NEW)
    "rangav.vscode-thunder-client"
    "humao.rest-client"
    
    # Formatting & Styling (NEW)
    "esbenp.prettier-vscode"
    "formulahendry.auto-rename-tag"
    "oderwat.indent-rainbow"
    
    # Documentation
    "davidanson.vscode-markdownlint"
    "yzhang.markdown-all-in-one"
    
    # Infrastructure
    "ms-azuretools.vscode-docker"
    "ms-vscode-remote.remote-containers"
    
    # Environment & Config (NEW)
    "mikestead.dotenv"
    "redhat.vscode-yaml"
    "ms-vscode.vscode-json"
)

# Counters
total=${#extensions[@]}
installed=0
failed=0
skipped=0

echo "📦 Installing $total extensions..."
echo ""

# Install each extension
for ext in "${extensions[@]}"; do
    echo -n "Installing $ext... "
    
    # Check if already installed
    if code --list-extensions | grep -q "^${ext}$"; then
        echo "✅ Already installed"
        ((skipped++))
    else
        # Try to install
        if code --install-extension "$ext" --force > /dev/null 2>&1; then
            echo "✅ Installed"
            ((installed++))
        else
            echo "❌ Failed"
            ((failed++))
        fi
    fi
done

echo ""
echo "=========================================="
echo "📊 Installation Summary:"
echo "   Total: $total"
echo "   ✅ Installed: $installed"
echo "   ⏭️  Skipped (already installed): $skipped"
echo "   ❌ Failed: $failed"
echo "=========================================="
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 All extensions installed successfully!"
    echo ""
    echo "💡 Next Steps:"
    echo "   1. Reload Cursor/VS Code (Cmd/Ctrl+Shift+P → 'Reload Window')"
    echo "   2. Configure Supabase extension:"
    echo "      - Cmd/Ctrl+Shift+P → 'Supabase: Add Project'"
    echo "   3. Verify Error Lens is working (check inline errors)"
    echo ""
else
    echo "⚠️  Some extensions failed to install."
    echo "   This might be normal if you're not using VS Code CLI."
    echo "   Try installing manually via Extensions panel (Cmd/Ctrl+Shift+X)"
    echo ""
fi


