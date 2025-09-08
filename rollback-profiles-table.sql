-- Rollback script for profiles table updates
-- WARNING: This will remove the new columns from the profiles table
-- Only run this if you need to revert the changes

-- 1. Remove indexes first
DROP INDEX IF EXISTS public.idx_profiles_timezone;

-- 2. Remove columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS timezone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS updated_at;

-- 3. Verify rollback
SELECT 
    'Rollback Verification' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
