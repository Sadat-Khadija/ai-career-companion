-- Core tables
create extension if not exists "pgcrypto";

create table if not exists job_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  company text not null,
  url text,
  raw_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_analysis (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references job_posts(id) on delete cascade,
  user_id uuid not null,
  summary text,
  skills_required jsonb,
  nice_to_have jsonb,
  checklist jsonb,
  created_at timestamptz not null default now()
);

create table if not exists resume_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  job_post_id uuid references job_posts(id) on delete cascade,
  resume_text text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table job_posts enable row level security;
alter table ai_analysis enable row level security;
alter table resume_snapshots enable row level security;

create policy "Owners can insert job posts" on job_posts
  for insert with check (auth.uid() = user_id);

create policy "Owners can read job posts" on job_posts
  for select using (auth.uid() = user_id);

create policy "Owners can update job posts" on job_posts
  for update using (auth.uid() = user_id);

create policy "Owners can delete job posts" on job_posts
  for delete using (auth.uid() = user_id);

create policy "Owners can insert analyses" on ai_analysis
  for insert with check (auth.uid() = user_id);

create policy "Owners can read analyses" on ai_analysis
  for select using (auth.uid() = user_id);

create policy "Owners can update analyses" on ai_analysis
  for update using (auth.uid() = user_id);

create policy "Owners can delete analyses" on ai_analysis
  for delete using (auth.uid() = user_id);

create policy "Owners can insert resume snapshots" on resume_snapshots
  for insert with check (auth.uid() = user_id);

create policy "Owners can read resume snapshots" on resume_snapshots
  for select using (auth.uid() = user_id);

create policy "Owners can delete resume snapshots" on resume_snapshots
  for delete using (auth.uid() = user_id);
