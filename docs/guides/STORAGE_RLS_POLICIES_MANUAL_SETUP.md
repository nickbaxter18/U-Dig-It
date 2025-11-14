# 🔒 Storage RLS Policies - Manual Setup Required

**Status**: ⚠️ MANUAL SETUP REQUIRED
**Priority**: 🔴 CRITICAL - Core Functionality
**Reason**: Storage policies require Dashboard access or service role key

---

## 📋 What Needs to Be Done

Create Row-Level Security policies for Supabase Storage to secure file uploads and downloads.

### Affected Buckets:
- ✅ `contracts` - Created (50MB, PDF only, private)
- ✅ `insurance` - Created (50MB, PDF + images, private)
- ✅ `driver-licenses` - Created (10MB, images + PDF, private)
- ✅ `equipment-images` - Created (10MB, images, public)

---

## 🔧 Setup Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to: **Supabase Dashboard** → **Storage** → **Policies**
2. Click **"New Policy"** for each bucket
3. Apply the policies below

### Option 2: SQL (via Dashboard SQL Editor with Service Role)

Run the SQL script in `STORAGE_RLS_POLICIES.sql` (created alongside this file)

---

## 📄 Required Policies

### 1. CONTRACTS BUCKET

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own contracts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own contracts, admins can read all
CREATE POLICY "Users can read own contracts" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
);

-- Users can update their own contracts
CREATE POLICY "Users can manage own contracts" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own contracts
CREATE POLICY "Users can delete own contracts" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 2. INSURANCE BUCKET

```sql
CREATE POLICY "Users can upload own insurance" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'insurance' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own insurance" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'insurance' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
);

CREATE POLICY "Users can manage own insurance" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'insurance' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own insurance" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'insurance' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. DRIVER LICENSES BUCKET

```sql
CREATE POLICY "Users can upload own license" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'driver-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own license" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-licenses' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
);

CREATE POLICY "Users can manage own license" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'driver-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own license" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'driver-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 4. EQUIPMENT IMAGES BUCKET (Public)

```sql
-- Anyone can view equipment images
CREATE POLICY "Public can view equipment images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'equipment-images');

-- Only admins can upload equipment images
CREATE POLICY "Admins can upload equipment images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'equipment-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage equipment images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'equipment-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can delete equipment images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'equipment-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

### 5. ADMIN OVERRIDE

```sql
-- Admins can read all files in all buckets
CREATE POLICY "Admins can read all storage" ON storage.objects
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

---

## ✅ Verification

After creating policies, verify with:

```sql
-- Check all storage policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

Expected: **17 policies** (4 per private bucket × 3 buckets + 4 equipment images + 1 admin override)

---

## 🔗 Path Structure

### Contracts
```
contracts/{user_id}/{booking_id}/{filename}.pdf
```

### Insurance
```
insurance/{user_id}/{booking_id}/{filename}.pdf|.jpg|.png
```

### Driver Licenses
```
driver-licenses/{user_id}/{filename}.pdf|.jpg|.png
```

### Equipment Images
```
equipment-images/{equipment_id}/{filename}.jpg|.png|.webp
```

---

## 🚀 Next Steps

1. **Access Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to Storage → Policies**
3. **Create all 17 policies** using the SQL above
4. **Verify policies** using the verification query
5. **Test file upload** with a user account
6. **Mark this task as complete** in SUPABASE_AUDIT_REPORT.md

---

## 📚 Reference

- [Supabase Storage RLS Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage Helper Functions](https://supabase.com/docs/guides/storage/security/access-control#helper-functions)

---

**Status**: 🟡 Pending Manual Setup
**Created**: November 2, 2025
**Last Updated**: November 2, 2025













