
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'Tag',
  color text not null default '#2563eb',
  subcategories jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "own categories all" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Months
create table public.months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_month text not null,
  income numeric not null default 0,
  savings_contrib numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, year_month)
);
alter table public.months enable row level security;
create policy "own months all" on public.months for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Incomes extra
create table public.incomes_extra (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.months(id) on delete cascade,
  description text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.incomes_extra enable row level security;
create policy "own incomes_extra all" on public.incomes_extra for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bills
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.months(id) on delete cascade,
  category text not null,
  subcategory text,
  description text not null,
  amount numeric not null default 0,
  due_day int,
  paid boolean not null default false,
  is_recurring boolean not null default false,
  installment_current int,
  installment_total int,
  parent_id uuid,
  created_at timestamptz not null default now()
);
alter table public.bills enable row level security;
create policy "own bills all" on public.bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index bills_month_idx on public.bills(month_id);

-- Savings log
create table public.savings_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('add','withdraw')),
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.savings_log enable row level security;
create policy "own savings_log all" on public.savings_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile + default categories on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  insert into public.categories (user_id, name, icon, color, subcategories, sort_order) values
    (new.id, 'Moradia', 'Home', '#2563eb', '["Aluguel","Condomínio","Energia","Água","Internet"]'::jsonb, 1),
    (new.id, 'Alimentação', 'UtensilsCrossed', '#059669', '["Mercado","Restaurante","Delivery"]'::jsonb, 2),
    (new.id, 'Transporte', 'Car', '#d97706', '["Combustível","Transporte App","Manutenção"]'::jsonb, 3),
    (new.id, 'Saúde', 'HeartPulse', '#dc2626', '["Plano","Farmácia","Consultas"]'::jsonb, 4),
    (new.id, 'Lazer', 'Gamepad2', '#7c3aed', '["Streaming","Cinema","Viagens"]'::jsonb, 5),
    (new.id, 'Outros', 'MoreHorizontal', '#6b7280', '[]'::jsonb, 6);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
