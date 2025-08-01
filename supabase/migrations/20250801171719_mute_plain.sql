/*
  # Create storage bucket for contract files

  1. Storage Setup
    - Create `contract-files` bucket for user file uploads
    - Enable public access for authenticated users
    - Set up RLS policies for user-specific access

  2. Security
    - Users can only access their own files
    - Files are organized by user ID folders
    - Proper MIME type restrictions for security
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-files',
  'contract-files',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'text/plain',
    'text/javascript',
    'application/javascript',
    'text/x-python',
    'text/x-rust',
    'application/json',
    'text/x-solidity'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload files to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view files in their own folder
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update files in their own folder
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contract-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete files in their own folder
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);