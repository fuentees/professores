-- Ferramentas de IA para o professor: planejamento de aula e corretor.
-- A saída da IA é sempre persistida como rascunho editável e vinculada ao
-- professor. Imagens enviadas ao corretor não são armazenadas.

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  subject_id uuid references public.subjects (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  theme text not null,
  duration_minutes integer not null check (duration_minutes between 10 and 600),
  class_count integer not null default 1 check (class_count between 1 and 20),
  inclusion_profiles text[] not null default '{}',
  class_context text,
  teacher_objectives text,
  output jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lesson_plans_teacher_created_idx on public.lesson_plans (teacher_id, created_at desc);
create index lesson_plans_subject_grade_idx on public.lesson_plans (subject_id, grade_id);

create trigger set_lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute function public.set_updated_at();

create table public.lesson_plan_bncc_skills (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  bncc_skill_id uuid not null references public.bncc_skills (id) on delete restrict,
  unique (lesson_plan_id, bncc_skill_id)
);

create index lesson_plan_bncc_skills_plan_idx on public.lesson_plan_bncc_skills (lesson_plan_id);

create table public.ai_corrections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  correction_type text not null check (correction_type in ('exercise', 'essay')),
  subject_id uuid references public.subjects (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  title text not null,
  teacher_context text,
  output jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index ai_corrections_teacher_created_idx on public.ai_corrections (teacher_id, created_at desc);

-- Log append-only para limite antiabuso, auditoria de custo e suporte.
create table public.ai_generation_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null check (feature in ('lesson_plan', 'exercise_correction', 'essay_correction')),
  resource_id uuid,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index ai_generation_events_teacher_created_idx on public.ai_generation_events (teacher_id, created_at desc);

alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_bncc_skills enable row level security;
alter table public.ai_corrections enable row level security;
alter table public.ai_generation_events enable row level security;

create policy "lesson_plans_own" on public.lesson_plans
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "lesson_plans_admin_read" on public.lesson_plans
  for select to authenticated using (public.is_admin());

create policy "lesson_plan_bncc_skills_own" on public.lesson_plan_bncc_skills
  for all to authenticated
  using (exists (
    select 1 from public.lesson_plans p
    where p.id = lesson_plan_bncc_skills.lesson_plan_id
      and p.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.lesson_plans p
    where p.id = lesson_plan_bncc_skills.lesson_plan_id
      and p.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
  ));

create policy "lesson_plan_bncc_skills_admin_read" on public.lesson_plan_bncc_skills
  for select to authenticated using (public.is_admin());

create policy "ai_corrections_own" on public.ai_corrections
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "ai_corrections_admin_read" on public.ai_corrections
  for select to authenticated using (public.is_admin());

create policy "ai_generation_events_own_read" on public.ai_generation_events
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "ai_generation_events_admin_read" on public.ai_generation_events
  for select to authenticated using (public.is_admin());
