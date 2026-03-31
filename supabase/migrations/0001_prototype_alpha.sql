-- Prototype Alpha: durable JSON documents + metadata for lists.
-- Run in Supabase SQL editor or via CLI. RLS off for Alpha simplicity.

create table if not exists public.case_studies (
  id text primary key,
  title text not null,
  updated_at timestamptz not null,
  status text not null,
  tags text[] not null default '{}',
  document jsonb not null
);

create table if not exists public.wdl_templates (
  id text primary key,
  case_study_id text,
  title text not null,
  updated_at timestamptz not null,
  status text not null,
  document jsonb not null
);

create table if not exists public.wdl_submissions (
  id text primary key,
  case_study_id text not null,
  template_id text not null,
  student_actor_id text,
  updated_at timestamptz not null,
  submitted_at timestamptz,
  document jsonb not null
);

create index if not exists idx_wdl_submissions_case_template
  on public.wdl_submissions (case_study_id, template_id);

alter table public.case_studies disable row level security;
alter table public.wdl_templates disable row level security;
alter table public.wdl_submissions disable row level security;
