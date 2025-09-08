-- Create enum types for organizations table
-- This migration creates the enum types for OrgPlan and OrgStatus

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

-- Add comments to the enum types for documentation
COMMENT ON TYPE public.org_plan IS 'Organization plan types: free, pro, enterprise';
COMMENT ON TYPE public.org_status IS 'Organization status types: active, suspended, inactive';

-- Verify the enum types were created
SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('org_plan', 'org_status')
ORDER BY typname, enumsortorder;
