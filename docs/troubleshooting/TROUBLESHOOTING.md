# Troubleshooting Guide - Kubota Rental Platform

This guide covers solutions to common issues encountered during development.

---

## 🔴 Critical Issues

### Issue 1: Backend Fails to Start - Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```

**Root Cause:** A previous backend process is still running on port 3001, often as a zombie (defunct) process.

**Solution:**

```bash
# Method 1: Kill by process name
ps aux | grep "nest" | grep -v grep | awk '{print $2}' | xargs kill -9
sleep 2

# Method 2: Kill specific process
ps aux | grep "node.*main.minimal" | grep -v grep | awk '{print $2}' | xargs kill -9
sleep 2

# Method 3: Kill all node processes (nuclear option)
pkill -9 -f nest
sleep 2

# Verify port is free
netstat -tlnp 2>/dev/null | grep 3001 || echo "Port 3001 is free"

# Restart backend
cd backend && npm run start:minimal
```

**Prevention:** Always properly stop the backend with `Ctrl+C` before restarting. If processes become zombies, use `kill -9` to force termination.

---

### Issue 2: Supabase Connection Fails - "TypeError: fetch failed"

**Error Message:**
```
TypeError: fetch failed
at node:internal/deps/undici/undici:14900:13
```

**Root Cause:** Node.js's built-in `fetch` (undici) has SSL/TLS compatibility issues in Docker containers when connecting to Supabase.

**Solution:**

1. **Install cross-fetch:**
```bash
cd backend
npm install cross-fetch --save
```

2. **Update `backend/src/supabase/supabase.service.ts`:**
```typescript
import fetch from 'cross-fetch';

// In the createClient call:
this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  global: {
    fetch: fetch, // Use cross-fetch instead of native fetch
  },
});
```

3. **Set environment variable (development only):**
```bash
# In backend/.env
NODE_TLS_REJECT_UNAUTHORIZED=0
```

4. **Restart backend**

**Verification:**
```bash
curl http://localhost:3001/health/test-supabase
# Should return: {"success":true,"data":[{"count":0}],"error":null}
```

---

### Issue 3: Environment Variables Not Loading

**Symptoms:**
- Backend shows placeholder values like `https://your-project-ref.supabase.co`
- Keys show as `sbp_936f438fa5daa951...` (placeholder)

**Root Cause:** The `.env` file doesn't exist in the backend directory, or environment variables aren't being loaded.

**Solution:**

1. **Verify `.env` file exists:**
```bash
ls -la backend/.env
```

2. **If missing, create it:**
```bash
cd backend
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
STRIPE_SECRET_KEY=your_actual_stripe_key
EOF
```

3. **Restart backend completely:**
```bash
pkill -9 -f nest
sleep 3
cd backend && npm run start:minimal
```

4. **Verify configuration loaded:**
```bash
# Check backend logs for actual URL (not placeholder)
# Should show: 🔧 SUPABASE_URL: https://bnimazxnqligusckahab.supabase.co
```

---

## ⚠️ Common Issues

### Issue: File Watcher Limit Reached

**Error Message:**
```
Error: ENOSPC: System limit for number of file watchers reached
```

**Solution:**
```bash
# Increase file watcher limit (requires sudo)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Alternative:** Use `start:minimal` instead of `start:dev` to avoid file watching.

---

### Issue: Images Return 404 Errors

**Symptoms:**
- Logo, equipment images, or family photos don't display
- Browser console shows 404 errors for `/images/...` paths

**Solution:**

1. **Verify images exist:**
```bash
ls -la frontend/public/images/
```

2. **If missing, copy images:**
```bash
# Company logo
cp "b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG" frontend/public/images/udigit-logo.png

# Kubota equipment
cp kubota.png frontend/public/images/kubota-svl-75-hero.png

# Family photos
cp Father-Son-Bucket.webp frontend/public/images/
cp kid-on-tractor.webp frontend/public/images/
```

3. **Verify image paths in components:**
```tsx
// Correct path (relative to public directory)
<Image src="/images/udigit-logo.png" ... />

// WRONG - Don't include "public" in path
<Image src="/public/images/udigit-logo.png" ... />
```

4. **Test image loading:**
```bash
curl -I http://localhost:3000/images/udigit-logo.png
# Should return: HTTP/1.1 200 OK
```

---

### Issue: Hydration Mismatch Errors

**Error Message:**
```
Warning: Prop `className` did not match. Server: "..." Client: "..."
```

**Root Cause:** Server-rendered HTML doesn't match client-rendered HTML, often due to:
- Random values generated during SSR
- Browser-only APIs called during SSR
- Conditional rendering based on client state

**Solution:**

1. **Use `useEffect` for client-only code:**
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // or return server version
```

2. **Suppress specific warnings (if known safe):**
```tsx
<div suppressHydrationWarning>
  {/* Content that differs between server and client */}
</div>
```

3. **Check for dynamic classes or random IDs**

---

## 🔧 Development Workflows

### Clean Restart - Everything

```bash
# Stop all services
pkill -9 -f nest
pkill -9 -f next

# Clear node_modules if needed (nuclear option)
# rm -rf frontend/node_modules backend/node_modules
# cd frontend && npm install
# cd ../backend && npm install

# Restart frontend
cd frontend && npm run dev &

# Wait for frontend to start
sleep 5

# Restart backend
cd ../backend && npm run start:minimal &

# Verify both running
curl http://localhost:3000
curl http://localhost:3001/health
```

### Database Issues - Reset Connection

```bash
# Kill backend
pkill -9 -f nest
sleep 2

# Verify environment variables
cat backend/.env | grep SUPABASE

# Test connection directly (curl should work)
curl -v https://bnimazxnqligusckahab.supabase.co/rest/v1/

# Restart backend
cd backend && npm run start:minimal

# Test Supabase endpoint
curl http://localhost:3001/health/test-supabase
```

---

## 🔍 Debugging Commands

### Check Running Processes
```bash
# All node processes
ps aux | grep node | grep -v grep

# Backend specifically
ps aux | grep nest | grep -v grep

# Frontend specifically
ps aux | grep next | grep -v grep

# Check ports in use
netstat -tlnp | grep -E ":(3000|3001)"
```

### Test Network Connectivity
```bash
# Test if Node.js fetch works
node -e "fetch('https://bnimazxnqligusckahab.supabase.co/rest/v1/').then(r => console.log('✅', r.status)).catch(e => console.log('❌', e.message))"

# Test with curl
curl -I https://bnimazxnqligusckahab.supabase.co/rest/v1/

# Test DNS resolution
getent hosts bnimazxnqligusckahab.supabase.co
```

### View Logs
```bash
# Backend logs (real-time)
cd backend && npm run start:minimal
# Logs will stream to console

# Frontend logs
cd frontend && npm run dev
# Logs will stream to console

# Check specific log files (if configured)
tail -f backend/logs/*.log
```

---

## 📦 Dependency Issues

### Issue: Module Not Found Errors

**Solution:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install

# Clear npm cache if persistent
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Peer Dependency Warnings

**Note:** Peer dependency warnings are common and usually don't affect functionality. Only address if they cause runtime errors.

**Solution if needed:**
```bash
npm install --legacy-peer-deps
```

---

## 🔑 API Key Verification

### Verify Supabase Keys
```bash
# Check configuration
cat backend/.env | grep SUPABASE

# Test with MCP tools (if available)
# This verifies the keys work
curl http://localhost:3001/health/test-supabase
```

### Verify Stripe Keys
```bash
# Check configuration
cat backend/.env | grep STRIPE

# Test Stripe connection (may show permissions warning - this is OK)
curl http://localhost:3001/health/detailed
```

---

## 🚨 Emergency Recovery

If everything is broken and you need to start fresh:

```bash
#!/bin/bash
# emergency-reset.sh

echo "🚨 Emergency Reset - Kubota Rental Platform"

# 1. Kill all processes
echo "1. Stopping all services..."
pkill -9 -f nest
pkill -9 -f next
sleep 3

# 2. Verify environment files exist
echo "2. Checking environment files..."
test -f backend/.env || echo "⚠️  backend/.env missing!"
test -f frontend/.env.local || echo "⚠️  frontend/.env.local missing!"

# 3. Restart frontend
echo "3. Starting frontend..."
cd frontend && npm run dev &
sleep 5

# 4. Restart backend
echo "4. Starting backend..."
cd ../backend && npm run start:minimal &
sleep 5

# 5. Verify health
echo "5. Verifying services..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: FAILED"
curl -s http://localhost:3001/health > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: FAILED"
curl -s http://localhost:3001/health/test-supabase | grep -q "success.*true" && echo "✅ Database: OK" || echo "❌ Database: FAILED"

echo ""
echo "🎉 Reset complete!"
```

---

## 📞 Getting Help

### Log Files to Check
1. Backend terminal output
2. Frontend terminal output
3. Browser developer console (F12)
4. Network tab in browser DevTools

### Information to Gather
When reporting issues, include:
1. Error message (full stack trace)
2. Which service is affected (frontend/backend)
3. Recent changes made
4. Environment (development/production)
5. Node.js version: `node --version`
6. npm version: `npm --version`

---

**Last Updated:** October 21, 2025
**Platform Status:** ✅ Fully Operational


