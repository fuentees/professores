-- Recursos interativos salvos para usar depois, separados dos favoritos de
-- materiais porque cada catálogo tem sua própria chave e apresentação.

create table if not exists public.learning_object_favorites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  learning_object_id uuid not null references public.learning_objects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, learning_object_id)
);

create index if not exists learning_object_favorites_teacher_id_idx
  on public.learning_object_favorites (teacher_id, created_at desc);
create index if not exists learning_object_favorites_object_id_idx
  on public.learning_object_favorites (learning_object_id);

alter table public.learning_object_favorites enable row level security;

drop policy if exists "learning_object_favorites_own" on public.learning_object_favorites;
create policy "learning_object_favorites_own" on public.learning_object_favorites
  for all to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "learning_object_favorites_admin_read" on public.learning_object_favorites;
create policy "learning_object_favorites_admin_read" on public.learning_object_favorites
  for select to authenticated using (public.is_admin());

grant select, insert, update, delete on public.learning_object_favorites to authenticated;
