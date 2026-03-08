-- ═══════════════════════════════════════════════════════════════
-- Expensa – 004_workspace_logs_and_rename.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Workspace Logs Table
create table if not exists public.workspace_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- e.g., 'INSERT', 'UPDATE', 'DELETE'
  entity_type text not null, -- e.g., 'transactions'
  entity_id uuid,
  details jsonb, -- Stores relevant metadata like category name or amount
  created_at timestamptz default now()
);

-- Index for fast lookup in a workspace
create index if not exists workspace_logs_workspace_id_idx on public.workspace_logs(workspace_id);

-- 2. Secure Users View (to allow joining for emails in the UI)
create or replace view public.users_view as 
select id, email from auth.users;

-- Grant access to authenticated users
grant select on public.users_view to authenticated;

-- 3. RLS for Logs
alter table public.workspace_logs enable row level security;

drop policy if exists "Members can view workspace logs" on public.workspace_logs;
create policy "Members can view workspace logs" on public.workspace_logs for select
using (public.get_workspace_role(workspace_id) is not null);

-- 3. Audit Log Trigger Function
create or replace function public.log_workspace_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  u_id uuid;
  ent_id uuid;
  ent_type text;
  det jsonb;
begin
  u_id := auth.uid();
  ent_type := TG_TABLE_NAME;
  
  -- Only handle transactions
  if (TG_TABLE_NAME = 'transactions') then
    if (TG_OP = 'DELETE') then
      ws_id := OLD.workspace_id;
      ent_id := OLD.id;
      det := jsonb_build_object('category', OLD.category, 'amount', OLD.amount, 'type', OLD.type);
    else
      ws_id := NEW.workspace_id;
      ent_id := NEW.id;
      det := jsonb_build_object('category', NEW.category, 'amount', NEW.amount, 'type', NEW.type);
    end if;
  else
    return null;
  end if;

  insert into public.workspace_logs (workspace_id, user_id, action, entity_type, entity_id, details)
  values (ws_id, u_id, TG_OP, ent_type, ent_id, det);

  return null;
end;
$$;

-- 4. Apply Triggers (Only for Transactions)
drop trigger if exists tr_log_transactions on public.transactions;
create trigger tr_log_transactions
after insert or update or delete on public.transactions
for each row execute function public.log_workspace_activity();

-- (Removing settings and members triggers as per user request)
drop trigger if exists tr_log_settings on public.workspace_settings;
drop trigger if exists tr_log_members on public.workspace_members;
