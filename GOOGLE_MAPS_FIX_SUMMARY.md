# Google Maps API Key Fix - Quick Summary

**Date**: November 18, 2025
**Issue**: Booking flow delivery location not working after moving Google Maps API key to Supabase Edge Function secrets
**Status**: ✅ **FIXED**

---

## 🐛 What Was Wrong

1. **Google Maps API key was in Supabase Edge Function secrets**
2. **Next.js API routes couldn't access Edge Function secrets**
3. **All Maps API routes were failing with "Maps service unavailable"**
4. **Booking flow couldn't calculate delivery fees**

---

## ✅ What Was Fixed

### Created New Files
1. **`frontend/src/lib/maps/config.ts`** - Smart API key loader
   - Tries Edge Function secrets first
   - Falls back to system_config table
   - Falls back to environment variable
   - Comprehensive logging

### Updated Files
1. **`frontend/src/app/api/maps/distance/route.ts`** - Distance calculation
2. **`frontend/src/app/api/maps/autocomplete/route.ts`** - Address suggestions
3. **`frontend/src/app/api/maps/geocode/route.ts`** - Place geocoding

### Database Changes
1. **Added `GOOGLE_MAPS_API_KEY` to `system_config` table**

---

## 🚀 How to Configure

### Quick Setup (Choose ONE option)

**Option A: Via Environment Variable** (Recommended)
```bash
# Add to Vercel/deployment platform environment variables
GOOGLE_MAPS_API_KEY=your_key_here

# Or for local development, add to frontend/.env.local
echo "GOOGLE_MAPS_API_KEY=your_key_here" >> frontend/.env.local
```

**Option B: Via Database**
```sql
-- In Supabase SQL Editor
UPDATE system_config
SET value = '"your_google_maps_api_key_here"'::jsonb,
    updated_at = NOW()
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

---

## 🧪 Test It Works

### 1. Test Autocomplete
Visit booking flow: `http://localhost:3000/book`
- Go to "Delivery Information" step
- Start typing an address
- ✅ **Should see suggestions dropdown**

### 2. Test Distance Calculation
```bash
curl "http://localhost:3000/api/maps/distance?destination=100+Main+Street+Saint+John+NB"
```

✅ **Should return**:
```json
{
  "status": "OK",
  "distance": { "kilometers": 5.2 },
  "duration": { "minutes": 8 }
}
```

---

## 🔍 Debugging

### Check if Key is Configured
```bash
# Try to autocomplete an address
curl "http://localhost:3000/api/maps/autocomplete?input=golden+grove"
```

**If working**: Returns address suggestions
**If broken**: Returns `{"error": "Maps service unavailable"}`

### Check Logs
```sql
SELECT * FROM logs
WHERE component = 'maps-config'
ORDER BY created_at DESC
LIMIT 10;
```

**Look for**:
- `load_from_secrets` ✅ Key loaded from Edge Function
- `load_from_db` ✅ Key loaded from system_config
- `load_from_env` ✅ Key loaded from environment variable
- `missing_api_key` ❌ Key not configured anywhere

---

## ⚠️ Common Issues

### "Maps service unavailable" error
**Solution**: Key isn't configured. Add it using Option A or B above.

### Works locally but not in production
**Solution**: Add `GOOGLE_MAPS_API_KEY` to your deployment platform's environment variables.

### Autocomplete works but distance fails
**Solution**: Check rate limits in Google Cloud Console. Distance Matrix API might be disabled.

---

## 📚 Documentation

**Full Details**: See `GOOGLE_MAPS_KEY_SETUP.md`

**Key Features**:
- ✅ Multiple fallback sources for API key
- ✅ Works in Edge Functions and Next.js API routes
- ✅ Structured logging for debugging
- ✅ Backward compatible with existing setup

---

**Status**: ✅ **Ready to Deploy**
**Test URL**: http://localhost:3000/book → Step 3: Delivery Information

