-- Verification script for organization enums and table structure
-- Run this script to verify that the enums and table are set up correctly

-- 1. Check if enum types exist
SELECT 
    'Enum Types Check' as check_type,
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('org_plan', 'org_status')
GROUP BY typname
ORDER BY typname;

-- 2. Check organizations table structure
SELECT 
    'Table Structure Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check indexes on organizations table
SELECT 
    'Indexes Check' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'organizations' 
AND schemaname = 'public'
ORDER BY indexname;

-- 4. Test inserting a sample organization with the new structure
INSERT INTO public.organizations (name, description, plan, status)
VALUES (
    'Test Organization',
    'This is a test organization to verify the new structure',
    'pro'::public.org_plan,
    'active'::public.org_status
)
ON CONFLICT DO NOTHING;

-- 5. Verify the test organization was created
SELECT 
    'Test Insert Check' as check_type,
    id,
    name,
    description,
    plan,
    status,
    created_at,
    updated_at
FROM public.organizations 
WHERE name = 'Test Organization';

-- 6. Clean up test data
DELETE FROM public.organizations WHERE name = 'Test Organization';

-- 7. Final verification - show all organizations with new structure
SELECT 
    'Final Verification' as check_type,
    COUNT(*) as total_organizations,
    COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_plan_count,
    COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_plan_count,
    COUNT(CASE WHEN plan = 'enterprise' THEN 1 END) as enterprise_plan_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_status_count,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_status_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_status_count
FROM public.organizations;
