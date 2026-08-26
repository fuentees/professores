-- Anotações internas do admin sobre um professor (ex: "ligou reclamando de
-- X, resolvido com Y"). Histórico append-only com autor e data, não um campo
-- único sobrescrevível — perder o contexto de quem disse o quê e quando é
-- pior que não ter a anotação. Some com a conta do professor; se o autor sair
-- da equipe a nota permanece (author_id vira null).

create table public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index teacher_notes_teacher_id_idx on public.teacher_notes (teacher_id, created_at desc);

alter table public.teacher_notes enable row level security;

create policy "teacher_notes_admin_all" on public.teacher_notes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
