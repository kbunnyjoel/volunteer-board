-- Enable UUID generation helpers
create extension if not exists "uuid-ossp";

create table if not exists public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  organization text not null,
  location text not null,
  description text not null,
  date date not null,
  tags text[] not null default '{}',
  spots_remaining integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.signups (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  volunteer_name text not null,
  volunteer_email text not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists signups_opportunity_id_idx
  on public.signups (opportunity_id);
