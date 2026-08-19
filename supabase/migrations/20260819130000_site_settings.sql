-- Configurações gerais do site (singleton): e-mail de suporte exibido no
-- rodapé público, e um modo de manutenção que o proprietário pode ligar pra
-- tirar o site público do ar temporariamente sem afetar quem já está logado
-- (professores/admins continuam acessando /painel e /admin normalmente).
create table public.site_settings (
  id boolean primary key default true,
  support_email text,
  maintenance_mode boolean not null default false,
  maintenance_message text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id) values (true);

create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

-- Leitura pública: precisa ser lido no layout público (anônimo) pra decidir
-- se mostra manutenção, e o e-mail de suporte aparece no rodapé pra
-- qualquer visitante.
create policy "site_settings_public_read" on public.site_settings
  for select to public using (true);

create policy "site_settings_admin_all" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
