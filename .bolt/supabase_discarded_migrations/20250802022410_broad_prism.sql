/*
  # Fix Storage Policies for Contract Files

  1. Storage Bucket
    - Ensure `contract-files` bucket exists with proper configuration
    - Set file size limit to 10MB
    - Configure allowed MIME types for smart contract files

  2. Security Policies
    - Enable RLS on storage.objects table
    - Create policies for authenticated users to manage files in their own folders
    - Users can only access files in folders named with their user ID

  3. Policy Structure
    - SELECT: Users can view their own files
    - INSERT: Users can upload files to their own folder
    - UPDATE: Users can modify their own files
    - DELETE: Users can delete their own files
*/

-- Ensure the contract-files bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-files',
  'contract-files',
  FALSE,
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
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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