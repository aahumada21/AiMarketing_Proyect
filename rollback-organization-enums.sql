-- Rollback script for organization enums
-- WARNING: This will remove the new columns and enum types
-- Only run this if you need to revert the changes

-- 1. Remove indexes first
DROP INDEX IF EXISTS public.idx_organizations_status;
DROP INDEX IF EXISTS public.idx_organizations_plan;
DROP INDEX IF EXISTS public.idx_organizations_created_at;

-- 2. Remove columns from organizations table
ALTER TABLE public.organizations DROP COLUMN IF EXISTS description;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS plan;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS status;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS updated_at;

-- 3. Drop enum types (only if no other tables are using them)
-- WARNING: This will fail if other tables reference these enums
DROP TYPE IF EXISTS public.org_status CASCADE;
DROP TYPE IF EXISTS public.org_plan CASCADE;

-- 4. Verify rollback
SELECT 
    'Rollback Verification' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
