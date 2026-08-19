-- "Dono do app": um admin com privilégio extra pra gerenciar a plataforma em
-- nível de negócio (planos/assinaturas, outros admins) — separado do admin
-- de conteúdo. Fica como flag booleana sobre o role 'admin' existente (não
-- um novo valor de enum): evita reescrever todas as policies/RLS que já
-- checam role = 'admin' via is_admin(), e é trivialmente reversível.
alter table public.profiles
  add column is_owner boolean not null default false;

-- Promove o único admin existente a dono, preservando o estado atual do
-- sistema (sem isso, ninguém teria acesso ao novo painel).
update public.profiles set is_owner = true where role = 'admin';
