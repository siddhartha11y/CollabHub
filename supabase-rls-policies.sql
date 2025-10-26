-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to view files
CREATE POLICY "Allow users to view files" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- Policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own files
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);