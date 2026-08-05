-- Fase 5: cursos para professores (curso → módulo → aula → arquivos), com
-- acompanhamento de progresso por professor.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  instructor text,
  workload_hours integer,
  access_type public.content_access_type not null default 'teacher_only',
  certificate_enabled boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_status_idx on public.courses (status);

create trigger set_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0
);

create index course_modules_course_id_idx on public.course_modules (course_id);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null,
  description text,
  body text,
  video_url text,
  duration_minutes integer,
  order_index integer not null default 0,
  status public.active_status not null default 'active'
);

create index course_lessons_module_id_idx on public.course_lessons (module_id);

create table public.lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  name text not null,
  storage_path text not null,
  file_type text not null,
  file_size bigint not null,
  order_index integer not null default 0
);

create index lesson_files_lesson_id_idx on public.lesson_files (lesson_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  progress_percentage integer not null default 0,
  unique (teacher_id, lesson_id)
);

create index lesson_progress_teacher_id_idx on public.lesson_progress (teacher_id);
create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.lesson_files enable row level security;
alter table public.lesson_progress enable row level security;

create policy "courses_public_read" on public.courses
  for select to public using (status = 'published');
create policy "courses_admin_all" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "course_modules_read" on public.course_modules for select to public using (true);
create policy "course_modules_admin_all" on public.course_modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "course_lessons_read" on public.course_lessons for select to public using (status = 'active');
create policy "course_lessons_admin_all" on public.course_lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Arquivos de aula: só autenticados listam metadados (download real via URL
-- assinada), igual ao padrão usado em content_files.
create policy "lesson_files_authenticated_read" on public.lesson_files
  for select to authenticated using (true);
create policy "lesson_files_admin_all" on public.lesson_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lesson_progress_own" on public.lesson_progress
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "lesson_progress_admin_read" on public.lesson_progress
  for select to authenticated using (public.is_admin());
