/*
  # Create user files table for contract storage

  1. New Tables
    - `user_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `filename` (text)
      - `content` (text)
      - `content_type` (text)
      - `file_size` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_files` table
    - Add policies for authenticated users to manage their own files
*/

-- Create user_files table
CREATE TABLE IF NOT EXISTS user_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text/plain',
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own files"
  ON user_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own files"
  ON user_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON user_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON user_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_created_at ON user_files(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_files_updated_at
  BEFORE UPDATE ON user_files
  FOR EACH ROW
  EXECUTE FUNCTION update_user_files_updated_at();