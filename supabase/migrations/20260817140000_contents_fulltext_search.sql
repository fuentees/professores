-- Fase 4: busca em texto completo nativa do Postgres para materiais, sem
-- serviço externo. Coluna gerada evita reprocessar o texto a cada busca.

alter table public.contents
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(body, '')), 'C')
  ) stored;

create index contents_search_vector_idx on public.contents using gin (search_vector);
