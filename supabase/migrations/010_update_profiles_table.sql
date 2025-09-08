-- Update profiles table to include missing fields
-- This migration adds avatar_url and timezone fields to the profiles table

-- Add avatar_url column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add timezone column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- Add updated_at column for tracking changes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create index on timezone for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON public.profiles(timezone);

-- Update existing profiles to have default values
UPDATE public.profiles 
SET 
    timezone = COALESCE(timezone, 'UTC'),
    updated_at = COALESCE(updated_at, now())
WHERE timezone IS NULL OR updated_at IS NULL;

-- Add comments to the table and columns
COMMENT ON TABLE public.profiles IS 'User profiles table with avatar and timezone information';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL of the user avatar image';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone (e.g., UTC, America/New_York)';
COMMENT ON COLUMN public.profiles.updated_at IS 'Last update timestamp';

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
