-- Fase 3: buckets de Storage e políticas.
--
-- "public"  → capas, banners, imagens do blog/site. Leitura pública, escrita
--             só do admin.
-- "private" → arquivos de materiais, cursos, aulas, objetos de aprendizagem.
--             Nunca lidos diretamente pelo cliente: toda entrega passa por
--             URL assinada gerada no servidor com a service role key, depois
--             de checar permissão de acesso na aplicação.

insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private', 'private', false)
on conflict (id) do nothing;

create policy "public_bucket_read"
  on storage.objects for select
  to public
  using (bucket_id = 'public');

create policy "public_bucket_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public' and public.is_admin());

create policy "public_bucket_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'public' and public.is_admin())
  with check (bucket_id = 'public' and public.is_admin());

create policy "public_bucket_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'public' and public.is_admin());

-- Bucket privado: apenas o admin acessa diretamente (upload/gestão). Os
-- professores nunca leem este bucket pelo cliente — apenas via URL assinada
-- criada por Server Action com a service role key.
create policy "private_bucket_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'private' and public.is_admin())
  with check (bucket_id = 'private' and public.is_admin());
