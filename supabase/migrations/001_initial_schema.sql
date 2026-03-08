-- ═══════════════════════════════════════════════════════════════
-- Expensa – Supabase Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. TRANSACTIONS
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  type        text not null check (type in ('expense', 'income')),
  category    text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  note        text default '',
  recurring   boolean default false,
  recurring_freq text default 'monthly' check (recurring_freq in ('monthly','weekly','yearly')),
  created_at  timestamptz default now()
);

-- 2. USER SETTINGS (expense categories + income types per user)
create table if not exists public.user_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  expense_cats jsonb not null default '[]'::jsonb,
  income_types jsonb not null default '[]'::jsonb,
  updated_at   timestamptz default now()
);

-- 3. INDEXES
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx    on public.transactions(date);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date);

-- 4. ROW LEVEL SECURITY – users can only see/edit their own data
alter table public.transactions   enable row level security;
alter table public.user_settings  enable row level security;

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- User settings policies
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);
