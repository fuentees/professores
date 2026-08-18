-- Banco de questões + gerador de provas/atividades: o professor escolhe
-- série, disciplina e tema, configura dificuldade/quantidade e gera uma
-- prévia sorteada a partir do banco, podendo trocar questões antes de
-- salvar. Ver plano em C:\Users\Administrador\.claude\plans\sleepy-floating-flurry.md.

create type public.question_type as enum ('multiple_choice', 'essay');

-- FK composta declarativa pra garantir que subtheme_id (quando informado)
-- realmente pertence ao theme_id da própria questão.
alter table public.subthemes add constraint subthemes_id_theme_id_key unique (id, theme_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  statement text not null,
  question_type public.question_type not null default 'multiple_choice',
  difficulty public.content_difficulty not null default 'medium',
  theme_id uuid not null references public.themes (id) on delete cascade,
  subtheme_id uuid,
  answer_key text,
  status public.active_status not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subtheme_id, theme_id) references public.subthemes (id, theme_id)
);

create index questions_theme_id_idx on public.questions (theme_id);
create index questions_subtheme_id_idx on public.questions (subtheme_id);
create index questions_difficulty_idx on public.questions (difficulty);
create index questions_status_idx on public.questions (status);

create trigger set_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create table public.question_alternatives (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null,
  body text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0
);

create index question_alternatives_question_id_idx on public.question_alternatives (question_id);

-- Limite de gerações de prova por mês, configurável por plano (null =
-- ilimitado). Quem não tem assinatura ativa usa o limite grátis fixo no
-- código (FREE_TIER_EXAM_LIMIT em src/lib/access/exam-quota.ts).
alter table public.plans add column exam_generation_monthly_limit integer;

create table public.generated_exams (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  theme_id uuid references public.themes (id) on delete set null,
  school_name text,
  instructions text,
  show_answer_key boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generated_exams_teacher_id_idx on public.generated_exams (teacher_id);
create index generated_exams_created_at_idx on public.generated_exams (created_at);

create trigger set_generated_exams_updated_at
  before update on public.generated_exams
  for each row execute function public.set_updated_at();

create table public.generated_exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.generated_exams (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  order_index integer not null default 0,
  unique (exam_id, question_id)
);

create index generated_exam_questions_exam_id_idx on public.generated_exam_questions (exam_id);
create index generated_exam_questions_question_id_idx on public.generated_exam_questions (question_id);

alter table public.questions enable row level security;
alter table public.question_alternatives enable row level security;
alter table public.generated_exams enable row level security;
alter table public.generated_exam_questions enable row level security;

-- questions / question_alternatives: nunca lidas diretamente pelo
-- professor via RLS (carregam is_correct/answer_key — o gabarito do banco
-- inteiro vazaria pra qualquer autenticado). Todo acesso do professor
-- passa por server action com createAdminClient(), igual ao padrão de
-- content_files/getDownloadUrl.
create policy "questions_admin_all" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "question_alternatives_admin_all" on public.question_alternatives
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- generated_exams / generated_exam_questions: cada professor só enxerga e
-- gerencia as próprias provas geradas; admin enxerga tudo (suporte).
create policy "generated_exams_own" on public.generated_exams
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "generated_exams_admin_read" on public.generated_exams
  for select to authenticated using (public.is_admin());

create policy "generated_exam_questions_own" on public.generated_exam_questions
  for all to authenticated
  using (
    exists (
      select 1 from public.generated_exams e
      where e.id = generated_exam_questions.exam_id
        and e.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.generated_exams e
      where e.id = generated_exam_questions.exam_id
        and e.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
    )
  );

create policy "generated_exam_questions_admin_read" on public.generated_exam_questions
  for select to authenticated using (public.is_admin());
