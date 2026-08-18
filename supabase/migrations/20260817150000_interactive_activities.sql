-- Fase 7: arquitetura de objetos interativos (quiz, verdadeiro/falso,
-- associação, memória, completar lacunas, ordenação, flashcards, simulação).
-- Unificada na tabela learning_objects já existente via activity_type + config
-- (jsonb), sem criar uma tabela por tipo de jogo — a validação de forma por
-- tipo acontece em código (Zod, union discriminada por activity_type).
--
-- Não altera as linhas hoje existentes: todas ficam com activity_type nulo e
-- continuam sendo tratadas como upload/link (comportamento atual preservado).

create type public.learning_activity_type as enum (
  'quiz', 'true_false', 'matching', 'memory', 'fill_blank', 'ordering', 'flashcards', 'simulation'
);

alter table public.learning_objects
  add column activity_type public.learning_activity_type,
  add column config jsonb,
  add column grade_id uuid references public.grades (id) on delete set null,
  add column subject_id uuid references public.subjects (id) on delete set null,
  add column theme_id uuid references public.themes (id) on delete set null,
  add column subtheme_id uuid references public.subthemes (id) on delete set null,
  add column difficulty public.content_difficulty,
  add column estimated_duration_minutes integer;

create index learning_objects_activity_type_idx on public.learning_objects (activity_type);
create index learning_objects_grade_id_idx on public.learning_objects (grade_id);
create index learning_objects_subject_id_idx on public.learning_objects (subject_id);

create table public.learning_object_bncc_skills (
  id uuid primary key default gen_random_uuid(),
  learning_object_id uuid not null references public.learning_objects (id) on delete cascade,
  bncc_skill_id uuid not null references public.bncc_skills (id) on delete cascade,
  unique (learning_object_id, bncc_skill_id)
);

create index learning_object_bncc_skills_object_id_idx on public.learning_object_bncc_skills (learning_object_id);
create index learning_object_bncc_skills_skill_id_idx on public.learning_object_bncc_skills (bncc_skill_id);

alter table public.learning_object_bncc_skills enable row level security;

create policy "learning_object_bncc_skills_read" on public.learning_object_bncc_skills
  for select to public using (true);
create policy "learning_object_bncc_skills_admin_all" on public.learning_object_bncc_skills
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
