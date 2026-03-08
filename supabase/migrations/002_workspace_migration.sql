-- ═══════════════════════════════════════════════════════════════
-- Expensa – 002_workspace_migration.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Workspaces Table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create Workspace Members Table
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 3. Create Workspace Invites Table
create table if not exists public.workspace_invites (
  token uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz default now()
);

-- 4. Update existing User Settings to Workspace Settings
-- First rename table
alter table public.user_settings rename to workspace_settings;

-- Add workspace_id column (nullable temporarily)
alter table public.workspace_settings add column workspace_id uuid references public.workspaces(id) on delete cascade;

-- Remove unique constraint from user_id if it exists
alter table public.workspace_settings drop constraint if exists user_settings_user_id_key;

-- 5. Update existing Transactions
-- Add workspace_id column (nullable temporarily)
alter table public.transactions add column workspace_id uuid references public.workspaces(id) on delete cascade;

-- 6. MIGRATION OF EXISTING DATA
-- Create a workspace for every distinct user_id in workspace_settings and transactions
do $$
declare
    rec record;
    new_ws_id uuid;
begin
    -- Iterate over every unique user that has data
    for rec in 
        select distinct user_id from (
            select user_id from public.workspace_settings
            union
            select user_id from public.transactions
        ) as u
    loop
        -- Create a personal workspace
        insert into public.workspaces (name) values ('Personal Workspace') returning id into new_ws_id;
        
        -- Make the user the owner
        insert into public.workspace_members (workspace_id, user_id, role) values (new_ws_id, rec.user_id, 'owner');
        
        -- Update their settings to point to this workspace
        update public.workspace_settings set workspace_id = new_ws_id where user_id = rec.user_id;
        
        -- Update their transactions to point to this workspace
        update public.transactions set workspace_id = new_ws_id where user_id = rec.user_id;
    end loop;
end;
$$;

-- 7. DROP OLD POLICIES that depend on user_id
drop policy if exists "Users can view own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

drop policy if exists "Users can view own settings" on public.workspace_settings;
drop policy if exists "Users can insert own settings" on public.workspace_settings;
drop policy if exists "Users can update own settings" on public.workspace_settings;
drop policy if exists "Users can delete own settings" on public.workspace_settings;

-- 8. Make workspace_id NOT NULL and drop user_id from both tables
alter table public.workspace_settings alter column workspace_id set not null;
alter table public.workspace_settings drop column user_id cascade;

alter table public.transactions alter column workspace_id set not null;
alter table public.transactions drop column user_id cascade;

-- Ensure workspace_id is unique per workspace_settings (1 row per workspace max)
alter table public.workspace_settings add constraint workspace_settings_workspace_id_key unique (workspace_id);

-- 7. UPDATE INDEXES
drop index if exists transactions_user_id_idx;
drop index if exists transactions_user_date_idx;

create index transactions_workspace_id_idx on public.transactions(workspace_id);
create index transactions_workspace_date_idx on public.transactions(workspace_id, date);

-- 10. UPDATE RLS POLICIES

-- Enable RLS on new tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

-- ---------------------------------------------------------
-- Workspaces Policies
-- ---------------------------------------------------------
-- Users can view workspaces they are a member of
create policy "Users can view joined workspaces" on public.workspaces for select
using (exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid()));

-- Users can insert workspaces (they become owner via a separate insert to members)
create policy "Users can create workspaces" on public.workspaces for insert
with check (true);

-- Only owners can update/delete the workspace
create policy "Owners can update workspace" on public.workspaces for update
using (exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid() and role = 'owner'));

create policy "Owners can delete workspace" on public.workspaces for delete
using (exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid() and role = 'owner'));

-- ---------------------------------------------------------
-- Workspace Members Policies
-- ---------------------------------------------------------
-- Users can see all members of a workspace they belong to
create policy "Users can view workspace members" on public.workspace_members for select
using (exists (select 1 from public.workspace_members as wm where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid()));

-- Users can insert themselves creating a workspace (allow if no members exist yet) 
create policy "Users can insert initial member" on public.workspace_members for insert
with check (
  (user_id = auth.uid()) OR -- Can add self
  exists (select 1 from public.workspace_members where workspace_id = workspace_members.workspace_id and user_id = auth.uid() and role = 'owner') -- Or owner can add
);

-- Only owners can update roles or remove members
create policy "Owners can manage members" on public.workspace_members for delete
using (exists (select 1 from public.workspace_members where workspace_id = workspace_members.workspace_id and user_id = auth.uid() and role = 'owner'));

create policy "Owners can update members" on public.workspace_members for update
using (exists (select 1 from public.workspace_members where workspace_id = workspace_members.workspace_id and user_id = auth.uid() and role = 'owner'));


-- ---------------------------------------------------------
-- Transactions Policies
-- ---------------------------------------------------------
-- Viewers, Editors, Owners can SELECT
create policy "Members can view transactions" on public.transactions for select
using (exists (select 1 from public.workspace_members where workspace_id = transactions.workspace_id and user_id = auth.uid()));

-- Editors and Owners can INSERT, UPDATE, DELETE
create policy "Editors can insert transactions" on public.transactions for insert
with check (exists (select 1 from public.workspace_members where workspace_id = transactions.workspace_id and user_id = auth.uid() and role in ('editor', 'owner')));

create policy "Editors can update transactions" on public.transactions for update
using (exists (select 1 from public.workspace_members where workspace_id = transactions.workspace_id and user_id = auth.uid() and role in ('editor', 'owner')));

create policy "Editors can delete transactions" on public.transactions for delete
using (exists (select 1 from public.workspace_members where workspace_id = transactions.workspace_id and user_id = auth.uid() and role in ('editor', 'owner')));

-- ---------------------------------------------------------
-- Workspace Settings Policies
-- ---------------------------------------------------------
-- All members can SELECT
create policy "Members can view settings" on public.workspace_settings for select
using (exists (select 1 from public.workspace_members where workspace_id = workspace_settings.workspace_id and user_id = auth.uid()));

-- Only Owners can edit settings
create policy "Owners can insert settings" on public.workspace_settings for insert
with check (exists (select 1 from public.workspace_members where workspace_id = workspace_settings.workspace_id and user_id = auth.uid() and role = 'owner'));

create policy "Owners can update settings" on public.workspace_settings for update
using (exists (select 1 from public.workspace_members where workspace_id = workspace_settings.workspace_id and user_id = auth.uid() and role = 'owner'));

-- ---------------------------------------------------------
-- Workspace Invites Policies
-- ---------------------------------------------------------
-- Anyone can view an invite by its token to resolve it
create policy "Invites are readable" on public.workspace_invites for select using (true);

-- Owners can insert/delete invites
create policy "Owners manage invites" on public.workspace_invites for insert
with check (exists (select 1 from public.workspace_members where workspace_id = workspace_invites.workspace_id and user_id = auth.uid() and role = 'owner'));

create policy "Owners delete invites" on public.workspace_invites for delete
using (exists (select 1 from public.workspace_members where workspace_id = workspace_invites.workspace_id and user_id = auth.uid() and role = 'owner'));

-- 9. Trigger for New User Welcome Workspace
-- Instead of doing it in the app code, we handle it in db.js or api.
