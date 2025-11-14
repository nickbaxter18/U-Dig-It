# 🚀 KUBOTA RENTAL PLATFORM - CURSOR SETUP

## 🎯 BULLETPROOF FRONTEND AUTO-START SYSTEM

This directory contains a comprehensive, bulletproof system that **GUARANTEES** the frontend starts automatically when Cursor opens.

### 📋 COMPONENTS

- **`startup.sh`** - Main startup script with 4 fallback methods
- **`terminal-config.sh`** - Terminal configuration and aliases
- **`ai-assistant.sh`** - AI helper functions and commands
- **`vscode-settings.json`** - VS Code/Cursor terminal profiles
- **`tasks.json`** - VS Code tasks for manual startup
- **`.vscode/settings.json`** - Workspace-specific VS Code settings

### 🔧 HOW IT WORKS - 4 LAYERS OF PROTECTION

#### **Layer 1: VS Code Tasks (Primary)**
- VS Code tasks run automatically when workspace opens
- Configured in `.vscode/tasks.json`
- Runs `Frontend Auto-Start` task on folder open

#### **Layer 2: Terminal Profile (Secondary)**
- Enhanced bash profile executes startup script
- Works in both Cursor and VS Code
- Configured in `.cursor/vscode-settings.json` and `.vscode/settings.json`

#### **Layer 3: Manual Commands (Tertiary)**
- Easy-to-remember commands in terminal
- `dev` - Start frontend only
- `pnpm dev` - Start full development stack
- `start-dev` - AI function for starting servers

#### **Layer 4: Fallback Detection (Emergency)**
- Startup script detects if frontend failed to start
- Provides manual commands and troubleshooting
- Logs all startup attempts for debugging

### 🚀 QUICK START

1. **Open Cursor** - Frontend should start automatically
2. **If not working**: Run `dev` in terminal
3. **Verify**: Visit http://localhost:3000
4. **Debug**: Run `.cursor/verify.sh` for diagnostics

### 🔍 TROUBLESHOOTING

#### **Frontend not starting?**

```bash
# Method 1: Use the dev command
dev

# Method 2: Use workspace filter
pnpm --filter @kubota-rental/web run dev

# Method 3: Direct approach
cd apps/web && pnpm run dev

# Method 4: Check if running
curl http://localhost:3000
```

#### **Check startup logs:**
```bash
# Terminal startup logs
cat /tmp/frontend.log 2>/dev/null || echo "No frontend logs"

# Alternative logs
cat /tmp/frontend-alt.log 2>/dev/null || echo "No alternative logs"

# Process status
ps aux | grep next
```

#### **Force restart everything:**
```bash
# Kill all development servers
pkill -f "next\|node"

# Start fresh
pnpm dev
```

### ⚙️ CONFIGURATION DETAILS

#### **Workspace Detection (4 Methods)**
1. **Current Directory** - If already in workspace root
2. **Dev Container** - `/workspace` path detection
3. **Local Development** - `/home/vscode/Kubota-rental-platform` path
4. **Auto-Discovery** - Walk up directory tree from current location

#### **Frontend Startup (3 Methods)**
1. **Workspace Filter** - `pnpm --filter @kubota-rental/web run dev`
2. **Direct Directory** - `cd apps/web && pnpm run dev`
3. **Root Command** - `pnpm run dev:frontend`

#### **Verification Steps**
- HTTP health check on port 3000
- Process monitoring with PID tracking
- Automatic retry with alternative methods
- Clear success/failure reporting

### 🎯 VERIFICATION

Run the verification script to ensure everything is working:

```bash
.cursor/verify.sh
```

This will:
- ✅ Check if frontend is running
- ✅ Verify workspace configuration
- ✅ Test terminal setup
- ✅ Validate VS Code settings
- ✅ Provide troubleshooting steps

### 🔄 MANUAL OVERRIDE

If auto-start fails completely:

```bash
# 1. Kill any existing processes
pkill -f "next\|node"

# 2. Navigate to project root
cd /path/to/project

# 3. Install dependencies (if needed)
pnpm install

# 4. Start frontend
pnpm --filter @kubota-rental/web run dev

# 5. Start backend (if needed)
pnpm --filter @kubota-rental/api run start:dev
```

### 📞 SUPPORT

If the bulletproof system still fails:

1. **Check logs**: `cat /tmp/frontend.log`
2. **Run verification**: `.cursor/verify.sh`
3. **Check VS Code tasks**: Terminal > Run Task > "Frontend Auto-Start"
4. **Manual fallback**: Use commands above

**This system is designed to work 100% of the time in any Cursor/VS Code environment.**