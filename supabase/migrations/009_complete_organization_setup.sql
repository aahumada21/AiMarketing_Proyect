-- Complete organization setup migration
-- This migration creates enums, updates the table, and sets up everything needed

-- ==============================================
-- STEP 1: Create Enum Types
-- ==============================================

-- Create org_plan enum type
DO $$ BEGIN
    CREATE TYPE public.org_plan AS ENUM ('free', 'pro', 'enterprise');
    RAISE NOTICE 'Created org_plan enum type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'org_plan enum type already exists, skipping...';
END $$;

-- Create org_status enum type
DO $$ BEGIN
    CREATE TYPE public.org_status AS ENUM ('active', 'suspended', 'inactive');
    RAISE NOTICE 'Created org_status enum type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'org_status enum type already exists, skipping...';
END $$;

-- ==============================================
-- STEP 2: Add Columns to Organizations Table
-- ==============================================

-- Add description column
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS description text;

-- Add plan column with enum type
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan public.org_plan NOT NULL DEFAULT 'free';

-- Add status column with enum type
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status public.org_status NOT NULL DEFAULT 'active';

-- Add updated_at column
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ==============================================
-- STEP 3: Create Indexes
-- ==============================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- ==============================================
-- STEP 4: Update Existing Data
-- ==============================================

-- Update existing organizations to have default values
UPDATE public.organizations 
SET 
    description = COALESCE(description, 'Organization created before migration'),
    plan = COALESCE(plan, 'free'::public.org_plan),
    status = COALESCE(status, 'active'::public.org_status),
    updated_at = COALESCE(updated_at, now())
WHERE description IS NULL OR plan IS NULL OR status IS NULL OR updated_at IS NULL;

-- ==============================================
-- STEP 5: Add Documentation
-- ==============================================

-- Add comments to enum types
COMMENT ON TYPE public.org_plan IS 'Organization plan types: free, pro, enterprise';
COMMENT ON TYPE public.org_status IS 'Organization status types: active, suspended, inactive';

-- Add comments to table and columns
COMMENT ON TABLE public.organizations IS 'Organizations table with plan, status and description fields';
COMMENT ON COLUMN public.organizations.description IS 'Organization description';
COMMENT ON COLUMN public.organizations.plan IS 'Organization plan: free, pro, or enterprise';
COMMENT ON COLUMN public.organizations.status IS 'Organization status: active, suspended, or inactive';
COMMENT ON COLUMN public.organizations.updated_at IS 'Last update timestamp';

-- ==============================================
-- STEP 6: Verification
-- ==============================================

-- Verify enum types were created
SELECT 
    'Enum Types Created' as verification_step,
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('org_plan', 'org_status')
GROUP BY typname
ORDER BY typname;

-- Verify table structure
SELECT 
    'Table Structure Updated' as verification_step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT 
    'Indexes Created' as verification_step,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'organizations' 
AND schemaname = 'public'
ORDER BY indexname;

-- Final success message
SELECT 'Organization setup completed successfully!' as final_status;
