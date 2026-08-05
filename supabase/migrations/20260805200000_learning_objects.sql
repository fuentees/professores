-- Fase 5: objetos de aprendizagem (jogos, simulações, quizzes, vídeos,
-- infográficos, links educacionais etc.).

create table public.learning_objects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  object_type text not null,
  external_url text,
  storage_path text,
  access_type public.content_access_type not null default 'teacher_only',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index learning_objects_status_idx on public.learning_objects (status);
create index learning_objects_object_type_idx on public.learning_objects (object_type);

alter table public.learning_objects enable row level security;

create policy "learning_objects_public_read" on public.learning_objects
  for select to public using (status = 'published');

create policy "learning_objects_admin_all" on public.learning_objects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
