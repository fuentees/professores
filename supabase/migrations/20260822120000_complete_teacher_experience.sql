-- Completa os fluxos encontrados no teste real de uma professora:
-- referência BNCC útil, solicitações de assinatura, histórico genérico de
-- downloads e cobertura mínima do gerador para História/4º ano.

-- Resíduos deixados por testes antigos de administração, sem dependências.
delete from public.bncc_stages s
where s.name like 'Etapa Teste %'
  and not exists (select 1 from public.bncc_knowledge_areas a where a.stage_id = s.id);

-- Histórico único para materiais, questões, provas e arquivos de aula.
create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles (id) on delete cascade,
  resource_type text not null check (resource_type in ('material', 'question', 'exam', 'lesson')),
  resource_id uuid not null,
  resource_title text not null,
  resource_href text not null,
  file_name text,
  downloaded_at timestamptz not null default now()
);

create index if not exists download_events_teacher_id_idx
  on public.download_events (teacher_id, downloaded_at desc);

alter table public.download_events enable row level security;

drop policy if exists "download_events_own_read" on public.download_events;
create policy "download_events_own_read" on public.download_events
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "download_events_admin_read" on public.download_events;
create policy "download_events_admin_read" on public.download_events
  for select to authenticated using (public.is_admin());

-- Preserva o histórico antigo de materiais no novo formato.
insert into public.download_events (
  teacher_id, resource_type, resource_id, resource_title, resource_href, file_name, downloaded_at
)
select
  d.teacher_id,
  'material',
  d.content_id,
  c.title,
  '/materiais/' || c.slug,
  coalesce(cf.name, c.title || '.docx'),
  d.downloaded_at
from public.downloads d
join public.contents c on c.id = d.content_id
left join public.content_files cf on cf.id = d.content_file_id
where not exists (
  select 1
  from public.download_events e
  where e.teacher_id is not distinct from d.teacher_id
    and e.resource_type = 'material'
    and e.resource_id = d.content_id
    and e.downloaded_at = d.downloaded_at
);

-- Um professor pode solicitar um plano pago sem cair num ciclo de páginas.
create table if not exists public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscription_requests_one_pending_per_teacher_idx
  on public.subscription_requests (teacher_id)
  where status = 'pending';

create index if not exists subscription_requests_status_idx
  on public.subscription_requests (status, created_at desc);

drop trigger if exists set_subscription_requests_updated_at on public.subscription_requests;
create trigger set_subscription_requests_updated_at
  before update on public.subscription_requests
  for each row execute function public.set_updated_at();

alter table public.subscription_requests enable row level security;

drop policy if exists "subscription_requests_own_read" on public.subscription_requests;
create policy "subscription_requests_own_read" on public.subscription_requests
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "subscription_requests_admin_all" on public.subscription_requests;
create policy "subscription_requests_admin_all" on public.subscription_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Catálogo BNCC essencial ao conteúdo e às questões atuais.
do $$
declare
  v_stage uuid;
  v_area uuid;
  v_history uuid;
  v_geography uuid;
  v_grade uuid;
begin
  select id into v_stage from public.bncc_stages where name = 'Ensino Fundamental' order by id limit 1;
  if v_stage is null then
    insert into public.bncc_stages (name, order_index) values ('Ensino Fundamental', 1) returning id into v_stage;
  end if;

  select id into v_area from public.bncc_knowledge_areas
  where stage_id = v_stage and name = 'Ciências Humanas' order by id limit 1;
  if v_area is null then
    insert into public.bncc_knowledge_areas (stage_id, name, order_index)
    values (v_stage, 'Ciências Humanas', 3) returning id into v_area;
  end if;

  select id into v_history from public.bncc_components
  where knowledge_area_id = v_area and name = 'História' order by id limit 1;
  if v_history is null then
    insert into public.bncc_components (knowledge_area_id, name, order_index)
    values (v_area, 'História', 1) returning id into v_history;
  end if;

  select id into v_geography from public.bncc_components
  where knowledge_area_id = v_area and name = 'Geografia' order by id limit 1;
  if v_geography is null then
    insert into public.bncc_components (knowledge_area_id, name, order_index)
    values (v_area, 'Geografia', 2) returning id into v_geography;
  end if;

  select id into v_grade from public.grades where name = '4º ano' order by id limit 1;

  insert into public.bncc_skills (
    component_id, grade_id, code, description, thematic_unit, knowledge_object, status
  ) values
    (v_history, v_grade, 'EF04HI01',
      'Reconhecer a história como resultado da ação do ser humano no tempo e no espaço, com base na identificação de mudanças e permanências ao longo do tempo.',
      'Transformações e permanências nas trajetórias dos grupos humanos',
      'A ação das pessoas, grupos sociais e comunidades no tempo e no espaço', 'active'),
    (v_history, v_grade, 'EF04HI03',
      'Identificar as transformações ocorridas na cidade ao longo do tempo e discutir suas interferências nos modos de vida de seus habitantes, tomando como ponto de partida o presente.',
      'Circulação de pessoas e as transformações no meio natural',
      'O passado e o presente: a noção de permanência e as lentas transformações sociais e culturais', 'active'),
    (v_geography, v_grade, 'EF04GE01',
      'Selecionar, em seus lugares de vivência e em suas histórias familiares e/ou da comunidade, elementos de distintas culturas, valorizando o que é próprio em cada uma delas e sua contribuição para a formação da cultura local, regional e brasileira.',
      'O sujeito e seu lugar no mundo', 'Território e diversidade cultural', 'active'),
    (v_geography, v_grade, 'EF04GE02',
      'Descrever processos migratórios e suas contribuições para a formação da sociedade brasileira.',
      'O sujeito e seu lugar no mundo', 'Processos migratórios no Brasil', 'active')
  on conflict (code) do update set
    component_id = excluded.component_id,
    grade_id = excluded.grade_id,
    description = excluded.description,
    thematic_unit = excluded.thematic_unit,
    knowledge_object = excluded.knowledge_object,
    status = 'active';
end $$;

-- Relaciona as questões importadas às habilidades declaradas nos arquivos.
insert into public.question_bncc_skills (question_id, bncc_skill_id)
select q.id, s.id
from public.questions q
join public.bncc_skills s on s.code = case
  when q.code in ('HIS4-1T-001', 'HIS4-1T-001-B', 'HIS4-1T-004') then 'EF04HI01'
  when q.code in ('HIS4-1T-003', 'HIS4-1T-005') then 'EF04HI03'
  when q.code = 'GEO 4-2E -1' then 'EF04GE02'
end
where q.code in ('HIS4-1T-001', 'HIS4-1T-001-B', 'HIS4-1T-003', 'HIS4-1T-004', 'HIS4-1T-005', 'GEO 4-2E -1')
on conflict do nothing;

-- Habilidades nos materiais publicados para a consulta BNCC levar a conteúdo útil.
insert into public.content_bncc_skills (content_id, bncc_skill_id)
select c.id, s.id
from public.contents c
join public.bncc_skills s on s.code = case
  when c.title ilike '%linha do tempo%' then 'EF04HI01'
  when c.title ilike '%população brasileira%' or c.title ilike '%povos formadores%' then 'EF04GE01'
  when c.title ilike '%fontes históricas%' then 'EF04HI03'
  when c.title ilike '%cidade%' or c.title ilike '%patrimônio%' then 'EF04HI03'
end
where c.status = 'published'
  and (
    c.title ilike '%linha do tempo%'
    or c.title ilike '%população brasileira%'
    or c.title ilike '%povos formadores%'
    or c.title ilike '%fontes históricas%'
    or c.title ilike '%cidade%'
    or c.title ilike '%patrimônio%'
  )
on conflict do nothing;

-- Completa exatamente os dois níveis ausentes no cenário padrão do gerador.
insert into public.questions (
  code, title, statement, question_type, difficulty, subject_id, grade_id,
  answer_key, bloom_primary_level, pedagogical_note, publication_status, status, access_type
)
select
  'SEED-HIS-4-004',
  'Mudanças e permanências na comunidade',
  'Qual alternativa apresenta uma permanência na história de uma comunidade?',
  'multiple_choice', 'medium', s.id, g.id,
  'Uma festa tradicional realizada há várias gerações.',
  'analisar',
  'Avalia se o estudante diferencia transformação e permanência em situações próximas de sua realidade.',
  'published', 'active', 'teacher_only'
from public.subjects s cross join public.grades g
where s.name = 'História' and g.name = '4º ano'
  and not exists (select 1 from public.questions where code = 'SEED-HIS-4-004');

insert into public.questions (
  code, title, statement, question_type, difficulty, subject_id, grade_id,
  answer_key, bloom_primary_level, pedagogical_note, publication_status, status, access_type
)
select
  'SEED-HIS-4-005',
  'Preservação do patrimônio cultural',
  'Uma construção antiga da cidade será demolida. Qual atitude demonstra melhor o uso responsável das fontes históricas antes de tomar essa decisão?',
  'multiple_choice', 'hard', s.id, g.id,
  'Pesquisar documentos, relatos, fotografias e o valor cultural da construção para a comunidade.',
  'avaliar',
  'Exige que o estudante avalie evidências históricas e defenda uma decisão fundamentada.',
  'published', 'active', 'teacher_only'
from public.subjects s cross join public.grades g
where s.name = 'História' and g.name = '4º ano'
  and not exists (select 1 from public.questions where code = 'SEED-HIS-4-005');

insert into public.question_alternatives (question_id, label, body, is_correct, order_index)
select q.id, a.label, a.body, a.is_correct, a.order_index
from public.questions q
cross join (values
  ('A', 'Uma festa tradicional realizada há várias gerações.', true, 0),
  ('B', 'A troca recente do nome de uma rua.', false, 1),
  ('C', 'A inauguração de uma escola nova.', false, 2),
  ('D', 'A substituição dos ônibus por modelos mais modernos.', false, 3)
) as a(label, body, is_correct, order_index)
where q.code = 'SEED-HIS-4-004'
  and not exists (select 1 from public.question_alternatives qa where qa.question_id = q.id);

insert into public.question_alternatives (question_id, label, body, is_correct, order_index)
select q.id, a.label, a.body, a.is_correct, a.order_index
from public.questions q
cross join (values
  ('A', 'Demolir imediatamente porque toda construção antiga é insegura.', false, 0),
  ('B', 'Decidir apenas pela aparência atual do prédio.', false, 1),
  ('C', 'Pesquisar documentos, relatos, fotografias e o valor cultural da construção para a comunidade.', true, 2),
  ('D', 'Perguntar somente à pessoa responsável pela demolição.', false, 3)
) as a(label, body, is_correct, order_index)
where q.code = 'SEED-HIS-4-005'
  and not exists (select 1 from public.question_alternatives qa where qa.question_id = q.id);

insert into public.question_bncc_skills (question_id, bncc_skill_id)
select q.id, s.id
from public.questions q
join public.bncc_skills s on s.code = case
  when q.code = 'SEED-HIS-4-004' then 'EF04HI01'
  when q.code = 'SEED-HIS-4-005' then 'EF04HI03'
end
where q.code in ('SEED-HIS-4-004', 'SEED-HIS-4-005')
on conflict do nothing;

-- Corrige perdas de espaço presentes nos sete arquivos importados antes do
-- parser passar a preservar xml:space entre runs do Word.
update public.question_answers set expected_answer =
  replace(replace(replace(replace(expected_answer,
    'oexcluiramdo', 'o excluíram do'),
    'queimigranteé', 'que imigrante é'),
    'omigrante internoé', 'o migrante interno é'),
    'nósolhamos', 'nós olhamos')
where expected_answer like '%oexcluiramdo%'
   or expected_answer like '%queimigranteé%'
   or expected_answer like '%omigrante internoé%'
   or expected_answer like '%nósolhamos%';

update public.questions set pedagogical_note =
  replace(replace(replace(pedagogical_note,
    'habilidade(EF', 'habilidade (EF'),
    'emdescrever', 'em descrever'),
    '— que', ' — que')
where pedagogical_note like '%habilidade(EF%'
   or pedagogical_note like '%emdescrever%';

update public.question_rubrics set criteria =
  replace(replace(replace(replace(replace(replace(replace(replace(criteria,
    'naturezaoralda', 'natureza oral da'),
    'naturezamaterialdo', 'natureza material do'),
    'comoFonte', 'como Fonte'),
    'comoImaterial', 'como Imaterial'),
    'Imateriale', 'Imaterial e'),
    'àFonte', 'à Fonte'),
    ')e à', ') e à'),
    'tipo de fontecomo', 'tipo de fonte como')
where criteria like '%naturezaoralda%'
   or criteria like '%naturezamaterialdo%'
   or criteria like '%comoFonte%'
   or criteria like '%comoImaterial%'
   or criteria like '%Imateriale%'
   or criteria like '%àFonte%'
   or criteria like '%)e à%'
   or criteria like '%fontecomo%';
