# Supabase Storage Setup

To enable large file uploads, you need to create a storage bucket in your Supabase dashboard:

## Steps:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Storage** in the left sidebar
3. **Create a new bucket**:
   - Name: `files`
   - Public: `true` (so files can be accessed via URL)
   - File size limit: `5GB` (or your preferred limit)

## Alternative: Create bucket via SQL

You can also run this SQL in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view files" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## After Setup:

1. Restart your development server: `npm run dev`
2. You should see both upload buttons:
   - "Small Files (5MB)" - for regular uploads
   - "Large Files (5GB)" - for large uploads via Supabase Storage

The large file upload will handle your PDF and other large files efficiently!