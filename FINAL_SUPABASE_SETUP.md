# FINAL SUPABASE SETUP - DO THIS ONCE

## Step 1: Go to Supabase Dashboard → Storage → Policies

## Step 2: Click "New Policy" and create this policy:

**Policy Name**: `Allow all operations on files bucket`
**Policy Command**: `ALL`
**Target Roles**: `public`
**USING Expression**: 
```sql
bucket_id = 'files'
```

**WITH CHECK Expression**: 
```sql
bucket_id = 'files'
```

## Step 3: Click "Save Policy"

This single policy allows all operations (upload, read, delete) on the 'files' bucket for everyone. Since your bucket is already public, this is the simplest approach that will work immediately.

## Alternative: If the above doesn't work, disable RLS entirely:

1. Go to **Storage** → **Policies**
2. Find the `storage.objects` table
3. Click **"Disable RLS"**

This will remove all restrictions and allow uploads to work immediately.