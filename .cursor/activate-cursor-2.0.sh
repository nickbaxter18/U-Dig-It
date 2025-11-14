#!/bin/bash

#############################################################
# Cursor 2.0 - Maximum Engineering Power Activation Script
# Kubota Rental Platform
#############################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fancy header
print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║        🚀  CURSOR 2.0 ACTIVATION & CONFIGURATION  🚀         ║"
    echo "║                                                               ║"
    echo "║            Maximum Software Engineering Power                 ║"
    echo "║                 Kubota Rental Platform                        ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# Print section header
section() {
    echo ""
    echo -e "${MAGENTA}▶ $1${NC}"
    echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
}

# Print success message
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print warning message
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print error message
error() {
    echo -e "${RED}✗${NC} $1"
}

# Print info message
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running in Cursor
check_cursor() {
    if [ -z "$VSCODE_IPC_HOOK_CLI" ] && [ -z "$CURSOR" ]; then
        warning "This script is optimized for Cursor IDE"
        info "Some features may not work in other editors"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Verify configuration files
verify_configs() {
    section "📁 Verifying Configuration Files"

    local configs=(
        "cursor-2.0-config.json"
        "parallel-agents-config.json"
        "model-switching-rules.json"
        "voice-commands.json"
        "CURSOR-2.0-SETUP-GUIDE.md"
        "KEYBOARD-SHORTCUTS.md"
    )

    local all_present=true

    for config in "${configs[@]}"; do
        if [ -f ".cursor/$config" ]; then
            success "$config"
        else
            error "$config - MISSING!"
            all_present=false
        fi
    done

    echo ""
    if [ "$all_present" = true ]; then
        success "All configuration files present"
    else
        error "Some configuration files are missing"
        info "Please ensure you have the complete Cursor 2.0 setup"
        exit 1
    fi
}

# Check Node.js and dependencies
check_dependencies() {
    section "🔧 Checking Dependencies"

    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        success "Node.js $node_version"
    else
        warning "Node.js not found"
    fi

    # Check npm/pnpm
    if command -v pnpm &> /dev/null; then
        local pnpm_version=$(pnpm --version)
        success "pnpm $pnpm_version"
    elif command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        success "npm $npm_version"
    else
        warning "Package manager not found"
    fi

    # Check Git
    if command -v git &> /dev/null; then
        local git_version=$(git --version)
        success "Git $git_version"
    else
        warning "Git not found"
    fi
}

# Display feature overview
show_features() {
    section "✨ Cursor 2.0 Features Configured"

    echo ""
    echo -e "${GREEN}1. Composer 1 - Multi-Agent Interface${NC}"
    echo "   • Context-aware code generation"
    echo "   • Multi-file editing capabilities"
    echo "   • Intelligent refactoring"
    echo "   • Auto-imports and optimizations"
    echo ""

    echo -e "${GREEN}2. Parallel Agents${NC}"
    echo "   • Full-Stack Feature Development (4 agents)"
    echo "   • Bug Fixing Workflow (3 agents)"
    echo "   • Codebase Refactoring (4 agents)"
    echo "   • Performance Optimization (4 agents)"
    echo "   • Security Audit (4 agents)"
    echo ""

    echo -e "${GREEN}3. Voice Input${NC}"
    echo "   • Push-to-talk: Ctrl+Shift+V"
    echo "   • Natural language commands"
    echo "   • Code dictation mode"
    echo "   • Project-specific vocabulary"
    echo ""

    echo -e "${GREEN}4. Intelligent Model Selection${NC}"
    echo "   • Claude Sonnet 4.5 (complex tasks)"
    echo "   • GPT-4 Turbo (testing, docs)"
    echo "   • Auto-switching based on context"
    echo "   • Cost optimization"
    echo ""
}

# Display keyboard shortcuts
show_shortcuts() {
    section "⌨️  Essential Keyboard Shortcuts"

    echo ""
    echo -e "${CYAN}Composer:${NC}"
    echo "  Ctrl+Shift+C      Open Composer"
    echo "  Ctrl+Enter        Accept changes"
    echo "  Ctrl+Shift+R      Reject changes"
    echo ""

    echo -e "${CYAN}Parallel Agents:${NC}"
    echo "  Ctrl+Shift+N      New agent"
    echo "  Ctrl+Tab          Switch agent"
    echo "  Ctrl+Shift+M      Merge results"
    echo "  Ctrl+Shift+A      View all agents"
    echo ""

    echo -e "${CYAN}Voice:${NC}"
    echo "  Ctrl+Shift+V      Push-to-talk"
    echo "  Alt+V             Toggle continuous"
    echo ""

    echo -e "${CYAN}AI Operations:${NC}"
    echo "  Ctrl+K Ctrl+I     Inline chat"
    echo "  Ctrl+Shift+T      Generate tests"
    echo "  Ctrl+Shift+E      Explain code"
    echo ""

    info "Full shortcuts reference: .cursor/KEYBOARD-SHORTCUTS.md"
}

# Create workspace settings
create_workspace_settings() {
    section "⚙️  Creating Workspace Settings"

    local settings_file=".vscode/settings.json"

    # Create .vscode directory if it doesn't exist
    mkdir -p .vscode

    # Check if settings file exists
    if [ -f "$settings_file" ]; then
        info "Workspace settings already exist"
        info "Backing up to .vscode/settings.json.backup"
        cp "$settings_file" "$settings_file.backup"
    fi

    # Create optimized settings
    cat > "$settings_file" << 'EOF'
{
  "cursor.ai.enabled": true,
  "cursor.composer.enabled": true,
  "cursor.parallelAgents.enabled": true,
  "cursor.voice.enabled": true,
  "cursor.modelSelection.auto": true,

  "cursor.composer.maxTokens": 1000000,
  "cursor.composer.model": "claude-sonnet-4.5",
  "cursor.composer.fallbackModel": "gpt-4-turbo",
  "cursor.composer.multiFileEditing": true,
  "cursor.composer.contextualAwareness": true,

  "cursor.parallelAgents.maxConcurrent": 4,
  "cursor.parallelAgents.useWorktrees": true,
  "cursor.parallelAgents.autoMerge": false,

  "cursor.voice.pushToTalk": true,
  "cursor.voice.hotkey": "Ctrl+Shift+V",
  "cursor.voice.accuracy": "high",

  "cursor.modelSelection.autoSwitch": true,
  "cursor.modelSelection.contextAware": true,
  "cursor.modelSelection.trackPerformance": true,

  "editor.inlineSuggest.enabled": true,
  "editor.suggest.preview": true,
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  },

  "files.associations": {
    "*.mdc": "markdown"
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.cursor/worktrees": true
  }
}
EOF

    success "Workspace settings created/updated"
}

# Show quick start guide
show_quick_start() {
    section "🚀 Quick Start Guide"

    echo ""
    echo -e "${GREEN}1. Try Composer${NC}"
    echo "   Press: Ctrl+Shift+C"
    echo "   Type:  \"Create a simple React component\""
    echo "   Press: Ctrl+Enter to accept"
    echo ""

    echo -e "${GREEN}2. Try Voice Commands${NC}"
    echo "   Press and hold: Ctrl+Shift+V"
    echo "   Say:  \"Open file BookingForm\""
    echo "   Release to execute"
    echo ""

    echo -e "${GREEN}3. Try Parallel Agents${NC}"
    echo "   Press: Ctrl+Shift+C"
    echo "   Type:  \"Start parallel workflow bugFixing for payment issue\""
    echo "   Press: Ctrl+Shift+A to monitor progress"
    echo "   Press: Ctrl+Shift+M to merge when ready"
    echo ""

    echo -e "${GREEN}4. Read the Full Guide${NC}"
    echo "   Open: .cursor/CURSOR-2.0-SETUP-GUIDE.md"
    echo "   Or:   Ctrl+P → \"setup guide\""
    echo ""
}

# Show example workflows
show_examples() {
    section "💡 Example Workflows"

    echo ""
    echo -e "${YELLOW}Example 1: Add a New Feature${NC}"
    echo "  1. Ctrl+Shift+C"
    echo "  2. \"Start parallel workflow fullStackFeature for email notifications\""
    echo "  3. Wait for 4 agents to complete work"
    echo "  4. Ctrl+Shift+M to merge"
    echo "  Result: Frontend + Backend + Tests + Docs in 1/4 the time"
    echo ""

    echo -e "${YELLOW}Example 2: Fix a Bug${NC}"
    echo "  1. Ctrl+Shift+V (voice)"
    echo "  2. \"Start parallel workflow bugFixing for checkout error\""
    echo "  3. Review AI analysis"
    echo "  4. Ctrl+Enter to accept fix"
    echo "  Result: Root cause found and fixed with tests"
    echo ""

    echo -e "${YELLOW}Example 3: Optimize Performance${NC}"
    echo "  1. Ctrl+Shift+C"
    echo "  2. \"Start parallel workflow performanceOptimization for dashboard\""
    echo "  3. Agents work on frontend, backend, and database simultaneously"
    echo "  4. Review and merge improvements"
    echo "  Result: 5x faster load times"
    echo ""
}

# Setup git hooks
setup_git_hooks() {
    section "🪝 Setting Up Git Integration"

    if [ -d ".git" ]; then
        # Create pre-commit hook for AI code review
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Cursor 2.0 - AI Code Review Hook
# This hook runs AI-powered code review before commit

echo "🤖 Running AI code review..."

# Check if Cursor AI is available
if command -v cursor &> /dev/null; then
    # Run AI review on staged files
    cursor ai review-staged
else
    echo "⚠️  Cursor not found, skipping AI review"
fi

exit 0
EOF

        chmod +x .git/hooks/pre-commit
        success "Git hooks configured"
    else
        warning "Not a git repository, skipping git hooks"
    fi
}

# Performance optimization
optimize_performance() {
    section "⚡ Performance Optimization"

    info "Configuring optimal performance settings..."

    # Clear any existing AI caches
    if [ -d ".cursor/cache" ]; then
        info "Clearing AI cache for fresh start"
        rm -rf .cursor/cache
        mkdir -p .cursor/cache
    fi

    # Create worktrees directory
    if [ ! -d ".cursor/worktrees" ]; then
        mkdir -p .cursor/worktrees
        success "Created worktrees directory"
    fi

    # Add to .gitignore if needed
    if ! grep -q ".cursor/worktrees" .gitignore 2>/dev/null; then
        echo ".cursor/worktrees/" >> .gitignore
        echo ".cursor/cache/" >> .gitignore
        success "Updated .gitignore"
    fi
}

# Create quick reference card
create_reference_card() {
    section "📋 Creating Quick Reference Card"

    cat > .cursor/QUICK-REFERENCE.txt << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                  CURSOR 2.0 QUICK REFERENCE                       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  COMPOSER (Multi-Agent AI)                                        ║
║  ├─ Open:           Ctrl+Shift+C                                  ║
║  ├─ Accept:         Ctrl+Enter                                    ║
║  ├─ Reject:         Ctrl+Shift+R                                  ║
║  └─ Explain:        Ctrl+Shift+E                                  ║
║                                                                   ║
║  PARALLEL AGENTS                                                  ║
║  ├─ New Agent:      Ctrl+Shift+N                                  ║
║  ├─ Switch:         Ctrl+Tab                                      ║
║  ├─ Merge:          Ctrl+Shift+M                                  ║
║  └─ View All:       Ctrl+Shift+A                                  ║
║                                                                   ║
║  VOICE INPUT                                                      ║
║  ├─ Push-to-Talk:   Ctrl+Shift+V (hold)                           ║
║  ├─ Toggle:         Alt+V                                         ║
║  └─ Cancel:         Escape                                        ║
║                                                                   ║
║  COMMON WORKFLOWS                                                 ║
║  ├─ "Start parallel workflow fullStackFeature"                    ║
║  ├─ "Start parallel workflow bugFixing"                           ║
║  ├─ "Generate tests for [component]"                              ║
║  ├─ "Refactor [target] to [pattern]"                              ║
║  └─ "Optimize performance for [feature]"                          ║
║                                                                   ║
║  DOCUMENTATION                                                    ║
║  ├─ Full Guide:     .cursor/CURSOR-2.0-SETUP-GUIDE.md             ║
║  ├─ Shortcuts:      .cursor/KEYBOARD-SHORTCUTS.md                 ║
║  └─ Workflows:      .cursor/parallel-agents-config.json           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

    success "Quick reference card created: .cursor/QUICK-REFERENCE.txt"
}

# Final summary
show_summary() {
    section "📊 Configuration Summary"

    echo ""
    success "Cursor 2.0 is configured and ready!"
    echo ""

    echo -e "${GREEN}Configured Features:${NC}"
    echo "  ✓ Composer 1 (Multi-Agent Interface)"
    echo "  ✓ Parallel Agents (5 pre-built workflows)"
    echo "  ✓ Voice Input (Push-to-talk enabled)"
    echo "  ✓ Intelligent Model Selection"
    echo "  ✓ Workspace Optimization"
    echo ""

    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Restart Cursor to apply all settings"
    echo "  2. Read: .cursor/CURSOR-2.0-SETUP-GUIDE.md"
    echo "  3. Try: Ctrl+Shift+C for first Composer session"
    echo "  4. Print: .cursor/KEYBOARD-SHORTCUTS.md"
    echo ""

    echo -e "${YELLOW}Pro Tip:${NC}"
    echo "  Start with simple tasks to learn the features,"
    echo "  then gradually increase complexity. The AI learns"
    echo "  from your codebase and gets better over time!"
    echo ""

    echo -e "${MAGENTA}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}              🎉 SETUP COMPLETE! 🎉${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Main execution
main() {
    print_header
    check_cursor
    verify_configs
    check_dependencies
    create_workspace_settings
    optimize_performance
    setup_git_hooks
    create_reference_card
    show_features
    show_shortcuts
    show_quick_start
    show_examples
    show_summary

    # Prompt to open guide
    echo -n "Would you like to open the full setup guide now? (y/n) "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v cursor &> /dev/null; then
            cursor .cursor/CURSOR-2.0-SETUP-GUIDE.md
        elif command -v code &> /dev/null; then
            code .cursor/CURSOR-2.0-SETUP-GUIDE.md
        else
            info "Please open .cursor/CURSOR-2.0-SETUP-GUIDE.md manually"
        fi
    fi

    echo ""
    echo -e "${GREEN}Happy coding with Cursor 2.0! 🚀${NC}"
    echo ""
}

# Run main function
main

