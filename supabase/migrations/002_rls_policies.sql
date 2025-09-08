-- Row Level Security (RLS) Policies for IA-Marketing
-- Ensures multitenant isolation and proper access control

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.org_wallets enable row level security;
alter table public.project_credit_limits enable row level security;
alter table public.credits_ledger enable row level security;
alter table public.prompts enable row level security;
alter table public.video_jobs enable row level security;
alter table public.global_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function to get user's organization IDs
create or replace function public.get_user_org_ids()
returns table(organization_id uuid, role org_role)
language sql
security definer
stable
as $$
  select om.organization_id, om.role
  from public.organization_members om
  where om.user_id = auth.uid();
$$;

-- Helper function to check if user is superadmin
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.organization_members om
    where om.user_id = auth.uid() and om.role = 'superadmin'
  );
$$;

-- ORGANIZATIONS policies
create policy "Users can view organizations they belong to" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
  );

create policy "Superadmins can view all organizations" on public.organizations
  for select using (public.is_superadmin());

create policy "Authenticated users can create organizations" on public.organizations
  for insert with check (auth.uid() is not null);

-- PROFILES policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- ORGANIZATION_MEMBERS policies
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

create policy "Organization admins can manage members" on public.organization_members
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'superadmin')
    )
  );

-- PROJECTS policies
create policy "Users can view projects of their organizations" on public.projects
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = projects.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Organization admins can manage projects" on public.projects
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = projects.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'superadmin')
    )
  );

-- PROJECT_MEMBERS policies
create policy "Users can view project members of their projects" on public.project_members
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Project owners can manage project members" on public.project_members
  for all using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

-- ORG_WALLETS policies
create policy "Organization members can view wallet" on public.org_wallets
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = org_wallets.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Organization admins can manage wallet" on public.org_wallets
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = org_wallets.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'superadmin')
    )
  );

-- PROJECT_CREDIT_LIMITS policies
create policy "Project members can view credit limits" on public.project_credit_limits
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_credit_limits.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Organization admins can manage credit limits" on public.project_credit_limits
  for all using (
    exists (
      select 1 from public.organization_members om
      join public.projects p on p.organization_id = om.organization_id
      where p.id = project_credit_limits.project_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'superadmin')
    )
  );

-- CREDITS_LEDGER policies
create policy "Organization members can view ledger" on public.credits_ledger
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = credits_ledger.organization_id
        and om.user_id = auth.uid()
    )
  );

-- PROMPTS policies
create policy "Global prompts are visible to all authenticated users" on public.prompts
  for select using (
    scope = 'global' and is_published = true
  );

create policy "Organization prompts are visible to organization members" on public.prompts
  for select using (
    scope = 'organization' and
    exists (
      select 1 from public.organization_members om
      where om.organization_id = prompts.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Superadmins can manage global prompts" on public.prompts
  for all using (
    scope = 'global' and public.is_superadmin()
  );

create policy "Organization admins can manage organization prompts" on public.prompts
  for all using (
    scope = 'organization' and
    exists (
      select 1 from public.organization_members om
      where om.organization_id = prompts.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'superadmin')
    )
  );

-- VIDEO_JOBS policies
create policy "Project members can view video jobs" on public.video_jobs
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = video_jobs.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Project members can create video jobs" on public.video_jobs
  for insert with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = video_jobs.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "System can update video jobs" on public.video_jobs
  for update using (true); -- This will be restricted by the RPC functions

-- GLOBAL_SETTINGS policies
create policy "All authenticated users can view global settings" on public.global_settings
  for select using (auth.uid() is not null);

create policy "Only superadmins can modify global settings" on public.global_settings
  for all using (public.is_superadmin());

-- AUDIT_LOGS policies
create policy "Organization members can view audit logs" on public.audit_logs
  for select using (
    organization_id is null or
    exists (
      select 1 from public.organization_members om
      where om.organization_id = audit_logs.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "System can insert audit logs" on public.audit_logs
  for insert with check (true);
