-- Fase 1: perfis de usuário (admin / teacher) e sincronização com auth.users

create type public.user_role as enum ('admin', 'teacher');
create type public.user_status as enum ('active', 'blocked', 'pending');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'teacher',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

-- Mantém updated_at em dia a cada alteração.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Cria automaticamente um profile (role = teacher) quando alguém se cadastra
-- via Supabase Auth. O primeiro administrador deve ser promovido manualmente
-- (ver seed.sql) — não existe cadastro de admin pela interface pública.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Um usuário autenticado pode ver e editar apenas o próprio perfil,
-- mas não pode alterar seu próprio role/status (só o admin pode).
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (
    auth_user_id = auth.uid()
    and role = (select role from public.profiles where auth_user_id = auth.uid())
    and status = (select status from public.profiles where auth_user_id = auth.uid())
  );

-- Função auxiliar (security definer) para checar se o usuário atual é admin
-- sem recursão infinita de RLS dentro das próprias policies de profiles.
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_admin_select_all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_admin_update_all"
  on public.profiles for update
  to authenticated
  using (public.is_admin());
