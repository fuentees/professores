-- Habilidades encontradas em documentos Word passam a alimentar o catálogo
-- automaticamente, mas só ficam públicas depois da aprovação humana da
-- importação que as trouxe.

alter table public.bncc_skills
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_import_id uuid references public.question_imports (id) on delete set null,
  add column if not exists verification_status text not null default 'verified';

alter table public.bncc_skills
  drop constraint if exists bncc_skills_source_type_check,
  add constraint bncc_skills_source_type_check
    check (source_type in ('manual', 'word_import')),
  drop constraint if exists bncc_skills_verification_status_check,
  add constraint bncc_skills_verification_status_check
    check (verification_status in ('pending', 'verified'));

create index if not exists bncc_skills_source_import_id_idx
  on public.bncc_skills (source_import_id);
create index if not exists bncc_skills_verification_status_idx
  on public.bncc_skills (verification_status);

-- A árvore canônica abaixo permite que a primeira questão de qualquer
-- componente conhecido seja classificada sem exigir cadastro manual prévio.
insert into public.bncc_stages (name, order_index)
select seed.name, seed.order_index
from (values
  ('Educação Infantil', 0),
  ('Ensino Fundamental', 1),
  ('Ensino Médio', 2)
) as seed(name, order_index)
where not exists (
  select 1 from public.bncc_stages current
  where lower(current.name) = lower(seed.name)
);

insert into public.bncc_knowledge_areas (stage_id, name, order_index)
select stage.id, seed.area_name, seed.order_index
from (values
  ('Educação Infantil', 'Campos de experiências', 1),
  ('Ensino Fundamental', 'Linguagens', 1),
  ('Ensino Fundamental', 'Matemática', 2),
  ('Ensino Fundamental', 'Ciências da Natureza', 3),
  ('Ensino Fundamental', 'Ciências Humanas', 4),
  ('Ensino Fundamental', 'Ensino Religioso', 5),
  ('Ensino Médio', 'Linguagens e suas Tecnologias', 1),
  ('Ensino Médio', 'Matemática e suas Tecnologias', 2),
  ('Ensino Médio', 'Ciências da Natureza e suas Tecnologias', 3),
  ('Ensino Médio', 'Ciências Humanas e Sociais Aplicadas', 4)
) as seed(stage_name, area_name, order_index)
join public.bncc_stages stage on lower(stage.name) = lower(seed.stage_name)
where not exists (
  select 1 from public.bncc_knowledge_areas current
  where current.stage_id = stage.id and lower(current.name) = lower(seed.area_name)
);

insert into public.bncc_components (knowledge_area_id, name, order_index)
select area.id, seed.component_name, seed.order_index
from (values
  ('Educação Infantil', 'Campos de experiências', 'O eu, o outro e o nós', 1),
  ('Educação Infantil', 'Campos de experiências', 'Corpo, gestos e movimentos', 2),
  ('Educação Infantil', 'Campos de experiências', 'Traços, sons, cores e formas', 3),
  ('Educação Infantil', 'Campos de experiências', 'Escuta, fala, pensamento e imaginação', 4),
  ('Educação Infantil', 'Campos de experiências', 'Espaços, tempos, quantidades, relações e transformações', 5),
  ('Ensino Fundamental', 'Linguagens', 'Língua Portuguesa', 1),
  ('Ensino Fundamental', 'Linguagens', 'Arte', 2),
  ('Ensino Fundamental', 'Linguagens', 'Educação Física', 3),
  ('Ensino Fundamental', 'Linguagens', 'Língua Inglesa', 4),
  ('Ensino Fundamental', 'Matemática', 'Matemática', 1),
  ('Ensino Fundamental', 'Ciências da Natureza', 'Ciências', 1),
  ('Ensino Fundamental', 'Ciências Humanas', 'História', 1),
  ('Ensino Fundamental', 'Ciências Humanas', 'Geografia', 2),
  ('Ensino Fundamental', 'Ensino Religioso', 'Ensino Religioso', 1),
  ('Ensino Médio', 'Linguagens e suas Tecnologias', 'Língua Portuguesa', 1),
  ('Ensino Médio', 'Linguagens e suas Tecnologias', 'Linguagens e suas Tecnologias', 2),
  ('Ensino Médio', 'Matemática e suas Tecnologias', 'Matemática', 1),
  ('Ensino Médio', 'Ciências da Natureza e suas Tecnologias', 'Ciências da Natureza', 1),
  ('Ensino Médio', 'Ciências Humanas e Sociais Aplicadas', 'Ciências Humanas e Sociais Aplicadas', 1)
) as seed(stage_name, area_name, component_name, order_index)
join public.bncc_stages stage on lower(stage.name) = lower(seed.stage_name)
join public.bncc_knowledge_areas area
  on area.stage_id = stage.id and lower(area.name) = lower(seed.area_name)
where not exists (
  select 1 from public.bncc_components current
  where current.knowledge_area_id = area.id and lower(current.name) = lower(seed.component_name)
);

comment on column public.bncc_skills.source_type is
  'Origem do cadastro: manual ou importação de Word.';
comment on column public.bncc_skills.verification_status is
  'Habilidade importada permanece pendente/inativa até a revisão da questão.';
