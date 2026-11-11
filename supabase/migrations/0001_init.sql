-- Reuben Susanto Tutoring: initial schema.
--
--   documents      knowledge chunks + embeddings for the chat assistant (RAG)
--   enquiries      contact-form submissions
--   chat_messages  optional chat log (only written when CHAT_LOGGING=true)
--
-- Every table has row level security enabled and no policies, so the
-- public (anon) key cannot read or write anything. Only the backend,
-- which uses the service-role key on the server, can access them.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,                 -- e.g. "tutoring/rates.md"
  chunk_index   integer not null,
  content       text not null,
  metadata      jsonb not null default '{}'::jsonb,
  content_hash  text not null unique,          -- lets ingest skip unchanged chunks
  embedding     extensions.vector(768) not null,
  created_at    timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on public.documents using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists documents_source_idx on public.documents (source);

alter table public.documents enable row level security;

-- Cosine-similarity search used by backend/src/rag/retriever.py.
create or replace function public.match_documents(
  query_embedding extensions.vector(768),
  match_count     integer default 6,
  min_similarity  double precision default 0
)
returns table (
  id          uuid,
  source      text,
  content     text,
  metadata    jsonb,
  similarity  double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select d.id,
         d.source,
         d.content,
         d.metadata,
         1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where 1 - (d.embedding <=> query_embedding) >= min_similarity
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_documents(extensions.vector, integer, double precision)
  from public, anon, authenticated;
grant execute on function public.match_documents(extensions.vector, integer, double precision)
  to service_role;

-- ---------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  role        text not null check (role in ('parent', 'student')),
  subject     text not null,
  level       text not null,
  phone       text not null,
  email       text,
  message     text,
  language    text not null default 'en' check (language in ('en', 'id')),
  email_sent  boolean not null default false
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

alter table public.enquiries enable row level security;

-- ---------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------
create table if not exists public.chat_messages (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  session_id       text not null,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  rewritten_query  text
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at);

alter table public.chat_messages enable row level security;
