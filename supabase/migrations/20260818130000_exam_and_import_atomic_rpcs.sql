-- Consolidação técnica: operações que faziam múltiplos inserts/updates
-- sequenciais sem transação (uma falha no meio deixava dado pela metade)
-- viram funções Postgres chamadas via supabase.rpc(...), cada uma numa
-- única transação implícita. Todas `security invoker`: rodam com a sessão/
-- RLS de quem chama, nunca elevam privilégio — a segurança continua vindo
-- das policies já existentes (generated_exams_own, questions_admin_all
-- etc.), a função só garante atomicidade.

-- A8: salvar/atualizar prova gerada -------------------------------------------

create function public.create_generated_exam(
  p_title text,
  p_theme_id uuid,
  p_school_name text,
  p_instructions text,
  p_show_answer_key boolean,
  p_question_ids uuid[]
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

  insert into public.generated_exams (teacher_id, title, theme_id, school_name, instructions, show_answer_key)
  values (v_teacher_id, p_title, p_theme_id, p_school_name, p_instructions, p_show_answer_key)
  returning id into v_exam_id;

  insert into public.generated_exam_questions (exam_id, question_id, order_index)
  select v_exam_id, q, ord - 1
  from unnest(p_question_ids) with ordinality as t(q, ord);

  insert into public.exam_generation_events (teacher_id, exam_id)
  values (v_teacher_id, v_exam_id);

  return v_exam_id;
end;
$$;

create function public.update_generated_exam(
  p_exam_id uuid,
  p_title text,
  p_school_name text,
  p_instructions text,
  p_show_answer_key boolean,
  p_question_ids uuid[]
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
      show_answer_key = p_show_answer_key
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

-- A9: importação de questão .docx — inserts relacionais ------------------------
-- O upload do .docx original e dos assets pro Storage continua acontecendo
-- em JS (Storage não participa de transação SQL); esta função cobre só os
-- inserts relacionais (question + parts + answers + rubrics + bncc_skills +
-- assets + blocks + warnings), tudo ou nada. Se a função levantar exceção,
-- a Server Action (src/actions/admin/question-imports.ts) apaga do Storage
-- os assets que já tinha subido antes de chamar esta função (o .docx
-- original permanece — nunca é descartado, mesmo em falha).
create function public.import_question_draft(
  p_question_id uuid,
  p_import_id uuid,
  p_statement text,
  p_question_type public.question_type,
  p_difficulty public.content_difficulty,
  p_code text,
  p_subject_id uuid,
  p_grade_id uuid,
  p_knowledge_objects text[],
  p_academic_period_id uuid,
  p_book_name text,
  p_book_unit text,
  p_bloom_primary_level public.bloom_taxonomy_level,
  p_bloom_justification text,
  p_pedagogical_note text,
  p_original_file_path text,
  p_bncc_skill_ids uuid[],
  p_parts jsonb,
  p_answers jsonb,
  p_rubrics jsonb,
  p_assets jsonb,
  p_blocks jsonb,
  p_warnings jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_part_label_to_id jsonb := '{}'::jsonb;
  r record;
begin
  insert into public.questions (
    id, statement, question_type, difficulty, theme_id, status, publication_status,
    code, subject_id, grade_id, knowledge_objects, academic_period_id, book_name, book_unit,
    bloom_primary_level, bloom_justification, pedagogical_note, original_file_path, import_id
  ) values (
    p_question_id, p_statement, p_question_type, p_difficulty, null, 'inactive', 'draft',
    p_code, p_subject_id, p_grade_id, p_knowledge_objects, p_academic_period_id, p_book_name, p_book_unit,
    p_bloom_primary_level, p_bloom_justification, p_pedagogical_note, p_original_file_path, p_import_id
  );

  if p_bncc_skill_ids is not null and array_length(p_bncc_skill_ids, 1) > 0 then
    insert into public.question_bncc_skills (question_id, bncc_skill_id)
    select p_question_id, x from unnest(p_bncc_skill_ids) as x;
  end if;

  for r in
    select * from jsonb_to_recordset(coalesce(p_parts, '[]'::jsonb))
      as x(id uuid, label text, prompt text, order_index int)
  loop
    insert into public.question_parts (id, question_id, label, prompt, order_index)
    values (r.id, p_question_id, r.label, r.prompt, r.order_index);
    v_part_label_to_id := jsonb_set(v_part_label_to_id, array[r.label], to_jsonb(r.id::text));
  end loop;

  for r in
    select * from jsonb_to_recordset(coalesce(p_answers, '[]'::jsonb))
      as x(item_label text, expected_answer text, correction_guidance text)
  loop
    insert into public.question_answers (question_id, question_part_id, expected_answer, correction_guidance)
    values (
      p_question_id,
      case when r.item_label is not null then (v_part_label_to_id ->> r.item_label)::uuid else null end,
      r.expected_answer,
      r.correction_guidance
    );
  end loop;

  for r in
    select * from jsonb_to_recordset(coalesce(p_rubrics, '[]'::jsonb))
      as x(item_label text, level public.rubric_level, points numeric, criteria text, order_index int)
  loop
    insert into public.question_rubrics (question_id, question_part_id, level, points, criteria, order_index)
    values (
      p_question_id,
      case when r.item_label is not null then (v_part_label_to_id ->> r.item_label)::uuid else null end,
      r.level, r.points, r.criteria, r.order_index
    );
  end loop;

  for r in
    select * from jsonb_to_recordset(coalesce(p_assets, '[]'::jsonb))
      as x(id uuid, storage_path text, asset_type text, original_name text, mime_type text, order_index int)
  loop
    insert into public.question_assets (id, question_id, storage_path, asset_type, original_name, mime_type, order_index)
    values (r.id, p_question_id, r.storage_path, r.asset_type, r.original_name, r.mime_type, r.order_index);
  end loop;

  for r in
    select * from jsonb_to_recordset(coalesce(p_blocks, '[]'::jsonb))
      as x(section text, block_type text, content jsonb, order_index int)
  loop
    insert into public.question_document_blocks (question_id, section, block_type, content, order_index)
    values (p_question_id, r.section, r.block_type, r.content, r.order_index);
  end loop;

  for r in
    select * from jsonb_to_recordset(coalesce(p_warnings, '[]'::jsonb))
      as x(severity text, field text, message text)
  loop
    insert into public.question_import_warnings (import_id, severity, field, message)
    values (p_import_id, r.severity, r.field, r.message);
  end loop;

  update public.question_imports
  set status = 'needs_review', question_id = p_question_id, extracted_code = p_code, processed_at = now()
  where id = p_import_id;

  return p_question_id;
end;
$$;
