-- Padroniza a linguagem apresentada ao professor: "avaliação" é o
-- instrumento criado pelo gerador; "prova" deixa de aparecer como uma
-- segunda categoria concorrente nas vantagens dos planos.

update public.plans
set features = (
  select coalesce(
    jsonb_agg(
      case feature
        when 'Até 3 provas geradas por mês' then 'Até 3 avaliações salvas por mês'
        when 'Provas geradas ilimitadas' then 'Avaliações salvas ilimitadas'
        else feature
      end
      order by position
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements_text(features) with ordinality as item(feature, position)
)
where features @> '["Até 3 provas geradas por mês"]'::jsonb
   or features @> '["Provas geradas ilimitadas"]'::jsonb;
