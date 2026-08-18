-- Fase 11: conteúdo de exemplo para demonstrar os recursos interativos.
-- Este arquivo é seed de DESENVOLVIMENTO — segue a convenção do Supabase CLI
-- (só é aplicado por `supabase db reset`/`db start`, nunca automaticamente
-- em produção) e usa `on conflict (slug) do nothing`, então rodar mais de
-- uma vez é seguro. Não insere dados de BNCC (a estrutura oficial da BNCC
-- deve vir de cadastro/importação do administrador, nunca ser inventada).

insert into public.learning_objects
  (title, slug, description, object_type, access_type, status, published_at, activity_type, config)
values
  (
    'Quiz: Frações básicas',
    'quiz-fracoes-basicas',
    'Revise a leitura e comparação de frações simples com este quiz rápido.',
    'Quiz',
    'public',
    'published',
    now(),
    'quiz',
    '{
      "questions": [
        {
          "id": "q1",
          "prompt": "Em uma pizza dividida em 8 pedaços iguais, qual fração representa 3 pedaços?",
          "options": [
            {"id": "a", "text": "3/5"},
            {"id": "b", "text": "3/8"},
            {"id": "c", "text": "8/3"}
          ],
          "correctOptionId": "b"
        },
        {
          "id": "q2",
          "prompt": "Qual fração é maior: 1/2 ou 1/4?",
          "options": [
            {"id": "a", "text": "1/2"},
            {"id": "b", "text": "1/4"},
            {"id": "c", "text": "São iguais"}
          ],
          "correctOptionId": "a"
        },
        {
          "id": "q3",
          "prompt": "Quanto é 2/4 simplificado?",
          "options": [
            {"id": "a", "text": "1/2"},
            {"id": "b", "text": "1/4"},
            {"id": "c", "text": "2/2"}
          ],
          "correctOptionId": "a"
        }
      ]
    }'::jsonb
  ),
  (
    'Verdadeiro ou Falso: Sistema Solar',
    'vf-sistema-solar',
    'Teste seus conhecimentos sobre os planetas e o Sistema Solar.',
    'Quiz',
    'public',
    'published',
    now(),
    'true_false',
    '{
      "statements": [
        {"id": "s1", "statement": "A Terra é o terceiro planeta a partir do Sol.", "isTrue": true},
        {"id": "s2", "statement": "Marte é conhecido como o planeta azul.", "isTrue": false},
        {"id": "s3", "statement": "Júpiter é o maior planeta do Sistema Solar.", "isTrue": true},
        {"id": "s4", "statement": "A Lua é um planeta.", "isTrue": false}
      ]
    }'::jsonb
  ),
  (
    'Associe: Capitais e Estados',
    'associe-capitais-estados',
    'Associe cada estado brasileiro à sua capital correspondente.',
    'Jogo',
    'public',
    'published',
    now(),
    'matching',
    '{
      "pairs": [
        {"id": "p1", "left": "São Paulo", "right": "São Paulo"},
        {"id": "p2", "left": "Bahia", "right": "Salvador"},
        {"id": "p3", "left": "Pernambuco", "right": "Recife"},
        {"id": "p4", "left": "Amazonas", "right": "Manaus"},
        {"id": "p5", "left": "Minas Gerais", "right": "Belo Horizonte"}
      ]
    }'::jsonb
  ),
  (
    'Jogo da memória: Sinônimos',
    'memoria-sinonimos',
    'Encontre os pares de palavras sinônimas.',
    'Jogo da memória',
    'public',
    'published',
    now(),
    'memory',
    '{
      "pairs": [
        {"id": "p1", "a": "Feliz", "b": "Contente"},
        {"id": "p2", "a": "Grande", "b": "Enorme"},
        {"id": "p3", "a": "Rápido", "b": "Veloz"},
        {"id": "p4", "a": "Bonito", "b": "Belo"}
      ]
    }'::jsonb
  ),
  (
    'Complete: Brasil Colônia',
    'complete-brasil-colonia',
    'Complete as frases sobre o período colonial brasileiro.',
    'Atividade digital',
    'public',
    'published',
    now(),
    'fill_blank',
    '{
      "sentences": [
        {"id": "s1", "text": "O Brasil foi colonizado por Portugal a partir do ano ___.", "answer": "1500"},
        {"id": "s2", "text": "O primeiro produto explorado pelos colonizadores foi o ___.", "answer": "pau-brasil"},
        {"id": "s3", "text": "A mão de obra escravizada trazida da África foi usada principalmente nos engenhos de ___.", "answer": "cana-de-açúcar"}
      ]
    }'::jsonb
  ),
  (
    'Ordene: Ciclo da água',
    'ordene-ciclo-agua',
    'Coloque as etapas do ciclo da água na ordem correta.',
    'Atividade digital',
    'public',
    'published',
    now(),
    'ordering',
    '{
      "items": [
        {"id": "i1", "text": "Evaporação da água dos rios, lagos e oceanos"},
        {"id": "i2", "text": "Formação das nuvens (condensação)"},
        {"id": "i3", "text": "Precipitação (chuva)"},
        {"id": "i4", "text": "Infiltração e escoamento da água no solo"}
      ]
    }'::jsonb
  ),
  (
    'Flashcards: Vocabulário básico em inglês',
    'flashcards-vocabulario-ingles',
    'Pratique palavras básicas do inglês com estes flashcards.',
    'Flashcards',
    'public',
    'published',
    now(),
    'flashcards',
    '{
      "cards": [
        {"id": "c1", "front": "House", "back": "Casa"},
        {"id": "c2", "front": "Dog", "back": "Cachorro"},
        {"id": "c3", "front": "School", "back": "Escola"},
        {"id": "c4", "front": "Book", "back": "Livro"},
        {"id": "c5", "front": "Water", "back": "Água"}
      ]
    }'::jsonb
  ),
  (
    'Simulador de Frações',
    'simulador-fracoes',
    'Visualize frações dividindo uma figura em partes e veja o equivalente decimal e percentual.',
    'Simulação',
    'public',
    'published',
    now(),
    'simulation',
    '{"simulationKey": "fracoes"}'::jsonb
  ),
  (
    'Simulador de Área e Perímetro',
    'simulador-area-perimetro',
    'Ajuste a largura e a altura de um retângulo e veja a área e o perímetro mudarem em tempo real.',
    'Simulação',
    'public',
    'published',
    now(),
    'simulation',
    '{"simulationKey": "area"}'::jsonb
  ),
  (
    'Simulador de Probabilidade',
    'simulador-probabilidade',
    'Lance um dado virtual várias vezes e observe a frequência de cada resultado se aproximar da probabilidade teórica.',
    'Simulação',
    'public',
    'published',
    now(),
    'simulation',
    '{"simulationKey": "probabilidade"}'::jsonb
  )
on conflict (slug) do nothing;

-- Organiza os materiais de História / 4º ano já publicados sob uma unidade
-- temática e temas reais, para o filtro em cascata (nível→série→disciplina→
-- unidade→tema→subtema) ter conteúdo de verdade pra filtrar. Isso é a
-- taxonomia própria do site pra organizar conteúdo já existente — não é dado
-- oficial da BNCC (que segue vindo exclusivamente do cadastro do admin).

insert into public.grade_subjects (grade_id, subject_id)
select g.id, s.id
from public.grades g, public.subjects s
where g.name = '4º ano' and s.name = 'História'
  and not exists (
    select 1 from public.grade_subjects gs
    where gs.grade_id = g.id and gs.subject_id = s.id
  );

insert into public.curriculum_units (grade_id, subject_id, name, slug)
select g.id, s.id, 'História local e formação do Brasil', 'historia-local-e-formacao-do-brasil'
from public.grades g, public.subjects s
where g.name = '4º ano' and s.name = 'História'
on conflict (grade_id, subject_id, slug) do nothing;

insert into public.themes (curriculum_unit_id, name, slug)
select cu.id, t.name, t.slug
from public.curriculum_units cu
cross join (values
  ('Fontes históricas e o trabalho do historiador', 'fontes-historicas-e-o-trabalho-do-historiador'),
  ('Formação da população brasileira', 'formacao-da-populacao-brasileira'),
  ('Patrimônio histórico e cultural', 'patrimonio-historico-e-cultural')
) as t(name, slug)
where cu.slug = 'historia-local-e-formacao-do-brasil'
on conflict (curriculum_unit_id, slug) do nothing;

insert into public.content_units (content_id, curriculum_unit_id)
select c.id, cu.id
from public.contents c, public.curriculum_units cu
where cu.slug = 'historia-local-e-formacao-do-brasil'
  and c.slug in (
    'fontes-historicas-o-que-sao-e-como-as-usamos',
    'os-povos-indigenas-na-formacao-do-brasil',
    'comunidades-quilombolas-historia-e-resistencia',
    'patrimonio-historico-e-cultural-da-minha-cidade',
    'linha-do-tempo-mudancas-e-permanencias-na-comunidade',
    'plano-de-aula-a-formacao-da-populacao-brasileira',
    'avaliacao-bimestral-historia-local-e-fontes-historicas',
    'plano-de-aula-fontes-historicas-e-o-trabalho-do-historiador',
    'plano-de-aula-patrimonio-material-e-imaterial',
    'avaliacao-povos-formadores-do-brasil-e-patrimonio-cultural'
  )
on conflict (content_id, curriculum_unit_id) do nothing;

insert into public.content_themes (content_id, theme_id)
select c.id, th.id
from public.contents c, public.themes th
where th.slug = 'fontes-historicas-e-o-trabalho-do-historiador'
  and c.slug in (
    'fontes-historicas-o-que-sao-e-como-as-usamos',
    'linha-do-tempo-mudancas-e-permanencias-na-comunidade',
    'avaliacao-bimestral-historia-local-e-fontes-historicas',
    'plano-de-aula-fontes-historicas-e-o-trabalho-do-historiador'
  )
on conflict (content_id, theme_id) do nothing;

insert into public.content_themes (content_id, theme_id)
select c.id, th.id
from public.contents c, public.themes th
where th.slug = 'formacao-da-populacao-brasileira'
  and c.slug in (
    'os-povos-indigenas-na-formacao-do-brasil',
    'comunidades-quilombolas-historia-e-resistencia',
    'plano-de-aula-a-formacao-da-populacao-brasileira',
    'avaliacao-povos-formadores-do-brasil-e-patrimonio-cultural'
  )
on conflict (content_id, theme_id) do nothing;

insert into public.content_themes (content_id, theme_id)
select c.id, th.id
from public.contents c, public.themes th
where th.slug = 'patrimonio-historico-e-cultural'
  and c.slug in (
    'patrimonio-historico-e-cultural-da-minha-cidade',
    'plano-de-aula-patrimonio-material-e-imaterial',
    'avaliacao-povos-formadores-do-brasil-e-patrimonio-cultural'
  )
on conflict (content_id, theme_id) do nothing;

-- Liga os 2 objetos interativos de frações (do seed acima) à unidade/tema de
-- Matemática que já existiam no banco antes desta sessão — deriva grade e
-- disciplina a partir do próprio tema, sem adivinhar IDs.
update public.learning_objects lo
set grade_id = cu.grade_id,
    subject_id = cu.subject_id,
    theme_id = th.id
from public.themes th
join public.curriculum_units cu on cu.id = th.curriculum_unit_id
where th.slug = 'fracoes-operacoes-e-problemas'
  and lo.slug in ('quiz-fracoes-basicas', 'simulador-fracoes');
