// Type definitions for IA-Marketing platform

export type OrgRole = 'admin' | 'member' | 'superadmin';
export type ProjectRole = 'owner' | 'member';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';
export type CreditSource = 'allocation' | 'debit' | 'refund' | 'adjustment';
export type PromptScope = 'global' | 'organization';
export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'inactive';

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  plan: OrgPlan;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
}

export interface OrgWallet {
  organization_id: string;
  balance: number;
  updated_at: string;
}

export interface ProjectCreditLimit {
  project_id: string;
  monthly_cap: number;
  month_key: string;
  used_this_month: number;
  updated_at: string;
}

export interface CreditsLedger {
  id: number;
  organization_id: string;
  project_id: string | null;
  user_id: string | null;
  video_id: string | null;
  delta: number;
  source: CreditSource;
  reason: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  scope: PromptScope;
  organization_id: string | null;
  title: string;
  description: string | null;
  content: string;
  variables: any[];
  version: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface GlobalSetting {
  key: string;
  value: any;
  updated_at: string;
}

export interface VideoJob {
  id: string;
  organization_id: string;
  project_id: string;
  user_id: string;
  status: JobStatus;
  provider: string | null;
  provider_job_id: string | null;
  prompt_id: string | null;
  prompt_version: number | null;
  prompt_text_final: string;
  parameters: any;
  cost_credits: number;
  storage_video_path: string | null;
  storage_thumbnail_path: string | null;
  metadata: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

// Extended types with relationships
export interface ProjectWithDetails extends Project {
  organization: Organization;
  members: ProjectMember[];
  credit_limit: ProjectCreditLimit | null;
  video_count: number;
  used_credits_this_month: number;
}

export interface VideoJobWithDetails extends VideoJob {
  project: Project;
  prompt: Prompt | null;
  user_profile: Profile | null;
}

export interface OrganizationWithDetails extends Organization {
  members: OrganizationMember[];
  wallet: OrgWallet | null;
  projects: Project[];
  total_credits_used: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Form types
export interface CreateOrganizationForm {
  name: string;
}

export interface CreateProjectForm {
  name: string;
  organization_id: string;
}

export interface CreateVideoJobForm {
  project_id: string;
  prompt_id?: string;
  prompt_text: string;
  parameters: {
    duration?: number;
    aspect_ratio?: string;
    style?: string;
  };
}

export interface AdjustCreditsForm {
  organization_id: string;
  delta: number;
  reason: string;
}

export interface CreatePromptForm {
  scope: PromptScope;
  organization_id?: string;
  title: string;
  description?: string;
  content: string;
  variables?: any[];
}

// User context types
export interface UserContext {
  user: any; // Supabase user
  profile: Profile | null;
  organizations: OrganizationWithDetails[];
  current_organization: OrganizationWithDetails | null;
  is_superadmin: boolean;
}

// Video generation parameters
export interface VideoParameters {
  duration?: number; // seconds
  aspect_ratio?: '9:16' | '1:1' | '16:9';
  style?: string;
  quality?: 'low' | 'medium' | 'high';
}

// Webhook types
export interface VideoProviderWebhook {
  job_id: string;
  status: JobStatus;
  video_url?: string;
  thumbnail_url?: string;
  error_message?: string;
  metadata?: any;
}
