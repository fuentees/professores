-- Fase 5: BNCC (Base Nacional Comum Curricular) — estrutura de consulta.
-- Os dados (etapas, áreas, componentes, habilidades) são cadastrados ou
-- importados pelo administrador; nunca gerados/inventados pelo sistema.

create table public.bncc_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_index integer not null default 0
);

create table public.bncc_knowledge_areas (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.bncc_stages (id) on delete cascade,
  name text not null,
  order_index integer not null default 0
);

create index bncc_knowledge_areas_stage_id_idx on public.bncc_knowledge_areas (stage_id);

create table public.bncc_components (
  id uuid primary key default gen_random_uuid(),
  knowledge_area_id uuid not null references public.bncc_knowledge_areas (id) on delete cascade,
  name text not null,
  order_index integer not null default 0
);

create index bncc_components_knowledge_area_id_idx on public.bncc_components (knowledge_area_id);

create table public.bncc_skills (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references public.bncc_components (id) on delete cascade,
  grade_id uuid references public.grades (id) on delete set null,
  code text not null unique,
  description text not null,
  thematic_unit text,
  knowledge_object text,
  status public.active_status not null default 'active'
);

create index bncc_skills_component_id_idx on public.bncc_skills (component_id);
create index bncc_skills_grade_id_idx on public.bncc_skills (grade_id);
create index bncc_skills_code_idx on public.bncc_skills (code);

create table public.content_bncc_skills (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  bncc_skill_id uuid not null references public.bncc_skills (id) on delete cascade,
  unique (content_id, bncc_skill_id)
);

create index content_bncc_skills_content_id_idx on public.content_bncc_skills (content_id);
create index content_bncc_skills_bncc_skill_id_idx on public.content_bncc_skills (bncc_skill_id);

alter table public.bncc_stages enable row level security;
alter table public.bncc_knowledge_areas enable row level security;
alter table public.bncc_components enable row level security;
alter table public.bncc_skills enable row level security;
alter table public.content_bncc_skills enable row level security;

-- Referência pública (útil para professores consultarem habilidades),
-- escrita exclusiva do admin.
create policy "bncc_stages_public_read" on public.bncc_stages for select to public using (true);
create policy "bncc_stages_admin_all" on public.bncc_stages for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "bncc_knowledge_areas_public_read" on public.bncc_knowledge_areas for select to public using (true);
create policy "bncc_knowledge_areas_admin_all" on public.bncc_knowledge_areas for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "bncc_components_public_read" on public.bncc_components for select to public using (true);
create policy "bncc_components_admin_all" on public.bncc_components for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "bncc_skills_public_read" on public.bncc_skills for select to public using (status = 'active');
create policy "bncc_skills_admin_all" on public.bncc_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_bncc_skills_read" on public.content_bncc_skills for select to public using (true);
create policy "content_bncc_skills_admin_all" on public.content_bncc_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
