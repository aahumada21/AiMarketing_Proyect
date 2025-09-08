-- Assign superadmin role to the first user
-- This migration assigns superadmin role to the first user in the system

-- First, let's see what users exist
-- SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;

-- Create a superadmin organization if it doesn't exist
INSERT INTO public.organizations (id, name, description, plan, status)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Superadmin Organization',
  'System organization for superadmin users',
  'enterprise',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Assign superadmin role to the first user
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users
-- You can get this by running: SELECT id, email FROM auth.users ORDER BY created_at LIMIT 1;

-- Example (uncomment and replace with actual user ID):
-- INSERT INTO public.organization_members (organization_id, user_id, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'USER_ID_HERE',
--   'superadmin'
-- )
-- ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'superadmin';

-- Create wallet for superadmin organization
INSERT INTO public.org_wallets (organization_id, balance)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  10000
)
ON CONFLICT (organization_id) DO NOTHING;
