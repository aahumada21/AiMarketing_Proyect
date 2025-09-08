-- Fix RLS policies for organization_members table
-- This migration fixes the circular dependency issue in the organization_members policies

-- Drop the existing problematic policy
drop policy if exists "Users can view members of their organizations" on public.organization_members;

-- Create the corrected policies
create policy "Users can view their own memberships" on public.organization_members
  for select using (user_id = auth.uid());

create policy "Users can view members of their organizations" on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
    )
  );
