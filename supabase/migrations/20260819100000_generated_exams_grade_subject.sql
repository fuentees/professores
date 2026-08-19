-- Correção: o gerador de provas exigia um tema (theme_id) pra buscar
-- questões, mas as questões importadas pelo banco de questões (.docx)
-- nunca têm tema vinculado — só disciplina/série (subject_id/grade_id).
-- O acervo importado inteiro ficava invisível pro gerador mesmo com a
-- disciplina/série certas escolhidas. Tema agora é um refinamento
-- opcional (ver src/actions/exam-generator.ts, pickQuestionIds).
--
-- generated_exams só guardava theme_id — sem colunas novas, reabrir uma
-- prova salva sem tema (pra editar ou "gerar novamente") não teria como
-- saber disciplina/série. Colunas nullable, não quebram provas antigas
-- (que continuam só com theme_id — resolvidas em código via o tema
-- quando as colunas novas vierem nulas).

alter table public.generated_exams
  add column grade_id uuid references public.grades (id) on delete set null,
  add column subject_id uuid references public.subjects (id) on delete set null;

create index generated_exams_grade_id_idx on public.generated_exams (grade_id);
create index generated_exams_subject_id_idx on public.generated_exams (subject_id);

-- Redefine as RPCs de 20260818130000_exam_and_import_atomic_rpcs.sql pra
-- gravar as colunas novas. Os parâmetros novos entram no final com
-- default null — mantém a mesma identidade de função (create or replace,
-- não precisa dropar), só passam a aceitar (e nós sempre vamos passar)
-- disciplina/série também.

create or replace function public.create_generated_exam(
  p_title text,
  p_theme_id uuid,
  p_school_name text,
  p_instructions text,
  p_show_answer_key boolean,
  p_question_ids uuid[],
  p_grade_id uuid default null,
  p_subject_id uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_exam_id uuid;
begin
  select id into v_teacher_id from public.profiles where auth_user_id = auth.uid();
  if v_teacher_id is null then
    raise exception 'Perfil não encontrado.';
  end if;

  insert into public.generated_exams (teacher_id, title, theme_id, grade_id, subject_id, school_name, instructions, show_answer_key)
  values (v_teacher_id, p_title, p_theme_id, p_grade_id, p_subject_id, p_school_name, p_instructions, p_show_answer_key)
  returning id into v_exam_id;

  insert into public.generated_exam_questions (exam_id, question_id, order_index)
  select v_exam_id, q, ord - 1
  from unnest(p_question_ids) with ordinality as t(q, ord);

  insert into public.exam_generation_events (teacher_id, exam_id)
  values (v_teacher_id, v_exam_id);

  return v_exam_id;
end;
$$;

create or replace function public.update_generated_exam(
  p_exam_id uuid,
  p_title text,
  p_school_name text,
  p_instructions text,
  p_show_answer_key boolean,
  p_question_ids uuid[],
  p_grade_id uuid default null,
  p_subject_id uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_updated uuid;
begin
  select id into v_teacher_id from public.profiles where auth_user_id = auth.uid();

  update public.generated_exams
  set title = p_title,
      school_name = p_school_name,
      instructions = p_instructions,
      show_answer_key = p_show_answer_key,
      grade_id = coalesce(p_grade_id, grade_id),
      subject_id = coalesce(p_subject_id, subject_id)
  where id = p_exam_id and teacher_id = v_teacher_id
  returning id into v_updated;

  if v_updated is null then
    raise exception 'Prova não encontrada.';
  end if;

  delete from public.generated_exam_questions where exam_id = p_exam_id;

  insert into public.generated_exam_questions (exam_id, question_id, order_index)
  select p_exam_id, q, ord - 1
  from unnest(p_question_ids) with ordinality as t(q, ord);

  return p_exam_id;
end;
$$;
