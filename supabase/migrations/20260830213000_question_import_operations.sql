-- Operação em escala do acervo Word: comparação BNCC, reprocessamento,
-- relatório por importação e trilha de auditoria.

alter type public.question_import_status add value if not exists 'superseded';

alter table public.question_imports
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reprocessed_from_id uuid references public.question_imports (id) on delete set null,
  add column if not exists replaced_by_id uuid references public.question_imports (id) on delete set null,
  add column if not exists summary jsonb not null default '{}'::jsonb;

create index if not exists question_imports_imported_by_idx on public.question_imports (imported_by);
create index if not exists question_imports_reviewed_by_idx on public.question_imports (reviewed_by);
create index if not exists question_imports_reprocessed_from_id_idx on public.question_imports (reprocessed_from_id);

create table if not exists public.question_import_bncc_snapshots (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.question_imports (id) on delete cascade,
  bncc_skill_id uuid references public.bncc_skills (id) on delete set null,
  code text not null,
  imported_description text,
  catalog_description text,
  resolution text not null check (resolution in (
    'matched', 'new', 'conflict', 'unmapped', 'missing_description'
  )),
  created_at timestamptz not null default now(),
  unique (import_id, code)
);

create index if not exists question_import_bncc_snapshots_import_id_idx
  on public.question_import_bncc_snapshots (import_id);
create index if not exists question_import_bncc_snapshots_resolution_idx
  on public.question_import_bncc_snapshots (resolution);

create table if not exists public.question_import_events (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.question_imports (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists question_import_events_import_id_idx
  on public.question_import_events (import_id, created_at desc);
create index if not exists question_import_events_actor_id_idx
  on public.question_import_events (actor_id, created_at desc);

alter table public.question_import_bncc_snapshots enable row level security;
alter table public.question_import_events enable row level security;

create policy "question_import_bncc_snapshots_admin_all"
  on public.question_import_bncc_snapshots
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "question_import_events_admin_read"
  on public.question_import_events
  for select to authenticated
  using (public.is_admin());

-- Eventos são gravados pelas Server Actions via service role. Não há policy
-- de escrita pelo navegador, mantendo a auditoria fora do alcance do cliente.

comment on table public.question_import_bncc_snapshots is
  'Texto BNCC exatamente como veio no Word e comparação com o catálogo no momento da importação.';
comment on table public.question_import_events is
  'Trilha append-only de envio, processamento, aprovação, rejeição e reprocessamento.';
