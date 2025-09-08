-- RPC Functions for IA-Marketing
-- Atomic operations for credit management and video job creation

-- Function to create a video job with atomic credit deduction
create or replace function public.create_video_job_rpc(
  p_project_id uuid,
  p_prompt_id uuid default null,
  p_prompt_version int default null,
  p_prompt_text_final text default '',
  p_parameters jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_cost int;
  v_wallet int;
  v_job_id uuid := gen_random_uuid();
  v_user uuid := auth.uid();
  v_month date := date_trunc('month', now())::date;
  v_monthly_cap int;
  v_used_this_month int;
begin
  -- Validate user is member of the project
  if not exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = v_user
  ) then
    raise exception 'USER_NOT_PROJECT_MEMBER';
  end if;

  -- Validate prompt text is provided
  if p_prompt_text_final is null or trim(p_prompt_text_final) = '' then
    raise exception 'PROMPT_TEXT_REQUIRED';
  end if;

  -- Get organization from project
  select organization_id into v_org_id 
  from public.projects 
  where id = p_project_id;

  if v_org_id is null then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  -- Get cost per video from global settings
  select (value->>'credits_per_video')::int into v_cost
  from public.global_settings 
  where key = 'credits_per_video';

  if v_cost is null then
    raise exception 'CREDITS_PER_VIDEO_NOT_SET';
  end if;

  -- Get current wallet balance (with lock)
  select balance into v_wallet 
  from public.org_wallets 
  where organization_id = v_org_id 
  for update;

  if v_wallet is null then
    -- Create wallet if it doesn't exist
    insert into public.org_wallets (organization_id, balance)
    values (v_org_id, 0);
    v_wallet := 0;
  end if;

  if v_wallet < v_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  -- Check monthly project cap
  select monthly_cap, used_this_month 
  into v_monthly_cap, v_used_this_month
  from public.project_credit_limits 
  where project_id = p_project_id and month_key = v_month
  for update;

  if v_monthly_cap is null then
    -- Create default limit (no cap)
    insert into public.project_credit_limits (project_id, monthly_cap, month_key, used_this_month)
    values (p_project_id, 0, v_month, 0);
    v_monthly_cap := 0;
    v_used_this_month := 0;
  end if;

  if v_monthly_cap > 0 and v_used_this_month + v_cost > v_monthly_cap then
    raise exception 'PROJECT_CAP_EXCEEDED';
  end if;

  -- Debit wallet
  update public.org_wallets
  set balance = balance - v_cost,
      updated_at = now()
  where organization_id = v_org_id;

  -- Record in ledger
  insert into public.credits_ledger (
    organization_id, project_id, user_id, video_id, 
    delta, source, reason
  ) values (
    v_org_id, p_project_id, v_user, v_job_id,
    -v_cost, 'debit', 'video_generation'
  );

  -- Update monthly usage
  update public.project_credit_limits
  set used_this_month = used_this_month + v_cost,
      updated_at = now()
  where project_id = p_project_id and month_key = v_month;

  -- Create video job
  insert into public.video_jobs (
    id, organization_id, project_id, user_id, status,
    prompt_id, prompt_version, prompt_text_final, 
    parameters, cost_credits
  ) values (
    v_job_id, v_org_id, p_project_id, v_user, 'queued',
    p_prompt_id, p_prompt_version, p_prompt_text_final,
    p_parameters, v_cost
  );

  -- Log audit
  insert into public.audit_logs (
    organization_id, user_id, action, entity, entity_id, metadata
  ) values (
    v_org_id, v_user, 'create_video_job', 'video_job', v_job_id,
    jsonb_build_object('project_id', p_project_id, 'cost', v_cost)
  );

  return v_job_id;
end $$;

-- Function to refund credits for a failed video job
create or replace function public.refund_video_job_rpc(
  p_video_id uuid
) returns boolean
language plpgsql
security definer
as $$
declare
  v_job record;
  v_user uuid := auth.uid();
begin
  -- Get job details
  select * into v_job
  from public.video_jobs
  where id = p_video_id;

  if v_job is null then
    raise exception 'VIDEO_JOB_NOT_FOUND';
  end if;

  -- Check if already refunded
  if (v_job.metadata->>'refunded')::boolean = true then
    raise exception 'ALREADY_REFUNDED';
  end if;

  -- Only allow refund for failed jobs
  if v_job.status != 'failed' then
    raise exception 'CANNOT_REFUND_NON_FAILED_JOB';
  end if;

  -- Check user has permission (project member or org admin)
  if not exists (
    select 1 from public.project_members pm
    where pm.project_id = v_job.project_id and pm.user_id = v_user
  ) and not exists (
    select 1 from public.organization_members om
    where om.organization_id = v_job.organization_id 
      and om.user_id = v_user 
      and om.role in ('admin', 'superadmin')
  ) then
    raise exception 'INSUFFICIENT_PERMISSIONS';
  end if;

  -- Refund credits
  update public.org_wallets
  set balance = balance + v_job.cost_credits,
      updated_at = now()
  where organization_id = v_job.organization_id;

  -- Record refund in ledger
  insert into public.credits_ledger (
    organization_id, project_id, user_id, video_id,
    delta, source, reason
  ) values (
    v_job.organization_id, v_job.project_id, v_user, p_video_id,
    v_job.cost_credits, 'refund', 'failed_video_job'
  );

  -- Update monthly usage (subtract from used)
  update public.project_credit_limits
  set used_this_month = used_this_month - v_job.cost_credits,
      updated_at = now()
  where project_id = v_job.project_id 
    and month_key = date_trunc('month', v_job.created_at)::date;

  -- Mark as refunded
  update public.video_jobs
  set metadata = metadata || '{"refunded": true}'::jsonb,
      updated_at = now()
  where id = p_video_id;

  -- Log audit
  insert into public.audit_logs (
    organization_id, user_id, action, entity, entity_id, metadata
  ) values (
    v_job.organization_id, v_user, 'refund_video_job', 'video_job', p_video_id,
    jsonb_build_object('refund_amount', v_job.cost_credits)
  );

  return true;
end $$;

-- Function to adjust organization credits (admin only)
create or replace function public.adjust_org_credits_rpc(
  p_organization_id uuid,
  p_delta int,
  p_reason text default 'manual_adjustment'
) returns boolean
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_current_balance int;
begin
  -- Check user is admin of the organization
  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = v_user
      and om.role in ('admin', 'superadmin')
  ) then
    raise exception 'INSUFFICIENT_PERMISSIONS';
  end if;

  -- Get current balance
  select balance into v_current_balance
  from public.org_wallets
  where organization_id = p_organization_id;

  if v_current_balance is null then
    -- Create wallet if it doesn't exist
    insert into public.org_wallets (organization_id, balance)
    values (p_organization_id, 0);
    v_current_balance := 0;
  end if;

  -- Check if adjustment would result in negative balance
  if v_current_balance + p_delta < 0 then
    raise exception 'INSUFFICIENT_CREDITS_FOR_ADJUSTMENT';
  end if;

  -- Update wallet
  update public.org_wallets
  set balance = balance + p_delta,
      updated_at = now()
  where organization_id = p_organization_id;

  -- Record in ledger
  insert into public.credits_ledger (
    organization_id, user_id, delta, source, reason
  ) values (
    p_organization_id, v_user, p_delta, 'adjustment', p_reason
  );

  -- Log audit
  insert into public.audit_logs (
    organization_id, user_id, action, entity, entity_id, metadata
  ) values (
    p_organization_id, v_user, 'adjust_credits', 'org_wallet', p_organization_id,
    jsonb_build_object('delta', p_delta, 'reason', p_reason)
  );

  return true;
end $$;

-- Function to create organization with admin membership
create or replace function public.create_organization_rpc(
  p_name text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_org_id uuid := gen_random_uuid();
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'USER_NOT_AUTHENTICATED';
  end if;

  -- Create organization
  insert into public.organizations (id, name)
  values (v_org_id, p_name);

  -- Add creator as admin
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user, 'admin');

  -- Create wallet
  insert into public.org_wallets (organization_id, balance)
  values (v_org_id, 0);

  -- Log audit
  insert into public.audit_logs (
    organization_id, user_id, action, entity, entity_id, metadata
  ) values (
    v_org_id, v_user, 'create_organization', 'organization', v_org_id,
    jsonb_build_object('name', p_name)
  );

  return v_org_id;
end $$;

-- Function to create project with owner membership
create or replace function public.create_project_rpc(
  p_organization_id uuid,
  p_name text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_project_id uuid := gen_random_uuid();
  v_user uuid := auth.uid();
begin
  -- Check user is admin of the organization
  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = v_user
      and om.role in ('admin', 'superadmin')
  ) then
    raise exception 'INSUFFICIENT_PERMISSIONS';
  end if;

  -- Create project
  insert into public.projects (id, organization_id, name, created_by)
  values (v_project_id, p_organization_id, p_name, v_user);

  -- Add creator as owner
  insert into public.project_members (project_id, user_id, role)
  values (v_project_id, v_user, 'owner');

  -- Create default credit limit (no cap)
  insert into public.project_credit_limits (project_id, monthly_cap, month_key, used_this_month)
  values (v_project_id, 0, date_trunc('month', now())::date, 0);

  -- Log audit
  insert into public.audit_logs (
    organization_id, user_id, action, entity, entity_id, metadata
  ) values (
    p_organization_id, v_user, 'create_project', 'project', v_project_id,
    jsonb_build_object('name', p_name)
  );

  return v_project_id;
end $$;
