-- Apply the enum types to the organizations table
-- This migration applies the org_plan and org_status enums to the organizations table

-- First, ensure the enum types exist (they should be created by migration 007)
DO $$ BEGIN
    -- Check if org_plan enum exists, create if not
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_plan') THEN
        CREATE TYPE public.org_plan AS ENUM ('free', 'pro', 'enterprise');
        RAISE NOTICE 'Created org_plan enum type';
    END IF;
    
    -- Check if org_status enum exists, create if not
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_status') THEN
        CREATE TYPE public.org_status AS ENUM ('active', 'suspended', 'inactive');
        RAISE NOTICE 'Created org_status enum type';
    END IF;
END $$;

-- Add the columns to organizations table if they don't exist
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan public.org_plan NOT NULL DEFAULT 'free';

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status public.org_status NOT NULL DEFAULT 'active';

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- Update existing organizations to have default values
UPDATE public.organizations 
SET 
    description = COALESCE(description, 'Organization created before migration'),
    plan = COALESCE(plan, 'free'::public.org_plan),
    status = COALESCE(status, 'active'::public.org_status),
    updated_at = COALESCE(updated_at, now())
WHERE description IS NULL OR plan IS NULL OR status IS NULL OR updated_at IS NULL;

-- Add table and column comments
COMMENT ON TABLE public.organizations IS 'Organizations table with plan, status and description fields';
COMMENT ON COLUMN public.organizations.description IS 'Organization description';
COMMENT ON COLUMN public.organizations.plan IS 'Organization plan: free, pro, or enterprise';
COMMENT ON COLUMN public.organizations.status IS 'Organization status: active, suspended, or inactive';
COMMENT ON COLUMN public.organizations.updated_at IS 'Last update timestamp';

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
