-- Correções de segurança e integridade encontradas em auditoria:
-- 1) RLS de curso vazava módulos/aulas de cursos em rascunho e não
--    verificava o vínculo com o curso pai.
-- 2) Faltavam índices nas colunas de FK "reversas" das tabelas de
--    relacionamento de conteúdo, usadas em filtros públicos.
-- 3) access_grants.course_id/folder_id não tinham FK (ficaram "reservadas"
--    desde a Fase 4, mas courses/folders já existem desde a Fase 5).
-- 4) Um professor podia alterar campos de moderação (is_pinned, is_locked,
--    status, category_id) dos próprios tópicos/respostas do fórum via
--    chamada direta à API, pois a policy "_update_own" só checava author_id.

-- 1) course_modules / course_lessons / lesson_files: só expor o que
-- pertence a um curso publicado.
drop policy "course_modules_read" on public.course_modules;
create policy "course_modules_read" on public.course_modules for select to public
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_modules.course_id and c.status = 'published'
    )
  );

drop policy "course_lessons_read" on public.course_lessons;
create policy "course_lessons_read" on public.course_lessons for select to public
  using (
    status = 'active'
    and exists (
      select 1 from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = course_lessons.module_id and c.status = 'published'
    )
  );

drop policy "lesson_files_authenticated_read" on public.lesson_files;
create policy "lesson_files_authenticated_read" on public.lesson_files
  for select to authenticated
  using (
    exists (
      select 1 from public.course_lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_files.lesson_id and c.status = 'published'
    )
  );

-- 2) Índices faltando nas colunas de FK reversa (usadas em filtros
-- públicos, ex: /materiais?tipo=...).
create index content_units_curriculum_unit_id_idx on public.content_units (curriculum_unit_id);
create index content_themes_theme_id_idx on public.content_themes (theme_id);
create index content_subthemes_subtheme_id_idx on public.content_subthemes (subtheme_id);
create index content_content_types_content_type_id_idx on public.content_content_types (content_type_id);
create index content_tags_tag_id_idx on public.content_tags (tag_id);

-- 3) FKs que ficaram pendentes desde a Fase 4.
alter table public.access_grants
  add constraint access_grants_course_id_fkey
    foreign key (course_id) references public.courses (id) on delete cascade,
  add constraint access_grants_folder_id_fkey
    foreign key (folder_id) references public.folders (id) on delete cascade;

create index access_grants_course_id_idx on public.access_grants (course_id);
create index access_grants_folder_id_idx on public.access_grants (folder_id);

-- 4) Campos de moderação do fórum só podem mudar por ação do admin
-- (que já usa is_admin() nas próprias policies "_admin_all"), nunca pelo
-- dono do tópico/resposta através da policy "_update_own".
create function public.protect_forum_topic_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (
    new.is_pinned is distinct from old.is_pinned
    or new.is_locked is distinct from old.is_locked
    or new.status is distinct from old.status
    or new.category_id is distinct from old.category_id
  ) then
    raise exception 'Apenas administradores podem alterar estes campos do tópico.';
  end if;
  return new;
end;
$$;

create trigger protect_forum_topics_moderation
  before update on public.forum_topics
  for each row execute function public.protect_forum_topic_moderation_fields();

create function public.protect_forum_reply_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.status is distinct from old.status then
    raise exception 'Apenas administradores podem alterar o status desta resposta.';
  end if;
  return new;
end;
$$;

create trigger protect_forum_replies_moderation
  before update on public.forum_replies
  for each row execute function public.protect_forum_reply_moderation_fields();
