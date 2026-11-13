-- Reuben Susanto Tutoring: security hardening.
--
--   rate_limits      durable request counters shared by every API instance
--   security_events  blocked or suspicious chat activity, for review
--   hit_rate_limit() atomic "count this request, is it allowed?" call
--
-- Also: explicit REVOKEs on top of row level security, so the public
-- (anon) key can do nothing even if a policy is added by mistake later,
-- and length limits on enquiries as a last line of defence.

-- ---------------------------------------------------------------------
-- rate_limits
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;

-- Fixed-window counter. Returns whether this request is within `p_max`
-- requests per `p_window_seconds` for `p_key`.
create or replace function public.hit_rate_limit(
  p_key            text,
  p_window_seconds integer,
  p_max            integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
set search_path = public
as $$
declare
  v_start   timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count   integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_start, 1)
  on conflict (key, window_start)
  do update set count = r.count + 1
  returning r.count into v_count;

  -- Occasionally clear out old windows so the table stays small.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return query select
    v_count <= p_max,
    greatest(p_max - v_count, 0),
    case when v_count <= p_max then 0
         else greatest(1, (extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now())))::integer)
    end;
end;
$$;

-- ---------------------------------------------------------------------
-- security_events
-- ---------------------------------------------------------------------
create table if not exists public.security_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  category    text not null,                 -- e.g. blocked_injection, forged_history
  ip_hash     text not null,                 -- salted hash, never the address itself
  excerpt     text not null default '' check (char_length(excerpt) <= 200),
  detail      jsonb not null default '{}'::jsonb
);

create index if not exists security_events_created_at_idx on public.security_events (created_at desc);
create index if not exists security_events_category_idx on public.security_events (category);

alter table public.security_events enable row level security;

-- ---------------------------------------------------------------------
-- Hard limits on stored enquiry fields (the API validates first).
-- ---------------------------------------------------------------------
alter table public.enquiries
  drop constraint if exists enquiries_lengths,
  add constraint enquiries_lengths check (
    char_length(name) <= 100
    and char_length(subject) <= 60
    and char_length(level) <= 60
    and char_length(phone) <= 24
    and (email is null or char_length(email) <= 120)
    and (message is null or char_length(message) <= 2000)
  );

-- ---------------------------------------------------------------------
-- Nothing in this schema is for the public API keys. Only the backend's
-- service role may touch it.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
