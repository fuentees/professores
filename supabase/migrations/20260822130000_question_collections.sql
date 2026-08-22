-- Cadernos de questões persistentes: o professor salva uma seleção para
-- continuar depois, reorganizar, baixar em Word ou transformar em avaliação.

create table if not exists public.question_collections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.question_collections (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  unique (collection_id, question_id),
  unique (collection_id, order_index)
);

create index if not exists question_collections_teacher_id_idx
  on public.question_collections (teacher_id, updated_at desc);
create index if not exists question_collection_items_collection_id_idx
  on public.question_collection_items (collection_id, order_index);
create index if not exists question_collection_items_question_id_idx
  on public.question_collection_items (question_id);

drop trigger if exists set_question_collections_updated_at on public.question_collections;
create trigger set_question_collections_updated_at
  before update on public.question_collections
  for each row execute function public.set_updated_at();

alter table public.question_collections enable row level security;
alter table public.question_collection_items enable row level security;

drop policy if exists "question_collections_own" on public.question_collections;
create policy "question_collections_own" on public.question_collections
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "question_collections_admin_read" on public.question_collections;
create policy "question_collections_admin_read" on public.question_collections
  for select to authenticated using (public.is_admin());

drop policy if exists "question_collection_items_own" on public.question_collection_items;
create policy "question_collection_items_own" on public.question_collection_items
  for all to authenticated
  using (
    exists (
      select 1 from public.question_collections c
      where c.id = question_collection_items.collection_id
        and c.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.question_collections c
      where c.id = question_collection_items.collection_id
        and c.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
    )
  );

drop policy if exists "question_collection_items_admin_read" on public.question_collection_items;
create policy "question_collection_items_admin_read" on public.question_collection_items
  for select to authenticated using (public.is_admin());

grant select, insert, update, delete on public.question_collections to authenticated;
grant select, insert, update, delete on public.question_collection_items to authenticated;

create or replace function public.create_question_collection(
  p_name text,
  p_question_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_collection_id uuid;
begin
  select id into v_teacher_id
  from public.profiles
  where auth_user_id = auth.uid() and status = 'active';

  if v_teacher_id is null then raise exception 'Professor não autorizado.'; end if;
  if char_length(trim(p_name)) not between 2 and 80 then raise exception 'Nome inválido.'; end if;
  if cardinality(p_question_ids) not between 1 and 30 then raise exception 'O caderno deve ter de 1 a 30 questões.'; end if;
  if (select count(distinct id) from public.questions where id = any(p_question_ids) and status = 'active' and publication_status = 'published') <> cardinality(p_question_ids)
    then raise exception 'Uma ou mais questões não estão disponíveis ou estão repetidas.';
  end if;

  insert into public.question_collections (teacher_id, name)
  values (v_teacher_id, trim(p_name))
  returning id into v_collection_id;

  insert into public.question_collection_items (collection_id, question_id, order_index)
  select v_collection_id, question_id, order_number - 1
  from unnest(p_question_ids) with ordinality as selected(question_id, order_number);

  return v_collection_id;
end;
$$;

create or replace function public.update_question_collection(
  p_collection_id uuid,
  p_name text,
  p_question_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
begin
  select id into v_teacher_id
  from public.profiles
  where auth_user_id = auth.uid() and status = 'active';

  if v_teacher_id is null then raise exception 'Professor não autorizado.'; end if;
  if not exists (select 1 from public.question_collections where id = p_collection_id and teacher_id = v_teacher_id)
    then raise exception 'Caderno não encontrado.';
  end if;
  if char_length(trim(p_name)) not between 2 and 80 then raise exception 'Nome inválido.'; end if;
  if cardinality(p_question_ids) not between 1 and 30 then raise exception 'O caderno deve ter de 1 a 30 questões.'; end if;
  if (select count(distinct id) from public.questions where id = any(p_question_ids) and status = 'active' and publication_status = 'published') <> cardinality(p_question_ids)
    then raise exception 'Uma ou mais questões não estão disponíveis ou estão repetidas.';
  end if;

  update public.question_collections set name = trim(p_name), updated_at = now()
  where id = p_collection_id and teacher_id = v_teacher_id;
  delete from public.question_collection_items where collection_id = p_collection_id;
  insert into public.question_collection_items (collection_id, question_id, order_index)
  select p_collection_id, question_id, order_number - 1
  from unnest(p_question_ids) with ordinality as selected(question_id, order_number);

  return p_collection_id;
end;
$$;

revoke all on function public.create_question_collection(text, uuid[]) from public;
revoke all on function public.update_question_collection(uuid, text, uuid[]) from public;
grant execute on function public.create_question_collection(text, uuid[]) to authenticated;
grant execute on function public.update_question_collection(uuid, text, uuid[]) to authenticated;
