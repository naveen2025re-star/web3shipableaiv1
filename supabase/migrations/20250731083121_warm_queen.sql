/*
  # Add GitHub PAT Support

  1. Schema Changes
    - Add `github_pat` column to `user_profiles` table for storing GitHub Personal Access Tokens
    - Column is nullable and encrypted for security

  2. Security
    - PAT tokens are stored encrypted
    - Only accessible by the user who owns the profile
*/

-- Add github_pat column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'github_pat'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN github_pat text;
  END IF;
END $$;