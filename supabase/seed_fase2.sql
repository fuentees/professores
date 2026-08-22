-- Níveis de ensino
insert into public.education_levels (name, slug, order_index) values
  ('Educação Infantil', 'educacao-infantil', 0),
  ('Ensino Fundamental I', 'ensino-fundamental-i', 1),
  ('Ensino Fundamental II', 'ensino-fundamental-ii', 2),
  ('Ensino Médio', 'ensino-medio', 3);

-- Séries / anos (vinculados por slug do nível)
insert into public.grades (education_level_id, name, slug, order_index) values
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Bebês', 'bebes', 0),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Crianças bem pequenas', 'criancas-bem-pequenas', 1),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Crianças pequenas', 'criancas-pequenas', 2),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Maternal', 'maternal', 3),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Jardim I', 'jardim-i', 4),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Jardim II', 'jardim-ii', 5),
  ((select id from public.education_levels where slug = 'educacao-infantil'), 'Pré-escola', 'pre-escola', 6),
  ((select id from public.education_levels where slug = 'ensino-fundamental-i'), '1º ano', '1-ano', 0),
  ((select id from public.education_levels where slug = 'ensino-fundamental-i'), '2º ano', '2-ano', 1),
  ((select id from public.education_levels where slug = 'ensino-fundamental-i'), '3º ano', '3-ano', 2),
  ((select id from public.education_levels where slug = 'ensino-fundamental-i'), '4º ano', '4-ano', 3),
  ((select id from public.education_levels where slug = 'ensino-fundamental-i'), '5º ano', '5-ano', 4),
  ((select id from public.education_levels where slug = 'ensino-fundamental-ii'), '6º ano', '6-ano', 0),
  ((select id from public.education_levels where slug = 'ensino-fundamental-ii'), '7º ano', '7-ano', 1),
  ((select id from public.education_levels where slug = 'ensino-fundamental-ii'), '8º ano', '8-ano', 2),
  ((select id from public.education_levels where slug = 'ensino-fundamental-ii'), '9º ano', '9-ano', 3),
  ((select id from public.education_levels where slug = 'ensino-medio'), '1ª série', '1-serie', 0),
  ((select id from public.education_levels where slug = 'ensino-medio'), '2ª série', '2-serie', 1),
  ((select id from public.education_levels where slug = 'ensino-medio'), '3ª série', '3-serie', 2);

-- Disciplinas (todas, dedupe entre níveis)
insert into public.subjects (name, slug, order_index) values
  ('Linguagem oral', 'linguagem-oral', 0),
  ('Coordenação motora', 'coordenacao-motora', 1),
  ('Musicalização', 'musicalizacao', 2),
  ('Artes visuais', 'artes-visuais', 3),
  ('Movimento', 'movimento', 4),
  ('Natureza e sociedade', 'natureza-e-sociedade', 5),
  ('Noções matemáticas', 'nocoes-matematicas', 6),
  ('Alfabetização inicial', 'alfabetizacao-inicial', 7),
  ('Contação de histórias', 'contacao-de-historias', 8),
  ('Psicomotricidade', 'psicomotricidade', 9),
  ('Educação socioemocional', 'educacao-socioemocional', 10),
  ('Brincadeiras e jogos', 'brincadeiras-e-jogos', 11),
  ('Datas comemorativas', 'datas-comemorativas', 12),
  ('Língua Portuguesa', 'lingua-portuguesa', 13),
  ('Matemática', 'matematica', 14),
  ('Ciências', 'ciencias', 15),
  ('História', 'historia', 16),
  ('Geografia', 'geografia', 17),
  ('Arte', 'arte', 18),
  ('Educação Física', 'educacao-fisica', 19),
  ('Língua Inglesa', 'lingua-inglesa', 20),
  ('Ensino Religioso', 'ensino-religioso', 21),
  ('Informática', 'informatica', 22),
  ('Educação Financeira', 'educacao-financeira', 23),
  ('Robótica', 'robotica', 24),
  ('Tecnologia e Computação', 'tecnologia-e-computacao', 25),
  ('Redação', 'redacao', 26),
  ('Literatura', 'literatura', 27),
  ('Língua Espanhola', 'lingua-espanhola', 28),
  ('Filosofia', 'filosofia', 29),
  ('Sociologia', 'sociologia', 30),
  ('Projeto de Vida', 'projeto-de-vida', 31),
  ('Geometria', 'geometria', 32),
  ('Estatística', 'estatistica', 33),
  ('Matemática Financeira', 'matematica-financeira', 34),
  ('Biologia', 'biologia', 35),
  ('Física', 'fisica', 36),
  ('Química', 'quimica', 37),
  ('Ciências da Natureza', 'ciencias-da-natureza', 38),
  ('Empreendedorismo', 'empreendedorismo', 39),
  ('Atualidades', 'atualidades', 40),
  ('Preparação para o ENEM', 'preparacao-para-o-enem', 41),
  ('Orientação profissional', 'orientacao-profissional', 42);

-- Finalidades principais do material. Subtipos e contextos ficam em tags;
-- formato vem de content_files e gabarito de contents.has_answer_key.
insert into public.content_types (name, slug, description, order_index) values
  ('Atividade', 'atividade', 'Material que o aluno realiza para praticar, produzir ou aplicar um conteúdo.', 0),
  ('Avaliação', 'avaliacao', 'Instrumento usado para verificar e registrar a aprendizagem dos alunos.', 1),
  ('Planejamento', 'planejamento', 'Material que ajuda o professor a organizar o ensino e a sequência das aulas.', 2),
  ('Material de apoio', 'material-de-apoio', 'Recurso usado para explicar, apresentar, revisar ou complementar um conteúdo.', 3);

