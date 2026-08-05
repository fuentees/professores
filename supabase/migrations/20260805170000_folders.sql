-- Fase 5: pastas e coleções (agrupamentos temáticos de materiais).

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  access_type public.content_access_type not null default 'teacher_only',
  status public.content_status not null default 'draft',
  published_at timestamptz,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_status_idx on public.folders (status);

create trigger set_folders_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

create table public.folder_contents (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  order_index integer not null default 0,
  unique (folder_id, content_id)
);

create index folder_contents_folder_id_idx on public.folder_contents (folder_id);
create index folder_contents_content_id_idx on public.folder_contents (content_id);

alter table public.folders enable row level security;
alter table public.folder_contents enable row level security;

create policy "folders_public_read" on public.folders
  for select to public
  using (status = 'published');

create policy "folders_admin_all" on public.folders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "folder_contents_read" on public.folder_contents
  for select to public using (true);

create policy "folder_contents_admin_all" on public.folder_contents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
