-- ═══════════════════════════════════════════════════════════════
-- Expensa – 003_workspace_updates.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Add email column to workspace invites
alter table public.workspace_invites add column if not exists email text not null;

-- 2. Create a VIEW to bypass RLS recursion
-- This view is used only by the security definer function
create or replace view public.workspace_members_view as select * from public.workspace_members;

-- 3. Create Security Definer Function to avoid RLS recursion
create or replace function public.get_workspace_role(ws_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  -- Query the VIEW instead of the table to avoid triggering RLS policies recursively
  select role into user_role from public.workspace_members_view
  where workspace_id = ws_id and user_id = auth.uid();
  return user_role;
end;
$$;

-- 4. Replace Workspace Members Policies
drop policy if exists "Users can view workspace members" on public.workspace_members;
drop policy if exists "Users can insert initial member" on public.workspace_members;
drop policy if exists "Owners can manage members" on public.workspace_members;
drop policy if exists "Owners can update members" on public.workspace_members;
drop policy if exists "Owners can insert members" on public.workspace_members;
drop policy if exists "Owners can delete members" on public.workspace_members;

-- Users can see all members of a workspace if they have ANY role in it
create policy "Users can view workspace members" on public.workspace_members for select
using (public.get_workspace_role(workspace_id) is not null);

-- System functions (initial creation via API/backend with service key) or Owners can insert
-- (Since we're doing initial member creation via backend or directly via client bypassing RLS, we only need Owner checks here)
create policy "Owners can insert members" on public.workspace_members for insert
with check (
  (user_id = auth.uid()) OR -- Allow creating own record on workspace setup
  (public.get_workspace_role(workspace_id) = 'owner')
);

create policy "Owners can delete members" on public.workspace_members for delete
using (public.get_workspace_role(workspace_id) = 'owner');

create policy "Owners can update members" on public.workspace_members for update
using (public.get_workspace_role(workspace_id) = 'owner');

-- 4. Replace other Policies using the new function
-- Workspaces
drop policy if exists "Users can view joined workspaces" on public.workspaces;
drop policy if exists "Owners can update workspace" on public.workspaces;
drop policy if exists "Owners can delete workspace" on public.workspaces;

create policy "Users can view joined workspaces" on public.workspaces for select
using (public.get_workspace_role(id) is not null);

create policy "Owners can update workspace" on public.workspaces for update
using (public.get_workspace_role(id) = 'owner');

create policy "Owners can delete workspace" on public.workspaces for delete
using (public.get_workspace_role(id) = 'owner');

-- Transactions
drop policy if exists "Members can view transactions" on public.transactions;
drop policy if exists "Editors can insert transactions" on public.transactions;
drop policy if exists "Editors can update transactions" on public.transactions;
drop policy if exists "Editors can delete transactions" on public.transactions;

create policy "Members can view transactions" on public.transactions for select
using (public.get_workspace_role(workspace_id) is not null);

create policy "Editors can insert transactions" on public.transactions for insert
with check (public.get_workspace_role(workspace_id) in ('editor', 'owner'));

create policy "Editors can update transactions" on public.transactions for update
using (public.get_workspace_role(workspace_id) in ('editor', 'owner'));

create policy "Editors can delete transactions" on public.transactions for delete
using (public.get_workspace_role(workspace_id) in ('editor', 'owner'));

-- Settings
drop policy if exists "Members can view settings" on public.workspace_settings;
drop policy if exists "Owners can insert settings" on public.workspace_settings;
drop policy if exists "Owners can update settings" on public.workspace_settings;

create policy "Members can view settings" on public.workspace_settings for select
using (public.get_workspace_role(workspace_id) is not null);

create policy "Owners can insert settings" on public.workspace_settings for insert
with check (public.get_workspace_role(workspace_id) = 'owner');

create policy "Owners can update settings" on public.workspace_settings for update
using (public.get_workspace_role(workspace_id) = 'owner');

-- Invites
drop policy if exists "Owners manage invites" on public.workspace_invites;
drop policy if exists "Owners delete invites" on public.workspace_invites;

create policy "Owners manage invites" on public.workspace_invites for insert
with check (public.get_workspace_role(workspace_id) = 'owner');

create policy "Owners delete invites" on public.workspace_invites for delete
using (public.get_workspace_role(workspace_id) = 'owner');
