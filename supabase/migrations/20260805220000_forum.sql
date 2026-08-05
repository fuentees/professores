-- Fase 5: fórum para professores cadastrados.

create table public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  order_index integer not null default 0,
  status public.active_status not null default 'active'
);

create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_topics_category_id_idx on public.forum_topics (category_id);
create index forum_topics_author_id_idx on public.forum_topics (author_id);

create trigger set_forum_topics_updated_at
  before update on public.forum_topics
  for each row execute function public.set_updated_at();

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_replies_topic_id_idx on public.forum_replies (topic_id);
create index forum_replies_author_id_idx on public.forum_replies (author_id);

create trigger set_forum_replies_updated_at
  before update on public.forum_replies
  for each row execute function public.set_updated_at();

alter table public.forum_categories enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;

-- O fórum é exclusivo para professores cadastrados (e admin), não para
-- visitantes anônimos.
create policy "forum_categories_authenticated_read" on public.forum_categories
  for select to authenticated using (status = 'active');
create policy "forum_categories_admin_all" on public.forum_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "forum_topics_authenticated_read" on public.forum_topics
  for select to authenticated using (status = 'active');
create policy "forum_topics_insert_own" on public.forum_topics
  for insert to authenticated
  with check (author_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "forum_topics_update_own" on public.forum_topics
  for update to authenticated
  using (
    author_id = (select id from public.profiles where auth_user_id = auth.uid())
    and not is_locked
  )
  with check (author_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "forum_topics_admin_all" on public.forum_topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "forum_replies_authenticated_read" on public.forum_replies
  for select to authenticated using (status = 'active');
create policy "forum_replies_insert_own" on public.forum_replies
  for insert to authenticated
  with check (
    author_id = (select id from public.profiles where auth_user_id = auth.uid())
    and exists (select 1 from public.forum_topics t where t.id = topic_id and not t.is_locked)
  );
create policy "forum_replies_update_own" on public.forum_replies
  for update to authenticated
  using (author_id = (select id from public.profiles where auth_user_id = auth.uid()))
  with check (author_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "forum_replies_delete_own" on public.forum_replies
  for delete to authenticated
  using (author_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "forum_replies_admin_all" on public.forum_replies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
