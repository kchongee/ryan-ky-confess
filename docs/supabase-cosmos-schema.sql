-- Supabase schema for the long-term "小宇宙" version.
-- Run this in Supabase SQL editor after creating the project.
-- Keep the service role key only on the server in Vercel env vars.

create table if not exists public.site_config (
  id text primary key default 'default',
  site_mode text not null default 'confession' check (site_mode in ('confession', 'cosmos')),
  start_date date not null default '2026-03-25',
  confession_date date not null default '2026-05-21',
  couple_title text not null default '我们的秘密小宇宙',
  her_nickname text,
  first_date_choice text check (first_date_choice in ('dinner', 'movie', 'walk', 'you')),
  upload_enabled boolean not null default false,
  passcode_enabled boolean not null default false,
  debug_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.cosmos_snapshots (
  id text primary key default 'default',
  nickname text not null default '你',
  permission_choice text check (permission_choice in ('once', 'forever')),
  first_date_choice text check (first_date_choice in ('dinner', 'movie', 'walk', 'you')),
  is_soft_choice boolean not null default false,
  heartbeat_match text not null default '99.9%',
  confession_date date not null default '2026-05-21',
  unlocked_at timestamptz not null default now()
);

create table if not exists public.memories (
  id text primary key,
  date_label text not null,
  title text not null,
  note text not null,
  rotate text not null default '0deg',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  date date not null,
  title text not null,
  body text not null,
  type text not null default 'memory' check (type in ('chapter', 'memory', 'date')),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id text primary key,
  body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key,
  name text not null,
  note text not null,
  status text not null default 'maybe' check (status in ('planned', 'maybe', 'done')),
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id text primary key,
  image_url text not null,
  caption text not null,
  date date not null,
  source text not null default 'upload' check (source in ('mock', 'upload', 'camera')),
  created_at timestamptz not null default now()
);

alter table public.site_config enable row level security;
alter table public.cosmos_snapshots enable row level security;
alter table public.memories enable row level security;
alter table public.events enable row level security;
alter table public.notes enable row level security;
alter table public.places enable row level security;
alter table public.photos enable row level security;

insert into public.site_config (id)
values ('default')
on conflict (id) do nothing;
