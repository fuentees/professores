-- Banco de Questões (Fase 0a): tipos novos e catálogo de período letivo.
-- Migration isolada de propósito: Postgres proíbe usar um valor de enum
-- recém-adicionado por `ALTER TYPE ... ADD VALUE` na mesma transação em que
-- foi criado, então nenhuma outra migration pode inserir/atualizar dados
-- usando os valores abaixo no mesmo arquivo.

alter type public.question_type add value 'discursive';
alter type public.question_type add value 'true_false';
alter type public.question_type add value 'matching';
alter type public.question_type add value 'fill_blank';
alter type public.question_type add value 'ordering';
alter type public.question_type add value 'argumentative';
alter type public.question_type add value 'image_based';
alter type public.question_type add value 'mixed';

create type public.bloom_taxonomy_level as enum (
  'lembrar', 'entender', 'aplicar', 'analisar', 'avaliar', 'criar'
);

create type public.rubric_level as enum ('full', 'partial', 'none');

create type public.question_import_status as enum (
  'uploaded', 'processing', 'needs_review', 'approved', 'failed', 'rejected'
);

-- Trimestre/bimestre/semestre: varia por escola, não é um enum fixo pequeno
-- e estável — catálogo administrável, mesmo padrão de education_levels /
-- content_types.
create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  order_index integer not null default 0,
  status public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_academic_periods_updated_at
  before update on public.academic_periods
  for each row execute function public.set_updated_at();

alter table public.academic_periods enable row level security;

create policy "academic_periods_public_read" on public.academic_periods
  for select to public using (status = 'active');
create policy "academic_periods_admin_all" on public.academic_periods
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
