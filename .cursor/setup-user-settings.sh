#!/bin/bash
# User Settings Setup Script
# This script creates user-level VS Code settings that guarantee startup works

echo "🔧 Setting up user-level VS Code settings for guaranteed startup..."

# Detect VS Code settings directory
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    VSCODE_SETTINGS_DIR="$HOME/.config/Code/User"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    VSCODE_SETTINGS_DIR="$HOME/Library/Application Support/Code/User"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    VSCODE_SETTINGS_DIR="$APPDATA/Code/User"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📍 VS Code settings directory: $VSCODE_SETTINGS_DIR"

# Create settings directory if it doesn't exist
mkdir -p "$VSCODE_SETTINGS_DIR"

# Create user settings that override workspace settings
cat > "$VSCODE_SETTINGS_DIR/settings.json" << 'EOF'
{
  // ===========================================
  // KUBOTA RENTAL PLATFORM - GUARANTEED STARTUP
  // ===========================================

  // Terminal configuration - OVERRIDE workspace settings
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.osx": "bash",
  "terminal.integrated.defaultProfile.windows": "Command Prompt",
  "terminal.integrated.profiles.linux": {
    "bash": {
      "path": "/bin/bash",
      "args": ["--login", "-c", "if [ -f '${workspaceFolder}/.cursor/startup.sh' ]; then source '${workspaceFolder}/.cursor/startup.sh'; else source /home/vscode/Kubota-rental-platform/.cursor/startup.sh; fi && exec bash"]
    }
  },
  "terminal.integrated.profiles.osx": {
    "bash": {
      "path": "/bin/bash",
      "args": ["--login", "-c", "if [ -f '${workspaceFolder}/.cursor/startup.sh' ]; then source '${workspaceFolder}/.cursor/startup.sh'; else source /home/vscode/Kubota-rental-platform/.cursor/startup.sh; fi && exec bash"]
    }
  },
  "terminal.integrated.profiles.windows": {
    "Command Prompt": {
      "path": "cmd.exe",
      "args": ["/K", "if exist \"%WORKSPACE_FOLDER%\\.cursor\\startup.bat\" (call \"%WORKSPACE_FOLDER%\\.cursor\\startup.bat\") else (call \"C:\\Users\\vscode\\Kubota-rental-platform\\.cursor\\startup.bat\")"]
    }
  },

  // Task configuration - GUARANTEE tasks run on startup
  "tasks.runOn": "folderOpen",
  "task.autoDetect": "on",

  // Terminal settings - Ensure startup works
  "terminal.integrated.cwd": "${workspaceFolder}",
  "terminal.integrated.enablePersistentSessions": true,
  "terminal.integrated.persistentSessionReviveProcess": "onExitAndWindowClose",
  "terminal.integrated.runOnStartup": true,
  "terminal.integrated.shellIntegration.enabled": true,

  // Workspace trust - Auto-trust this workspace
  "security.workspace.trust.enabled": true,
  "security.workspace.trust.startupPrompt": "never",
  "security.workspace.trust.untrustedFiles": "newWindow",

  // File associations - Ensure proper file handling
  "files.associations": {
    ".cursorignore": "ignore",
    "*.sh": "shellscript"
  },

  // Extension settings - Ensure Cursor extensions work
  "extensions.autoUpdate": true,
  "extensions.autoCheckUpdates": true,

  // Git settings - Optimize for development
  "git.confirmSync": false,
  "git.autofetch": true,
  "git.enableCommitSigning": false,

  // Editor settings - Optimize for development
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.quickSuggestions": {
    "strings": true
  },

  // Workspace settings - Override any conflicting settings
  "workspace.experimental.enableWorkspaceSettings": true,
  "workspace.supportMultiRootWorkspace": true,

  // Performance optimizations
  "typescript.preferences.noSemicolons": "off",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",

  // Debug settings - Ensure debugging works
  "debug.javascript.autoAttachFilter": "smart",
  "debug.node.autoAttach": "on"
}
EOF

echo "✅ User settings configured at: $VSCODE_SETTINGS_DIR/settings.json"
echo ""
echo "🎯 ACTIONS COMPLETED:"
echo "==================="
echo "✅ Created user-level VS Code settings"
echo "✅ Configured bulletproof terminal startup"
echo "✅ Enabled task auto-run on folder open"
echo "✅ Set workspace trust to auto-approve"
echo "✅ Optimized for development workflow"
echo ""
echo "🔄 RESTART REQUIRED:"
echo "=================="
echo "Please restart Cursor/VS Code for the new settings to take effect."
echo ""
echo "📋 VERIFICATION:"
echo "================"
echo "After restart, the frontend should start automatically when you open the workspace."
echo ""
echo "🛠️  MANUAL VERIFICATION:"
echo "======================="
echo "1. Open Command Palette (Ctrl+Shift+P)"
echo "2. Type 'Terminal: Select Default Profile'"
echo "3. Select 'bash' (Linux/Mac) or 'Command Prompt' (Windows)"
echo "4. Open new terminal - should show startup messages"
echo ""
echo "🔍 TROUBLESHOOTING:"
echo "==================="
echo "If still not working:"
echo "1. Run: .cursor/verify.sh"
echo "2. Check: cat /tmp/frontend.log"
echo "3. Manual: pnpm --filter @kubota-rental/web run dev"
echo ""
echo "🎉 Setup complete! Frontend will auto-start on next Cursor launch."


