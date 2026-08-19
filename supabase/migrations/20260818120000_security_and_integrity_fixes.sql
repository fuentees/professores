-- Consolidação técnica: fecha brechas encontradas em auditoria completa de
-- RLS/integridade (ver plano em
-- C:\Users\Administrador\.claude\plans\sleepy-floating-flurry.md, seção
-- "Parte A — Segurança e integridade técnica").
--
-- 1) content_files: a policy de leitura só checava se o conteúdo pai estava
--    publicado, nunca se o professor logado realmente tem entitlement pro
--    access_type do conteúdo (subscriber_only vazava metadata de arquivo —
--    nome, storage_path, tamanho — pra qualquer autenticado). Replica em SQL
--    a mesma regra de src/lib/access/can-access-resource.ts +
--    subscriber-access.ts (perfil ativo + assinatura com plano ativo OU
--    grant individual).
-- 2) subscriptions: nada impedia duas assinaturas "active" simultâneas pro
--    mesmo professor.
-- 3) exam_generation_events: log append-only pra fechar o contorno de cota
--    "gerar prova -> deletar -> gerar de novo" (getExamGenerationQuota
--    contava linhas vivas em generated_exams).

-- 1) content_files ------------------------------------------------------------

drop policy "content_files_authenticated_read" on public.content_files;

create policy "content_files_authenticated_read" on public.content_files
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid() and p.status = 'active'
    )
    and exists (
      select 1 from public.contents c
      where c.id = content_files.content_id
        and c.status = 'published'
        and (c.publish_at is null or c.publish_at <= now())
        and (
          c.access_type in ('public', 'free_signup', 'teacher_only')
          or (
            c.access_type = 'subscriber_only'
            and (
              exists (
                select 1
                from public.subscriptions s
                join public.plans pl on pl.id = s.plan_id
                where s.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
                  and s.status = 'active'
                  and pl.status = 'active'
                  and (s.expires_at is null or s.expires_at > now())
              )
              or exists (
                select 1 from public.access_grants g
                where g.teacher_id = (select id from public.profiles where auth_user_id = auth.uid())
                  and g.content_id = c.id
                  and (g.expires_at is null or g.expires_at > now())
              )
            )
          )
        )
    )
  );

-- 2) subscriptions: no máximo uma "active" por professor ----------------------

create unique index subscriptions_one_active_per_teacher_idx
  on public.subscriptions (teacher_id)
  where status = 'active';

-- 3) exam_generation_events ----------------------------------------------------

create table public.exam_generation_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  exam_id uuid references public.generated_exams (id) on delete set null,
  created_at timestamptz not null default now()
);

create index exam_generation_events_teacher_created_idx
  on public.exam_generation_events (teacher_id, created_at);

alter table public.exam_generation_events enable row level security;

-- Append-only pro professor: pode inserir e ler as próprias, nunca
-- atualizar/apagar (senão o contorno de cota via delete só migraria pra cá).
create policy "exam_generation_events_own_read" on public.exam_generation_events
  for select to authenticated
  using (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "exam_generation_events_own_insert" on public.exam_generation_events
  for insert to authenticated
  with check (teacher_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "exam_generation_events_admin_all" on public.exam_generation_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
