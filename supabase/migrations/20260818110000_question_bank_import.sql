-- Banco de Questões (Fase 0b): importação de acervo Word para o banco de
-- questões existente (criado para o gerador de provas). Estende `questions`
-- em vez de criar uma tabela paralela; tabelas novas só para o que
-- genuinamente não existia (partes, respostas discursivas, rubrica, assets,
-- estrutura ordenada do documento, histórico de importação).
--
-- Reutiliza education_levels/grades/subjects/curriculum_units/themes/
-- subthemes/bncc_skills já existentes — nenhuma dessas é duplicada aqui.

-- question_imports precisa existir antes de questions.import_id referenciá-la.
create table public.question_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text not null,
  storage_path text not null,
  status public.question_import_status not null default 'uploaded',
  imported_by uuid references public.profiles (id) on delete set null,
  question_id uuid,
  extracted_code text,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index question_imports_status_idx on public.question_imports (status);
create index question_imports_file_hash_idx on public.question_imports (file_hash);
create index question_imports_question_id_idx on public.question_imports (question_id);

-- Extensão de `questions` -----------------------------------------------------

alter table public.questions
  alter column theme_id drop not null;

alter table public.questions
  add constraint questions_subtheme_requires_theme
  check (subtheme_id is null or theme_id is not null);

alter table public.questions
  add column code text,
  add column subject_id uuid references public.subjects (id) on delete set null,
  add column grade_id uuid references public.grades (id) on delete set null,
  add column knowledge_objects text[],
  add column academic_period_id uuid references public.academic_periods (id) on delete set null,
  add column book_name text,
  add column book_unit text,
  add column bloom_primary_level public.bloom_taxonomy_level,
  add column bloom_secondary_level public.bloom_taxonomy_level,
  add column bloom_justification text,
  add column pedagogical_note text,
  -- Ciclo de vida do banco de questões, separado de `status` (active_status)
  -- que o gerador de provas já usa pra decidir o que pode ser sorteado.
  -- Questões existentes (cadastradas manualmente, já aprovadas antes deste
  -- conceito existir) recebem 'published' no backfill abaixo; toda questão
  -- importada nasce 'draft' explicitamente no INSERT da Server Action.
  add column publication_status public.content_status not null default 'published',
  add column original_file_path text,
  add column import_id uuid references public.question_imports (id) on delete set null,
  -- Controla SOMENTE quem pode baixar o .docx original (canAccessResource).
  -- NÃO controla se a questão aparece na busca do professor — isso é
  -- exclusivamente publication_status. Diferente da semântica de access_type
  -- em contents/learning_objects/courses, onde o mesmo enum esconde o
  -- recurso inteiro.
  add column access_type public.content_access_type not null default 'teacher_only';

create index questions_code_idx on public.questions (code);
create index questions_subject_id_idx on public.questions (subject_id);
create index questions_grade_id_idx on public.questions (grade_id);
create index questions_academic_period_id_idx on public.questions (academic_period_id);
create index questions_publication_status_idx on public.questions (publication_status);
create index questions_import_id_idx on public.questions (import_id);

alter table public.question_imports
  add constraint question_imports_question_id_fkey
  foreign key (question_id) references public.questions (id) on delete set null;

-- Tabelas filhas ---------------------------------------------------------------

create table public.question_import_warnings (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.question_imports (id) on delete cascade,
  severity text not null check (severity in ('warning', 'error')),
  field text,
  message text not null,
  created_at timestamptz not null default now()
);

create index question_import_warnings_import_id_idx on public.question_import_warnings (import_id);

create table public.question_bncc_skills (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  bncc_skill_id uuid not null references public.bncc_skills (id) on delete cascade,
  unique (question_id, bncc_skill_id)
);

create index question_bncc_skills_question_id_idx on public.question_bncc_skills (question_id);
create index question_bncc_skills_skill_id_idx on public.question_bncc_skills (bncc_skill_id);

create table public.question_parts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null,
  prompt text not null,
  order_index integer not null default 0,
  points numeric(5, 2)
);

create index question_parts_question_id_idx on public.question_parts (question_id);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  question_part_id uuid references public.question_parts (id) on delete cascade,
  expected_answer text not null,
  correction_guidance text
);

create index question_answers_question_id_idx on public.question_answers (question_id);
create index question_answers_part_id_idx on public.question_answers (question_part_id);

create table public.question_rubrics (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  question_part_id uuid references public.question_parts (id) on delete cascade,
  level public.rubric_level not null,
  points numeric(5, 2),
  criteria text not null,
  order_index integer not null default 0
);

create index question_rubrics_question_id_idx on public.question_rubrics (question_id);
create index question_rubrics_part_id_idx on public.question_rubrics (question_part_id);

create table public.question_assets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  storage_path text not null,
  asset_type text not null check (asset_type in ('image', 'table_image', 'other')),
  original_name text not null,
  mime_type text not null,
  order_index integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now()
);

create index question_assets_question_id_idx on public.question_assets (question_id);

create table public.question_document_blocks (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  section text not null check (section in ('base_text', 'statement', 'correction', 'other')),
  block_type text not null check (block_type in ('heading', 'paragraph', 'image', 'table', 'list_item')),
  content jsonb not null,
  order_index integer not null default 0,
  unique (question_id, section, order_index)
);

create index question_document_blocks_question_id_idx on public.question_document_blocks (question_id);

create table public.question_favorites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, question_id)
);

create index question_favorites_teacher_id_idx on public.question_favorites (teacher_id);
create index question_favorites_question_id_idx on public.question_favorites (question_id);

-- Backfill: questões manuais já existentes já foram aprovadas antes deste
-- conceito existir.
update public.questions set publication_status = 'published';

-- RLS ----------------------------------------------------------------------------
-- Tudo admin-only, espelhando `questions_admin_all` (carregam gabarito/
-- rubrica/original — o professor nunca lê essas tabelas direto via RLS,
-- só por Server Action com createAdminClient() e filtro explícito em
-- código, igual hydrateQuestions em src/actions/exam-generator.ts).

alter table public.question_imports enable row level security;
alter table public.question_import_warnings enable row level security;
alter table public.question_bncc_skills enable row level security;
alter table public.question_parts enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_rubrics enable row level security;
alter table public.question_assets enable row level security;
alter table public.question_document_blocks enable row level security;
alter table public.question_favorites enable row level security;

create policy "question_imports_admin_all" on public.question_imports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_import_warnings_admin_all" on public.question_import_warnings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_bncc_skills_admin_all" on public.question_bncc_skills
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_parts_admin_all" on public.question_parts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_answers_admin_all" on public.question_answers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_rubrics_admin_all" on public.question_rubrics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_assets_admin_all" on public.question_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_document_blocks_admin_all" on public.question_document_blocks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- question_favorites: sem gabarito, cada professor gerencia as próprias
-- linhas (mesmo padrão de generated_exams_own).
create policy "question_favorites_own" on public.question_favorites
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "question_favorites_admin_read" on public.question_favorites
  for select to authenticated using (public.is_admin());
