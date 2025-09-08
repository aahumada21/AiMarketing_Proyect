-- Update organizations table to include required fields for CRUD operations
-- Add missing columns: description, plan, status

-- Add description column
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS description text;

-- Add plan column with enum type
DO $$ BEGIN
    CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan org_plan NOT NULL DEFAULT 'free';

-- Add status column with enum type
DO $$ BEGIN
    CREATE TYPE org_status AS ENUM ('active', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status org_status NOT NULL DEFAULT 'active';

-- Add updated_at column for tracking changes
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Create index on plan for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations(plan);

-- Update existing organizations to have default values
UPDATE public.organizations 
SET 
    description = 'Organization created before migration',
    plan = 'free',
    status = 'active',
    updated_at = now()
WHERE description IS NULL OR plan IS NULL OR status IS NULL;

-- Add comment to the table
COMMENT ON TABLE public.organizations IS 'Organizations table with plan, status and description fields';
COMMENT ON COLUMN public.organizations.description IS 'Organization description';
COMMENT ON COLUMN public.organizations.plan IS 'Organization plan: free, pro, or enterprise';
COMMENT ON COLUMN public.organizations.status IS 'Organization status: active, suspended, or inactive';
