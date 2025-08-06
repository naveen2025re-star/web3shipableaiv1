/*
  # Add Credits System

  1. New Columns
    - Add `credits` column to `user_profiles` table
      - `credits` (integer, default 100) - User's available credits for audits

  2. Security
    - Maintain existing RLS policies
    - Credits are user-specific and protected

  3. Changes
    - All existing users will get 100 default credits
    - New users will start with 100 credits
*/

-- Add credits column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'credits'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN credits integer DEFAULT 100 NOT NULL;
  END IF;
END $$;

-- Update existing users to have default credits if they don't have any
UPDATE user_profiles 
SET credits = 100 
WHERE credits IS NULL OR credits = 0;