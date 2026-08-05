-- Fase 5: blog de artigos para professores.

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.active_status not null default 'active'
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories (id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  cover_url text,
  author text,
  status public.content_status not null default 'draft',
  allow_comments boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_category_id_idx on public.blog_posts (category_id);
create index blog_posts_status_idx on public.blog_posts (status);

create trigger set_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create policy "blog_categories_public_read" on public.blog_categories
  for select to public using (status = 'active');
create policy "blog_categories_admin_all" on public.blog_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "blog_posts_public_read" on public.blog_posts
  for select to public using (status = 'published');
create policy "blog_posts_admin_all" on public.blog_posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
