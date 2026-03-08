-- Migration: 007_update_settings_rls.sql
-- Allow both Owners and Editors to manage workspace settings (categories)

-- Drop existing restricted policies
drop policy if exists "Owners can insert settings" on public.workspace_settings;
drop policy if exists "Owners can update settings" on public.workspace_settings;

-- Create more inclusive policies
create policy "Owners and Editors can insert settings" on public.workspace_settings for insert
with check (public.get_workspace_role(workspace_id) in ('owner', 'editor'));

create policy "Owners and Editors can update settings" on public.workspace_settings for update
using (public.get_workspace_role(workspace_id) in ('owner', 'editor'));

comment on table public.workspace_settings is 'Workspace categories and types, editable by owners and editors';
