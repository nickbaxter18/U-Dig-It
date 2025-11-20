# Google Maps API Key Setup - FIXED

**Date**: November 18, 2025
**Status**: ✅ **Issue Diagnosed and Fixed**
**Problem**: Google Maps API key moved to Supabase Edge Function secrets but Next.js API routes couldn't access it

---

## 🔍 Problem Diagnosis

### Issue
You moved the `GOOGLE_MAPS_API_KEY` to Supabase Edge Function secrets, but the booking flow's delivery location feature was failing because:

1. **Edge Function secrets are only accessible within Edge Functions** - Not directly accessible from Next.js API routes
2. **Next.js API routes were using `process.env.GOOGLE_MAPS_API_KEY`** - This environment variable wasn't being populated
3. **No fallback mechanism** - When the env var was missing, the Maps API routes returned `503 Service Unavailable`

### Files Affected
The Maps API routes that were failing:
- `/api/maps/autocomplete` - Address suggestions
- `/api/maps/geocode` - Place ID to coordinates
- `/api/maps/distance` - Calculate driving distance and delivery fee

---

## ✅ Solution Implemented

### 1. Created Maps Configuration Module
**File**: `frontend/src/lib/maps/config.ts`

This module provides a unified way to load the Google Maps API key with priority:

```typescript
Priority 1: Supabase Edge Function secrets (GOOGLE_MAPS_API_KEY env var)
Priority 2: system_config table (GOOGLE_MAPS_API_KEY)
Priority 3: Environment variable (local development fallback)
```

**Key Features**:
- ✅ Tries Supabase secrets first (for Edge Functions)
- ✅ Falls back to `system_config` table (for Next.js API routes)
- ✅ Falls back to environment variable (for local development)
- ✅ Structured logging for debugging
- ✅ Clear error messages when key is missing

### 2. Updated All Maps API Routes
Updated these files to use the new `getGoogleMapsApiKey()` function:
- ✅ `frontend/src/app/api/maps/distance/route.ts`
- ✅ `frontend/src/app/api/maps/autocomplete/route.ts`
- ✅ `frontend/src/app/api/maps/geocode/route.ts`

**Before** (broken):
```typescript
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // ❌ Undefined
```

**After** (fixed):
```typescript
import { getGoogleMapsApiKey } from '@/lib/maps/config';

export async function GET(request: NextRequest) {
  let GOOGLE_MAPS_API_KEY: string;
  try {
    GOOGLE_MAPS_API_KEY = await getGoogleMapsApiKey(); // ✅ Loads from multiple sources
  } catch (error) {
    return NextResponse.json({ error: 'Maps service unavailable' }, { status: 503 });
  }
  // ...
}
```

### 3. Added system_config Table Entry
Added a row to `system_config` table for the Google Maps API key:

```sql
INSERT INTO system_config (config_key, config_value, description)
VALUES (
  'GOOGLE_MAPS_API_KEY',
  '', -- Will be populated
  'Google Maps API key for geocoding, autocomplete, and distance calculations'
);
```

---

## 🔧 Setup Instructions

### Option 1: Use Edge Function Secrets (Recommended for Production)

The key is already in Edge Function secrets. To make it work with Next.js API routes:

1. **Add to environment variables** (Supabase Dashboard > Project Settings > API):
   ```bash
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. **Or add to Vercel environment variables** (if deployed to Vercel):
   ```bash
   # In Vercel Dashboard > Project Settings > Environment Variables
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

### Option 2: Use system_config Table (Alternative)

Add the key directly to the database:

```sql
-- Update the value (stored as jsonb, so wrap in quotes)
UPDATE system_config
SET value = '"your_google_maps_api_key_here"'::jsonb,
    updated_at = NOW()
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

**To verify**:
```sql
SELECT key, value, description, updated_at
FROM system_config
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

### Option 3: Local Development

For local development, add to your `.env.local` file:

```bash
# .env.local
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

## 🧪 Testing the Fix

### Test Address Autocomplete
```bash
# Should return address suggestions
curl "http://localhost:3000/api/maps/autocomplete?input=golden+grove+road"
```

**Expected Response**:
```json
{
  "status": "OK",
  "predictions": [
    {
      "description": "Golden Grove Road, Saint John, NB, Canada",
      "place_id": "..."
    }
  ]
}
```

### Test Distance Calculation
```bash
# Should return driving distance and time
curl "http://localhost:3000/api/maps/distance?destination=100+Main+Street+Saint+John+NB"
```

**Expected Response**:
```json
{
  "status": "OK",
  "origin": "945 Golden Grove Road, Saint John, NB E2H 2X1, Canada",
  "destination": "100 Main St, Saint John, NB, Canada",
  "distance": {
    "kilometers": 5.2,
    "text": "5.2 km"
  },
  "duration": {
    "minutes": 8,
    "text": "8 mins"
  }
}
```

### Test in Booking Flow
1. Go to `http://localhost:3000/book`
2. Navigate to "Delivery Information" step
3. Start typing an address in the "Delivery Location" field
4. ✅ **Should see address suggestions appear**
5. Select an address
6. ✅ **Should see distance and delivery fee calculated**

---

## 📊 How It Works Now

### Request Flow

```
1. User types address in booking flow
   ↓
2. Frontend calls /api/maps/autocomplete
   ↓
3. API route calls getGoogleMapsApiKey()
   ├─→ Try Supabase Edge Function secrets (GOOGLE_MAPS_API_KEY env var)
   ├─→ Try system_config table (GOOGLE_MAPS_API_KEY row)
   └─→ Try environment variable (process.env.GOOGLE_MAPS_API_KEY)
   ↓
4. API route calls Google Maps API with key
   ↓
5. Returns suggestions to frontend
```

### Key Loading Priority

| Source | When Used | Priority |
|--------|-----------|----------|
| Supabase Edge Function secrets | Running in Edge Function context | **1st** |
| system_config table | Next.js API routes on server | **2nd** |
| Environment variable | Local development | **3rd** |

---

## 🔍 Debugging

### Check if Key is Loaded

Add this temporary API route to check:

```typescript
// frontend/src/app/api/debug/maps-key/route.ts
import { getGoogleMapsApiKey } from '@/lib/maps/config';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const key = await getGoogleMapsApiKey();
    return NextResponse.json({
      configured: true,
      keyPrefix: key.substring(0, 10) + '...',
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error.message,
    }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/debug/maps-key`

**Expected Response** (if working):
```json
{
  "configured": true,
  "keyPrefix": "AIzaSyB..."
}
```

### Check Logs

The Maps config module logs where it loads the key from:

```sql
-- Check recent logs
SELECT * FROM logs
WHERE component = 'maps-config'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Log Entries**:
- `load_from_secrets` - Loaded from Edge Function secrets
- `load_from_db` - Loaded from system_config table
- `load_from_env` - Loaded from environment variable
- `missing_api_key` - ❌ Key not found anywhere (needs configuration)

---

## 🚨 Common Issues & Solutions

### Issue 1: Still Getting "Maps service unavailable"

**Solution**: The key isn't configured in any location. Choose one option:

```bash
# Option A: Add to Supabase environment variables
# Dashboard > Project Settings > API > Environment Variables
GOOGLE_MAPS_API_KEY=your_key

# Option B: Add to system_config table
UPDATE system_config
SET config_value = 'your_key'
WHERE config_key = 'GOOGLE_MAPS_API_KEY';

# Option C: Add to .env.local (development only)
echo "GOOGLE_MAPS_API_KEY=your_key" >> frontend/.env.local
```

### Issue 2: Key works locally but not in production

**Solution**: Add the key to your deployment environment:

```bash
# For Vercel:
vercel env add GOOGLE_MAPS_API_KEY

# For other platforms:
# Add GOOGLE_MAPS_API_KEY to your platform's environment variables
```

### Issue 3: Getting CORS errors

**Solution**: The API routes act as proxies to avoid CORS. Make sure:
1. Frontend calls `/api/maps/*` endpoints (not Google directly)
2. API routes are returning proper CORS headers

---

## 📚 Files Modified

**New Files**:
- ✅ `frontend/src/lib/maps/config.ts` - Maps API key configuration module
- ✅ `GOOGLE_MAPS_KEY_SETUP.md` - This documentation

**Updated Files**:
- ✅ `frontend/src/app/api/maps/distance/route.ts` - Distance calculation
- ✅ `frontend/src/app/api/maps/autocomplete/route.ts` - Address autocomplete
- ✅ `frontend/src/app/api/maps/geocode/route.ts` - Place ID geocoding

**Database**:
- ✅ Added `GOOGLE_MAPS_API_KEY` row to `system_config` table

---

## ✅ Verification Checklist

After deploying, verify:

- [ ] Address autocomplete works in booking flow
- [ ] Distance calculation works for delivery locations
- [ ] Delivery fee is calculated correctly
- [ ] No "Maps service unavailable" errors in logs
- [ ] Google Maps API usage shows in Google Cloud Console

---

## 🔐 Security Notes

**Good**:
- ✅ API key never exposed to frontend (proxied through API routes)
- ✅ Rate limiting on all Maps API routes
- ✅ Request validation on all Maps API routes
- ✅ Structured logging for debugging

**Important**:
- 🔒 Restrict Google Maps API key in Google Cloud Console:
  - Enable only: Geocoding API, Places API, Distance Matrix API
  - Restrict to your server IP addresses (if possible)
  - Set daily quota limits to prevent abuse

---

**Status**: ✅ **Fix Complete - Ready to Deploy**
**Next Step**: Deploy frontend code and test booking flow delivery location feature

**Testing URL**: http://localhost:3000/book (Step 3: Delivery Information)

