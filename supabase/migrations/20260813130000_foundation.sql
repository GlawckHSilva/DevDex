create extension if not exists pgcrypto;

create type public.content_status as enum ('draft','review','published','deprecated');
create type public.mission_type as enum ('tutorial','coding_challenge','bug_hunt','support','project','boss');
create type public.difficulty as enum ('beginner','easy','medium','hard','expert');
create type public.runtime as enum ('html_css','javascript','sql');
create type public.mission_state as enum ('available','in_progress','completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  level integer not null default 1 check (level > 0),
  total_xp integer not null default 0 check (total_xp >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_study_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  technology_id uuid not null references public.technologies(id),
  version text not null,
  supported_version text,
  current_known_version text,
  last_reviewed_at timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (technology_id, version)
);

create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id),
  slug text not null unique,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths(id),
  slug text not null,
  name text not null,
  description text not null,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learning_path_id, slug)
);

create table public.skill_prerequisites (
  skill_id uuid not null references public.skills(id) on delete cascade,
  prerequisite_skill_id uuid not null references public.skills(id) on delete cascade,
  minimum_mastery integer not null default 75 check (minimum_mastery between 0 and 100),
  primary key (skill_id, prerequisite_skill_id),
  check (skill_id <> prerequisite_skill_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id),
  slug text not null,
  title text not null,
  body jsonb not null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, slug)
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id),
  lesson_id uuid references public.lessons(id),
  slug text not null unique,
  title text not null,
  briefing text not null,
  instructions jsonb not null,
  starter_code text not null default '',
  runtime public.runtime not null,
  type public.mission_type not null,
  difficulty public.difficulty not null,
  xp_reward integer not null check (xp_reward > 0),
  time_limit_ms integer not null default 5000 check (time_limit_ms between 100 and 30000),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mission_tests (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  name text not null,
  source text not null,
  is_private boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_learning_paths (
  user_id uuid not null references public.profiles(id) on delete cascade,
  learning_path_id uuid not null references public.learning_paths(id),
  started_at timestamptz not null default now(),
  primary key (user_id, learning_path_id)
);

create table public.user_skill_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  mastery integer not null default 0 check (mastery between 0 and 100),
  successful_attempts integer not null default 0 check (successful_attempts >= 0),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id),
  state public.mission_state not null default 'available',
  attempts integer not null default 0 check (attempts >= 0),
  hints_used integer not null default 0 check (hints_used >= 0),
  best_score real not null default 0 check (best_score between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

create table public.user_xp_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id),
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.curriculum_sources (
  id uuid primary key default gen_random_uuid(),
  technology_id uuid not null references public.technologies(id),
  url text not null,
  source_version text,
  checked_at timestamptz not null default now(),
  detected_change text,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_missions_user_state_idx on public.user_missions(user_id, state);
create index user_skill_review_idx on public.user_skill_progress(user_id, next_review_at);
create index missions_skill_status_idx on public.missions(skill_id, status, sort_order);
create index xp_history_user_created_idx on public.user_xp_history(user_id, created_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','technologies','curriculum_versions','learning_paths','skills','lessons','missions','mission_tests','user_skill_progress','user_missions','curriculum_sources'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();

alter table public.profiles enable row level security;
alter table public.technologies enable row level security;
alter table public.curriculum_versions enable row level security;
alter table public.learning_paths enable row level security;
alter table public.skills enable row level security;
alter table public.skill_prerequisites enable row level security;
alter table public.lessons enable row level security;
alter table public.missions enable row level security;
alter table public.mission_tests enable row level security;
alter table public.user_learning_paths enable row level security;
alter table public.user_skill_progress enable row level security;
alter table public.user_missions enable row level security;
alter table public.user_xp_history enable row level security;
alter table public.curriculum_sources enable row level security;

create policy "published technologies are readable" on public.technologies for select using (status = 'published');
create policy "published curriculum versions are readable" on public.curriculum_versions for select using (status = 'published');
create policy "published paths are readable" on public.learning_paths for select using (status = 'published');
create policy "published skills are readable" on public.skills for select using (status = 'published');
create policy "prerequisites are readable" on public.skill_prerequisites for select using (true);
create policy "published lessons are readable" on public.lessons for select using (status = 'published');
create policy "published missions are readable" on public.missions for select using (status = 'published');

create policy "users read own profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "users manage own paths" on public.user_learning_paths for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users read own skill progress" on public.user_skill_progress for select using ((select auth.uid()) = user_id);
create policy "users read own missions" on public.user_missions for select using ((select auth.uid()) = user_id);
create policy "users read own xp" on public.user_xp_history for select using ((select auth.uid()) = user_id);

revoke all on public.mission_tests from anon, authenticated;
revoke insert, update, delete on public.user_skill_progress, public.user_missions, public.user_xp_history from anon, authenticated;
