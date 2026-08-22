-- Consolida a classificação de materiais em quatro finalidades mutuamente
-- exclusivas. A classificação antiga misturava finalidade pedagógica,
-- subtipo, formato de arquivo e características como gabarito.

do $migration$
begin

insert into public.content_types (name, slug, description, order_index, status)
values
  (
    'Atividade',
    'atividade',
    'Material que o aluno realiza para praticar, produzir ou aplicar um conteúdo.',
    0,
    'active'
  ),
  (
    'Avaliação',
    'avaliacao',
    'Instrumento usado para verificar e registrar a aprendizagem dos alunos.',
    1,
    'active'
  ),
  (
    'Planejamento',
    'planejamento',
    'Material que ajuda o professor a organizar o ensino e a sequência das aulas.',
    2,
    'active'
  ),
  (
    'Material de apoio',
    'material-de-apoio',
    'Recurso usado para explicar, apresentar, revisar ou complementar um conteúdo.',
    3,
    'active'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  order_index = excluded.order_index,
  status = excluded.status;

create temporary table material_type_migration_map (
  source_slug text primary key,
  target_slug text not null
) on commit drop;

insert into material_type_migration_map (source_slug, target_slug)
values
  ('atividade', 'atividade'),
  ('lista-de-exercicios', 'atividade'),
  ('atividade-de-recuperacao', 'atividade'),
  ('atividade-adaptada', 'atividade'),
  ('atividade-ludica', 'atividade'),
  ('jogo-pedagogico', 'atividade'),
  ('quiz', 'atividade'),
  ('flashcards', 'atividade'),
  ('experimento', 'atividade'),
  ('aula-pratica', 'atividade'),
  ('roteiro-de-experimento', 'atividade'),
  ('avaliacao', 'avaliacao'),
  ('prova', 'avaliacao'),
  ('simulado', 'avaliacao'),
  ('atividade-diagnostica', 'avaliacao'),
  ('plano-de-aula', 'planejamento'),
  ('sequencia-didatica', 'planejamento'),
  ('projeto', 'planejamento'),
  ('roteiro-de-estudo', 'material-de-apoio'),
  ('resumo', 'material-de-apoio'),
  ('mapa-mental', 'material-de-apoio'),
  ('infografico', 'material-de-apoio'),
  ('apresentacao', 'material-de-apoio'),
  ('apostila', 'material-de-apoio'),
  ('livro-digital', 'material-de-apoio'),
  ('texto-de-apoio', 'material-de-apoio'),
  ('texto-para-interpretacao', 'material-de-apoio'),
  ('ficha-de-leitura', 'material-de-apoio'),
  ('video', 'material-de-apoio'),
  ('audio', 'material-de-apoio'),
  ('podcast', 'material-de-apoio'),
  ('imagem', 'material-de-apoio'),
  ('cartaz', 'material-de-apoio'),
  ('molde', 'material-de-apoio'),
  ('planilha', 'material-de-apoio'),
  ('documento', 'material-de-apoio'),
  ('link-externo', 'material-de-apoio'),
  ('objeto-de-aprendizagem', 'material-de-apoio'),
  ('material-da-bncc', 'material-de-apoio'),
  ('material-para-saeb', 'material-de-apoio'),
  ('material-para-enem', 'material-de-apoio'),
  ('material-para-vestibular', 'material-de-apoio'),
  ('material-para-concurso', 'material-de-apoio'),
  ('material-para-impressao', 'material-de-apoio'),
  ('gabarito', 'material-de-apoio');

-- Qualquer tipo personalizado que não faça parte da lista original também é
-- preservado como marcador e migra para Material de apoio.
insert into material_type_migration_map (source_slug, target_slug)
select ct.slug, 'material-de-apoio'
from public.content_types ct
where ct.slug not in ('atividade', 'avaliacao', 'planejamento', 'material-de-apoio')
on conflict (source_slug) do nothing;

-- Gabarito já possui um campo próprio em contents.
update public.contents c
set has_answer_key = true
where exists (
  select 1
  from public.content_content_types cct
  join public.content_types ct on ct.id = cct.content_type_id
  where cct.content_id = c.id
    and ct.slug = 'gabarito'
);

-- Os nomes antigos passam a ser marcadores, mantendo a informação específica
-- (por exemplo: Simulado, Lista de exercícios, BNCC ou Vídeo).
insert into public.tags (name, slug, status)
select distinct ct.name, ct.slug, 'active'::public.active_status
from public.content_content_types cct
join public.content_types ct on ct.id = cct.content_type_id
where ct.slug not in ('atividade', 'avaliacao', 'planejamento', 'material-de-apoio', 'gabarito')
on conflict (slug) do update
set name = excluded.name, status = 'active';

insert into public.content_tags (content_id, tag_id)
select distinct cct.content_id, tags.id
from public.content_content_types cct
join public.content_types ct on ct.id = cct.content_type_id
join public.tags tags on tags.slug = ct.slug
where ct.slug not in ('atividade', 'avaliacao', 'planejamento', 'material-de-apoio', 'gabarito')
on conflict (content_id, tag_id) do nothing;

-- Escolhe uma única finalidade principal por material. A ordem anterior é
-- usada apenas como desempate caso algum registro possua vários tipos antigos.
create temporary table material_primary_choice on commit drop as
select distinct on (cct.content_id)
  cct.content_id,
  target.id as content_type_id
from public.content_content_types cct
join public.content_types source on source.id = cct.content_type_id
join material_type_migration_map map on map.source_slug = source.slug
join public.content_types target on target.slug = map.target_slug
order by cct.content_id, source.order_index, source.slug;

delete from public.content_content_types
where content_id in (select content_id from material_primary_choice);

insert into public.content_content_types (content_id, content_type_id)
select content_id, content_type_id
from material_primary_choice
on conflict (content_id, content_type_id) do nothing;

update public.content_types
set status = 'inactive'
where slug not in ('atividade', 'avaliacao', 'planejamento', 'material-de-apoio');

end
$migration$;
