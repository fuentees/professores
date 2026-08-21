-- Proteção anti-spam aplicada no banco, portanto vale para Server Actions,
-- chamadas REST e qualquer cliente futuro. Admins não são limitados.

create or replace function public.enforce_forum_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_write timestamptz;
  recent_writes integer;
  maximum_writes integer;
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'forum_topics' then
    select max(created_at), count(*)
      into latest_write, recent_writes
      from public.forum_topics
     where author_id = new.author_id
       and created_at >= now() - interval '10 minutes';
    maximum_writes := 3;
  else
    select max(created_at), count(*)
      into latest_write, recent_writes
      from public.forum_replies
     where author_id = new.author_id
       and created_at >= now() - interval '10 minutes';
    maximum_writes := 20;
  end if;

  if latest_write is not null and latest_write > now() - interval '15 seconds' then
    raise exception 'Aguarde alguns segundos antes de publicar novamente.' using errcode = 'P0001';
  end if;

  if recent_writes >= maximum_writes then
    raise exception 'Limite temporário de publicações atingido. Tente novamente em alguns minutos.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_forum_write_rate_limit() from public;

drop trigger if exists forum_topics_rate_limit on public.forum_topics;
create trigger forum_topics_rate_limit
  before insert on public.forum_topics
  for each row execute function public.enforce_forum_write_rate_limit();

drop trigger if exists forum_replies_rate_limit on public.forum_replies;
create trigger forum_replies_rate_limit
  before insert on public.forum_replies
  for each row execute function public.enforce_forum_write_rate_limit();
