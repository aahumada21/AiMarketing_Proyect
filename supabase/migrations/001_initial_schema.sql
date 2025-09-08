-- IA-Marketing Database Schema
-- Initial migration for multitenant video generation platform

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ORGANIZATIONS
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- PERFIL DE USUARIO (opcional pero útil)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- MEMBERSHIP A NIVEL ORGANIZACIÓN (rol org: admin | member)
create type org_role as enum ('admin', 'member', 'superadmin');

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- PROYECTOS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- MEMBERSHIP A NIVEL PROYECTO
create type project_role as enum ('owner','member');

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- WALLET DE CRÉDITOS POR ORGANIZACIÓN
create table public.org_wallets (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  balance int not null default 0, -- créditos disponibles
  updated_at timestamptz not null default now()
);

-- LÍMITE (CUPO) POR PROYECTO (SOFT CAP) + USO ACUMULADO DEL MES
create table public.project_credit_limits (
  project_id uuid primary key references public.projects(id) on delete cascade,
  monthly_cap int not null default 0,  -- 0 = sin tope
  month_key date not null default date_trunc('month', now())::date,
  used_this_month int not null default 0,
  updated_at timestamptz not null default now()
);

-- LEDGER DE CRÉDITOS (auditable)
create type credit_source as enum ('allocation','debit','refund','adjustment');

create table public.credits_ledger (
  id bigserial primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  video_id uuid, -- se llena cuando aplica
  delta int not null, -- positivo o negativo
  source credit_source not null,
  reason text,
  created_at timestamptz not null default now()
);
create index on public.credits_ledger (organization_id, created_at);

-- PROMPTS (globales y por org)
create type prompt_scope as enum ('global','organization');

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  scope prompt_scope not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  content text not null,     -- prompt base
  variables jsonb not null default '[]'::jsonb,
  version int not null default 1,
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- CONFIGURACIÓN GLOBAL (Superadmin)
create table public.global_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
-- ejemplo: ('credits_per_video', '10'), ('max_duration_sec','30')

-- VIDEO JOBS
create type job_status as enum ('queued','processing','completed','failed','canceled');

create table public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  status job_status not null default 'queued',
  provider text,                -- proveedor elegido
  provider_job_id text,         -- id en proveedor
  prompt_id uuid references public.prompts(id),
  prompt_version int,
  prompt_text_final text not null,
  parameters jsonb not null default '{}'::jsonb,   -- duración, aspect, estilo
  cost_credits int not null,    -- costo cobrado
  storage_video_path text,      -- path en Supabase Storage
  storage_thumbnail_path text,
  metadata jsonb not null default '{}'::jsonb,     -- códec, fps, duración real, etc.
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.video_jobs (project_id, created_at);
create index on public.video_jobs (status);

-- AUDIT LOGS
create table public.audit_logs (
  id bigserial primary key,
  organization_id uuid,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Insert default global settings
insert into public.global_settings (key, value) values 
  ('credits_per_video', '10'),
  ('max_duration_sec', '30'),
  ('supported_aspect_ratios', '["9:16", "1:1", "16:9"]');

-- Insert default global prompts
insert into public.prompts (scope, title, description, content, is_published, created_by) values 
  ('global', 'Producto Tecnológico', 'Prompt para videos de productos tecnológicos', 'Crea un video publicitario de 15-30 segundos para un producto tecnológico innovador. El video debe mostrar las características principales del producto, su diseño moderno y cómo mejora la vida del usuario. Incluye animaciones suaves y transiciones profesionales.', true, (select id from auth.users limit 1)),
  ('global', 'Servicio Profesional', 'Prompt para videos de servicios profesionales', 'Genera un video promocional de 20-30 segundos para un servicio profesional. Destaca los beneficios clave, la experiencia del equipo y los resultados que obtienen los clientes. Usa un tono profesional y confiable.', true, (select id from auth.users limit 1)),
  ('global', 'E-commerce', 'Prompt para videos de productos de e-commerce', 'Crea un video de producto para e-commerce de 10-20 segundos. Muestra el producto desde diferentes ángulos, destaca sus características únicas y crea una sensación de urgencia para la compra. Incluye elementos visuales atractivos.', true, (select id from auth.users limit 1));
