# 🔧 Google Maps API Key Setup - Quick Guide

## ✅ Your API Key is Already in Supabase!

I can see `GOOGLE_MAPS_API_KEY` is already configured in Supabase Edge Function secrets.

---

## 🚀 Quick Fix (2 Steps)

### Step 1: Copy the Key from Supabase

1. In your Supabase dashboard (the screenshot you showed)
2. Find `GOOGLE_MAPS_API_KEY` (it's highlighted in green)
3. Click the **eye icon** to reveal the key value
4. **Copy the entire key** (it starts with `AIzaSy...`)

### Step 2: Add to Local Environment

**Option A: Manual Edit**
```bash
# Edit the file
nano frontend/.env.local

# Replace this line:
GOOGLE_MAPS_API_KEY=<COPY_KEY_FROM_SUPABASE_SECRETS>

# With the actual key:
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B: Direct Command**
```bash
# Replace YOUR_ACTUAL_KEY with the key from Supabase
cd frontend
sed -i 's/<COPY_KEY_FROM_SUPABASE_SECRETS>/YOUR_ACTUAL_KEY_HERE/g' .env.local
```

### Step 3: Restart Frontend Server

```bash
cd frontend
pnpm dev
```

---

## 🧪 Test It Works

1. Go to `http://localhost:3000/book`
2. Navigate to "Delivery Information" step
3. Start typing: **"945 golden grove"**
4. ✅ **You should see address suggestions!**

Or test directly:
```bash
curl "http://localhost:3000/api/maps/autocomplete?input=golden+grove"
```

---

## 📊 Why This is Needed

**The Issue**:
- ✅ Supabase Edge Function secrets are ONLY accessible within Edge Functions
- ❌ Your booking flow uses Next.js API routes (`/api/maps/*`)
- ❌ Next.js API routes can't access Edge Function secrets directly

**The Solution**:
- Make the key available as an environment variable for Next.js
- The code already checks multiple sources with this priority:
  1. Edge Function secrets (for Edge Functions)
  2. Environment variable (for Next.js API routes) ← **We're adding this**
  3. Database fallback (system_config table)

---

## 🔄 Alternative: Copy to Database (Optional)

If you prefer to keep the key only in the database:

```sql
-- In Supabase SQL Editor
UPDATE system_config
SET value = '"AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"'::jsonb,  -- Your actual key
    updated_at = NOW()
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

Then restart your frontend server.

---

## ✅ Verification

After adding the key and restarting, check:

```bash
# Test autocomplete
curl "http://localhost:3000/api/maps/autocomplete?input=945+golden+grove"

# Should return address suggestions, not an error
```

---

**Current Status**:
- ✅ Code is fixed and ready
- ⏳ **Waiting for API key to be added to environment**
- ⏳ **Then restart server**
- ⏳ **Then test booking flow**

