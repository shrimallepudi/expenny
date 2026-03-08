-- Migration: 006_custom_categories.sql
-- Add custom_categories column to workspace_settings

alter table public.workspace_settings 
add column if not exists custom_categories jsonb not null default '[]'::jsonb;

comment on column public.workspace_settings.custom_categories is 'Stores workspace-specific category additions and edits';
