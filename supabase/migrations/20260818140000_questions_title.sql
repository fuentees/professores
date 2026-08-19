-- Redesign visual do QuestionCard (banco de questões) precisa de um título
-- curto pra usar como heading em vez do enunciado inteiro. Coluna nullable,
-- não-destrutiva: quando ausente, o app usa os primeiros caracteres do
-- enunciado como fallback (ver src/components/questions/question-card.tsx).
alter table public.questions add column title text;
