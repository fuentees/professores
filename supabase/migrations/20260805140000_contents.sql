-- Fase 3: materiais (conteúdos), seus relacionamentos taxonômicos, arquivos,
-- tags, favoritos e registro de visualizações/downloads.

create type public.content_status as enum ('draft', 'scheduled', 'published', 'hidden', 'archived');
create type public.content_access_type as enum ('public', 'free_signup', 'teacher_only', 'subscriber_only');
create type public.content_difficulty as enum ('easy', 'medium', 'hard');

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  short_description text,
  body text,
  cover_url text,
  author text,
  difficulty public.content_difficulty,
  access_type public.content_access_type not null default 'teacher_only',
  status public.content_status not null default 'draft',
  allow_view boolean not null default true,
  allow_download boolean not null default true,
  allow_print boolean not null default true,
  allow_comments boolean not null default false,
  has_answer_key boolean not null default false,
  is_featured boolean not null default false,
  publish_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index contents_status_idx on public.contents (status);
create index contents_access_type_idx on public.contents (access_type);
create index contents_publish_at_idx on public.contents (publish_at);
create index contents_is_featured_idx on public.contents (is_featured);

create trigger set_contents_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- Relacionamentos N:N com a estrutura pedagógica -----------------------------

create table public.content_grades (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  grade_id uuid not null references public.grades (id) on delete cascade,
  unique (content_id, grade_id)
);

create table public.content_subjects (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unique (content_id, subject_id)
);

create table public.content_units (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  curriculum_unit_id uuid not null references public.curriculum_units (id) on delete cascade,
  unique (content_id, curriculum_unit_id)
);

create table public.content_themes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  theme_id uuid not null references public.themes (id) on delete cascade,
  unique (content_id, theme_id)
);

create table public.content_subthemes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  subtheme_id uuid not null references public.subthemes (id) on delete cascade,
  unique (content_id, subtheme_id)
);

create table public.content_content_types (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  content_type_id uuid not null references public.content_types (id) on delete cascade,
  unique (content_id, content_type_id)
);

create index content_grades_content_id_idx on public.content_grades (content_id);
create index content_subjects_content_id_idx on public.content_subjects (content_id);
create index content_units_content_id_idx on public.content_units (content_id);
create index content_themes_content_id_idx on public.content_themes (content_id);
create index content_subthemes_content_id_idx on public.content_subthemes (content_id);
create index content_content_types_content_id_idx on public.content_content_types (content_id);

create index content_grades_grade_id_idx on public.content_grades (grade_id);
create index content_subjects_subject_id_idx on public.content_subjects (subject_id);

-- Tags -----------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.active_status not null default 'active'
);

create table public.content_tags (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  unique (content_id, tag_id)
);

create index content_tags_content_id_idx on public.content_tags (content_id);

-- Arquivos ---------------------------------------------------------------------

create table public.content_files (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  name text not null,
  storage_path text not null,
  file_type text not null,
  mime_type text not null,
  file_size bigint not null,
  allow_download boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index content_files_content_id_idx on public.content_files (content_id);

-- Favoritos, visualizações e downloads ------------------------------------------

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, content_id)
);

create table public.content_views (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles (id) on delete set null,
  content_id uuid not null references public.contents (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index content_views_content_id_idx on public.content_views (content_id);
create index content_views_teacher_id_idx on public.content_views (teacher_id);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles (id) on delete set null,
  content_id uuid not null references public.contents (id) on delete cascade,
  content_file_id uuid references public.content_files (id) on delete set null,
  downloaded_at timestamptz not null default now(),
  ip_address text
);

create index downloads_content_id_idx on public.downloads (content_id);
create index downloads_teacher_id_idx on public.downloads (teacher_id);

-- RLS ----------------------------------------------------------------------------

alter table public.contents enable row level security;
alter table public.content_grades enable row level security;
alter table public.content_subjects enable row level security;
alter table public.content_units enable row level security;
alter table public.content_themes enable row level security;
alter table public.content_subthemes enable row level security;
alter table public.content_content_types enable row level security;
alter table public.tags enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_files enable row level security;
alter table public.favorites enable row level security;
alter table public.content_views enable row level security;
alter table public.downloads enable row level security;

-- contents: qualquer um (inclusive anônimo) enxerga apenas publicados e já
-- liberados pela data de agendamento; admin enxerga e edita tudo.
create policy "contents_public_read_published" on public.contents
  for select to public
  using (status = 'published' and (publish_at is null or publish_at <= now()));

create policy "contents_admin_all" on public.contents
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Tabelas de relacionamento: leitura pública livre (só listam vínculos, sem
-- dado sensível) — o filtro de acesso real acontece na tabela contents.
-- A escrita é exclusiva do admin.
create policy "content_grades_read" on public.content_grades for select to public using (true);
create policy "content_grades_admin_all" on public.content_grades for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_subjects_read" on public.content_subjects for select to public using (true);
create policy "content_subjects_admin_all" on public.content_subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_units_read" on public.content_units for select to public using (true);
create policy "content_units_admin_all" on public.content_units for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_themes_read" on public.content_themes for select to public using (true);
create policy "content_themes_admin_all" on public.content_themes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_subthemes_read" on public.content_subthemes for select to public using (true);
create policy "content_subthemes_admin_all" on public.content_subthemes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_content_types_read" on public.content_content_types for select to public using (true);
create policy "content_content_types_admin_all" on public.content_content_types for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tags_public_read" on public.tags for select to public using (status = 'active');
create policy "tags_admin_all" on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_tags_read" on public.content_tags for select to public using (true);
create policy "content_tags_admin_all" on public.content_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- content_files: nunca públicos. Apenas dono da sessão (autenticado) pode
-- listar metadados de arquivos de conteúdo publicado; download real passa
-- por URL assinada gerada em Server Action, nunca pela leitura direta desta
-- tabela por anônimos.
create policy "content_files_authenticated_read" on public.content_files
  for select to authenticated
  using (
    exists (
      select 1 from public.contents c
      where c.id = content_files.content_id
        and c.status = 'published'
        and (c.publish_at is null or c.publish_at <= now())
    )
  );

create policy "content_files_admin_all" on public.content_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- favorites / content_views / downloads: cada professor só enxerga e cria os
-- próprios registros; admin enxerga tudo (para relatórios).
create policy "favorites_own" on public.favorites
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "favorites_admin_read" on public.favorites
  for select to authenticated using (public.is_admin());

create policy "content_views_insert_own" on public.content_views
  for insert to authenticated
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "content_views_insert_anon" on public.content_views
  for insert to anon
  with check (teacher_id is null);

create policy "content_views_admin_read" on public.content_views
  for select to authenticated using (public.is_admin());

create policy "downloads_insert_own" on public.downloads
  for insert to authenticated
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "downloads_select_own" on public.downloads
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "downloads_admin_read" on public.downloads
  for select to authenticated using (public.is_admin());
