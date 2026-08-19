-- Dados de impressão do professor (logo, nome da escola, telefone) — usados
-- pra pré-preencher o cabeçalho das provas geradas, sem precisar digitar de
-- novo em cada prova.

alter table public.profiles
  add column school_name text,
  add column school_phone text,
  add column school_logo_url text;
