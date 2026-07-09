-- Rode este script no Supabase (SQL Editor) uma única vez.

create table if not exists financeiro_dados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contas jsonb not null default '[]'::jsonb,
  faturamento jsonb not null default '{}'::jsonb,
  lembretes jsonb not null default '[]'::jsonb,
  lembretes_status jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table financeiro_dados enable row level security;

create policy "select_own_data" on financeiro_dados
  for select using (auth.uid() = user_id);

create policy "insert_own_data" on financeiro_dados
  for insert with check (auth.uid() = user_id);

create policy "update_own_data" on financeiro_dados
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
