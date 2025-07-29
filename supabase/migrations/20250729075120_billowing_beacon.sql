/*
  # Create Projects System

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, project name)
      - `contract_language` (text, programming language)
      - `target_blockchain` (text, blockchain network)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Modifications
    - Add `project_id` column to `chat_sessions` table
    - Link chat sessions to projects via foreign key

  3. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to manage their own projects
    - Update `chat_sessions` policies to include project ownership checks

  4. Triggers
    - Add trigger to update `updated_at` column on projects
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  contract_language text NOT NULL DEFAULT 'Solidity',
  target_blockchain text NOT NULL DEFAULT 'Ethereum',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add project_id to chat_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update chat_sessions RLS policies to include project ownership
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_sessions.project_id 
      AND projects.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_sessions.project_id 
      AND projects.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_sessions.project_id 
      AND projects.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_sessions.project_id 
      AND projects.user_id = auth.uid()
    ))
  );

-- Update messages RLS policies to include project ownership
DROP POLICY IF EXISTS "Users can view messages in own chat sessions" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own chat sessions" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own chat sessions" ON messages;

CREATE POLICY "Users can view messages in own chat sessions"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = messages.chat_session_id 
      AND (
        chat_sessions.user_id = auth.uid() OR
        (chat_sessions.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM projects 
          WHERE projects.id = chat_sessions.project_id 
          AND projects.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can create messages in own chat sessions"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = messages.chat_session_id 
      AND (
        chat_sessions.user_id = auth.uid() OR
        (chat_sessions.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM projects 
          WHERE projects.id = chat_sessions.project_id 
          AND projects.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can update messages in own chat sessions"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = messages.chat_session_id 
      AND (
        chat_sessions.user_id = auth.uid() OR
        (chat_sessions.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM projects 
          WHERE projects.id = chat_sessions.project_id 
          AND projects.user_id = auth.uid()
        ))
      )
    )
  );

-- Add trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for valid values
ALTER TABLE projects ADD CONSTRAINT projects_contract_language_check 
  CHECK (contract_language IN ('Solidity', 'Vyper', 'Rust', 'Cairo', 'Move', 'JavaScript', 'TypeScript'));

ALTER TABLE projects ADD CONSTRAINT projects_target_blockchain_check 
  CHECK (target_blockchain IN ('Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Avalanche', 'Fantom', 'Solana', 'Near', 'Aptos', 'Sui'));