/*
  # Setup Contract Files Storage

  1. Storage Setup
    - Create `contract-files` storage bucket if it doesn't exist
    - Configure bucket settings for file uploads
    
  2. Security Policies
    - Enable RLS on storage.objects table
    - Add policies for authenticated users to manage their own files
    - Users can only access files in folders named with their user ID
    
  3. Bucket Configuration
    - Private bucket (not publicly accessible)
    - Allows common file types for smart contracts
*/

-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-files',
  'contract-files', 
  false,
  10485760, -- 10MB limit
  ARRAY[
    'text/plain',
    'application/javascript',
    'text/javascript', 
    'application/typescript',
    'text/x-solidity',
    'text/x-python',
    'text/x-rust',
    'application/json',
    'text/x-cairo',
    'text/x-move'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'text/plain',
    'application/javascript',
    'text/javascript',
    'application/typescript', 
    'text/x-solidity',
    'text/x-python',
    'text/x-rust',
    'application/json',
    'text/x-cairo',
    'text/x-move'
  ];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy for viewing files (SELECT)
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for uploading files (INSERT)
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for updating files (UPDATE)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contract-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'contract-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for deleting files (DELETE)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);