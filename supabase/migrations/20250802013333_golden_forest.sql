/*
  # Storage policies for contract-files bucket

  1. Security
    - Enable RLS on storage.objects table (if not already enabled)
    - Add policies for authenticated users to manage their own files
    - Users can only access files in their own folder (user_id prefix)

  2. Policies
    - SELECT: Users can view their own files
    - INSERT: Users can upload files to their own folder
    - UPDATE: Users can update their own files
    - DELETE: Users can delete their own files
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for viewing files (SELECT)
CREATE POLICY "Users can view own files in contract-files bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contract-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for uploading files (INSERT)
CREATE POLICY "Users can upload files to own folder in contract-files bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contract-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for updating files (UPDATE)
CREATE POLICY "Users can update own files in contract-files bucket"
  ON storage.objects
  FOR UPDATE
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
CREATE POLICY "Users can delete own files in contract-files bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contract-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );