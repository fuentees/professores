-- Fecha a separacao entre administracao de conteudo e propriedade tambem
-- no banco. As telas e Server Actions ja exigem is_owner; estas policies
-- impedem que um admin comum contorne essa regra pela API do Supabase.

-- Administradores bloqueados nao conservam privilegios pela API.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
      and is_owner = true
  );
$$;

-- Um admin comum pode administrar professores, mas nao pode promover a si
-- mesmo, alterar outro admin ou conceder a permissao de proprietario.
drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all" on public.profiles
  for update to authenticated
  using (
    public.is_owner()
    or (public.is_admin() and role = 'teacher' and is_owner = false)
  )
  with check (
    public.is_owner()
    or (public.is_admin() and role = 'teacher' and is_owner = false)
  );

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (new.role is distinct from old.role or new.is_owner is distinct from old.is_owner)
     and not public.is_owner() then
    raise exception 'Apenas o proprietario pode alterar funcoes administrativas.';
  end if;

  -- Evita que a plataforma fique sem nenhum proprietario ativo, inclusive
  -- por mudanca direta de role ou status.
  if old.role = 'admin'
     and old.status = 'active'
     and old.is_owner = true
     and not (new.role = 'admin' and new.status = 'active' and new.is_owner = true)
     and not exists (
       select 1
       from public.profiles
       where id <> old.id
         and role = 'admin'
         and status = 'active'
         and is_owner = true
     ) then
    raise exception 'Precisa haver pelo menos um proprietario ativo.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update of role, status, is_owner on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Planos: admins podem consultar para atender professores; somente o dono
-- pode criar, alterar ou excluir a oferta comercial.
drop policy if exists "plans_admin_all" on public.plans;
create policy "plans_admin_read" on public.plans
  for select to authenticated using (public.is_admin());
create policy "plans_owner_all" on public.plans
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Solicitacoes e configuracoes gerais pertencem exclusivamente ao dono.
drop policy if exists "subscription_requests_admin_all" on public.subscription_requests;
create policy "subscription_requests_owner_all" on public.subscription_requests
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_owner_all" on public.site_settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
