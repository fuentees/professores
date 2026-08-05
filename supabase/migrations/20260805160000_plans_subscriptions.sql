-- Fase 4: planos de acesso, assinaturas (liberadas manualmente pelo admin no
-- MVP) e liberações de acesso individuais.

create type public.billing_period as enum ('free', 'monthly', 'yearly');
create type public.subscription_status as enum ('active', 'expired', 'canceled');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null default 0,
  billing_period public.billing_period not null default 'free',
  download_limit integer,
  features jsonb not null default '[]'::jsonb,
  status public.active_status not null default 'active',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_provider text,
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_teacher_id_idx on public.subscriptions (teacher_id);
create index subscriptions_status_idx on public.subscriptions (status);

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Liberação individual de acesso a um material específico, independente de
-- plano (ex: cortesia para um professor). course_id/folder_id ficam
-- reservados para quando essas entidades existirem (Fase 5).
create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid references public.contents (id) on delete cascade,
  course_id uuid,
  folder_id uuid,
  granted_by uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index access_grants_teacher_id_idx on public.access_grants (teacher_id);
create index access_grants_content_id_idx on public.access_grants (content_id);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.access_grants enable row level security;

create policy "plans_public_read" on public.plans
  for select to public using (status = 'active');
create policy "plans_admin_all" on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subscriptions_own_read" on public.subscriptions
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "subscriptions_admin_all" on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "access_grants_own_read" on public.access_grants
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "access_grants_admin_all" on public.access_grants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
