-- Fase 2: estrutura pedagógica (níveis, séries, disciplinas, unidades, temas,
-- subtemas e tipos de material). Tudo cadastrável pelo admin, nada fixo no código.

create type public.active_status as enum ('active', 'inactive');

-- Reaproveita a função de updated_at criada na migration de profiles
-- (public.set_updated_at()).

create table public.education_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_education_levels_updated_at
  before update on public.education_levels
  for each row execute function public.set_updated_at();

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  education_level_id uuid not null references public.education_levels (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (education_level_id, slug)
);

create index grades_education_level_id_idx on public.grades (education_level_id);

create trigger set_grades_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_name text,
  description text,
  icon text,
  image_url text,
  color text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_subjects_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

create table public.grade_subjects (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (grade_id, subject_id)
);

create index grade_subjects_grade_id_idx on public.grade_subjects (grade_id);
create index grade_subjects_subject_id_idx on public.grade_subjects (subject_id);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade_id, subject_id, slug)
);

create index curriculum_units_grade_id_idx on public.curriculum_units (grade_id);
create index curriculum_units_subject_id_idx on public.curriculum_units (subject_id);

create trigger set_curriculum_units_updated_at
  before update on public.curriculum_units
  for each row execute function public.set_updated_at();

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  curriculum_unit_id uuid not null references public.curriculum_units (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curriculum_unit_id, slug)
);

create index themes_curriculum_unit_id_idx on public.themes (curriculum_unit_id);

create trigger set_themes_updated_at
  before update on public.themes
  for each row execute function public.set_updated_at();

create table public.subthemes (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_id, slug)
);

create index subthemes_theme_id_idx on public.subthemes (theme_id);

create trigger set_subthemes_updated_at
  before update on public.subthemes
  for each row execute function public.set_updated_at();

create table public.content_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_content_types_updated_at
  before update on public.content_types
  for each row execute function public.set_updated_at();

-- RLS: leitura pública somente de registros ativos; admin com acesso total.
-- (public.is_admin() já existe, criada na migration de profiles.)

alter table public.education_levels enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.grade_subjects enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.themes enable row level security;
alter table public.subthemes enable row level security;
alter table public.content_types enable row level security;

create policy "education_levels_public_read" on public.education_levels
  for select to public using (status = 'active');
create policy "education_levels_admin_all" on public.education_levels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "grades_public_read" on public.grades
  for select to public using (status = 'active');
create policy "grades_admin_all" on public.grades
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subjects_public_read" on public.subjects
  for select to public using (status = 'active');
create policy "subjects_admin_all" on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "grade_subjects_public_read" on public.grade_subjects
  for select to public using (true);
create policy "grade_subjects_admin_all" on public.grade_subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "curriculum_units_public_read" on public.curriculum_units
  for select to public using (status = 'active');
create policy "curriculum_units_admin_all" on public.curriculum_units
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "themes_public_read" on public.themes
  for select to public using (status = 'active');
create policy "themes_admin_all" on public.themes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subthemes_public_read" on public.subthemes
  for select to public using (status = 'active');
create policy "subthemes_admin_all" on public.subthemes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_types_public_read" on public.content_types
  for select to public using (status = 'active');
create policy "content_types_admin_all" on public.content_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
