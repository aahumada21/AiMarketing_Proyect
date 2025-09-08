-- Verification script for profiles table structure
-- Run this script to verify that the profiles table has all required fields

-- 1. Check profiles table structure
SELECT 
    'Profiles Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check indexes on profiles table
SELECT 
    'Profiles Indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY indexname;

-- 3. Test inserting a sample profile with the new structure
INSERT INTO public.profiles (user_id, full_name, avatar_url, timezone)
VALUES (
    gen_random_uuid(),
    'Test User',
    'https://example.com/avatar.jpg',
    'America/New_York'
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verify the test profile was created
SELECT 
    'Test Profile Insert' as check_type,
    user_id,
    full_name,
    avatar_url,
    timezone,
    created_at,
    updated_at
FROM public.profiles 
WHERE full_name = 'Test User';

-- 5. Clean up test data
DELETE FROM public.profiles WHERE full_name = 'Test User';

-- 6. Final verification - show all profiles with new structure
SELECT 
    'Final Verification' as check_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN avatar_url IS NOT NULL THEN 1 END) as profiles_with_avatar,
    COUNT(CASE WHEN timezone = 'UTC' THEN 1 END) as utc_timezone_count,
    COUNT(CASE WHEN timezone != 'UTC' THEN 1 END) as other_timezone_count
FROM public.profiles;
