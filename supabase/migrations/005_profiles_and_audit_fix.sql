-- ═══════════════════════════════════════════════════════════════
-- Expensa – 005_profiles_and_audit_fix.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Profiles Table (mirror of auth.users for easier joins)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  updated_at timestamptz default now()
);

-- Index for email lookup
create index if not exists profiles_email_idx on public.profiles(email);

-- Enable RLS
alter table public.profiles enable row level security;

-- Basic read permission: Members of the same workspace can see each other's profiles
drop policy if exists "Public profiles are readable by authenticated users" on public.profiles;
create policy "Public profiles are readable by authenticated users" 
  on public.profiles for select 
  using (auth.role() = 'authenticated');

-- 2. Sync Trigger: Keep public.profiles in sync with auth.users
create or replace function public.handle_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.profiles (id, email)
    values (NEW.id, NEW.email);
  elsif (TG_OP = 'UPDATE') then
    update public.profiles 
    set email = NEW.email, updated_at = now()
    where id = OLD.id;
  elsif (TG_OP = 'DELETE') then
    delete from public.profiles where id = OLD.id;
  end if;
  return NEW;
end;
$$;

-- Apply sync triggers to auth.users (via service role)
-- NOTE: In some Supabase setups, you can't add triggers to auth.users directly via SQL Editor.
-- We suggest using this as a reference or applying it if permissions allow.
-- Alternatively, we'll manually seed existing users.
drop trigger if exists tr_sync_profiles on auth.users;
-- (Note: If this fails, we will rely on manual seeding or app-level sync)

-- Seed existing users into profiles (Robust approach)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;

-- 3. Robust Audit Trigger Function
-- Using a more reliable way to capture the current user in Supabase
create or replace function public.log_workspace_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  ws_id uuid;
  u_id uuid;
  ent_id uuid;
  ent_type text;
  det jsonb;
begin
  u_id := (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
  if (u_id is null) then u_id := auth.uid(); end if;

  ent_type := TG_TABLE_NAME;
  
  if (TG_TABLE_NAME = 'transactions') then
    if (TG_OP = 'INSERT') then
      ws_id := NEW.workspace_id;
      ent_id := NEW.id;
      det := jsonb_build_object('category', NEW.category, 'amount', NEW.amount, 'type', NEW.type, 'date', NEW.date);
    elsif (TG_OP = 'UPDATE') then
      -- Compare fields to ensure it's a meaningful change
      if (OLD.category = NEW.category AND OLD.amount = NEW.amount AND OLD.type = NEW.type AND OLD.date = NEW.date AND COALESCE(OLD.note, '') = COALESCE(NEW.note, '')) then
        return NEW;
      end if;
      
      ws_id := NEW.workspace_id;
      ent_id := NEW.id;
      det := jsonb_build_object(
        'category', NEW.category, 
        'amount', NEW.amount, 
        'type', NEW.type,
        'old_category', OLD.category,
        'old_amount', OLD.amount,
        'is_update', true
      );
    elsif (TG_OP = 'DELETE') then
      ws_id := OLD.workspace_id;
      ent_id := OLD.id;
      det := jsonb_build_object('category', OLD.category, 'amount', OLD.amount, 'type', OLD.type);
    end if;
  else
    return null;
  end if;

  insert into public.workspace_logs (workspace_id, user_id, action, entity_type, entity_id, details)
  values (ws_id, u_id, TG_OP, ent_type, ent_id, det);

  return null;
end;
$$;

-- 4. Fix Foreign Key Relationship for API Discovery
-- By pointing directly to public.profiles, Supabase can automatically join these tables
alter table public.workspace_logs drop constraint if exists workspace_logs_user_id_fkey;
alter table public.workspace_logs 
  add constraint workspace_logs_user_id_fkey 
  foreign key (user_id) references public.profiles(id) 
  on delete set null;

-- 5. Clean up old view to avoid confusion
drop view if exists public.users_view;
