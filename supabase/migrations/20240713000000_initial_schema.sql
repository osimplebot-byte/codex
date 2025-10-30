-- Enable extensions required for UUID generation
create extension if not exists "pgcrypto";

-- Companies store the core business profile for each authenticated owner
create table if not exists public.companies (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    segment text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists companies_owner_id_idx on public.companies(owner_id);

-- Voice profile settings describe how the AI should communicate for a given company
create table if not exists public.voice_profiles (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    tone text not null default 'friendly',
    description text,
    language text default 'pt-BR',
    persona jsonb default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint voice_profiles_company_unique unique(company_id)
);

create index if not exists voice_profiles_company_id_idx on public.voice_profiles(company_id);

-- Business hours define when the company is available
create table if not exists public.business_hours (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    weekday int2 not null check (weekday between 0 and 6),
    opens_at time not null,
    closes_at time not null,
    is_closed boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint business_hours_company_weekday_unique unique(company_id, weekday)
);

create index if not exists business_hours_company_id_idx on public.business_hours(company_id);

-- Catalog items list the services or products sold by the company
create table if not exists public.catalog_items (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    title text not null,
    description text,
    price numeric(12,2),
    currency text default 'BRL',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_items_company_id_idx on public.catalog_items(company_id);

-- Frequently asked questions tailored per company
create table if not exists public.faqs (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    question text not null,
    answer text not null,
    tags text[] default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists faqs_company_id_idx on public.faqs(company_id);

-- Chat sessions represent simulator or production conversations per company
create table if not exists public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    channel text not null default 'simulator',
    started_at timestamptz not null default timezone('utc', now()),
    ended_at timestamptz,
    metadata jsonb default '{}'::jsonb
);

create index if not exists chat_sessions_company_id_idx on public.chat_sessions(company_id);

-- Messages exchanged within each chat session
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
    company_id uuid not null references public.companies(id) on delete cascade,
    sender_type text not null check (sender_type in ('customer', 'ai', 'agent')),
    body text not null,
    created_at timestamptz not null default timezone('utc', now()),
    metadata jsonb default '{}'::jsonb
);

create index if not exists messages_chat_session_id_idx on public.messages(chat_session_id);
create index if not exists messages_company_id_idx on public.messages(company_id);

-- Maintain timestamps automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create trigger set_timestamp_companies
before update on public.companies
for each row
execute function public.set_updated_at();

create trigger set_timestamp_voice_profiles
before update on public.voice_profiles
for each row
execute function public.set_updated_at();

create trigger set_timestamp_business_hours
before update on public.business_hours
for each row
execute function public.set_updated_at();

create trigger set_timestamp_catalog_items
before update on public.catalog_items
for each row
execute function public.set_updated_at();

create trigger set_timestamp_faqs
before update on public.faqs
for each row
execute function public.set_updated_at();

-- Row Level Security policies (RLS)
alter table public.companies enable row level security;
alter table public.voice_profiles enable row level security;
alter table public.business_hours enable row level security;
alter table public.catalog_items enable row level security;
alter table public.faqs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;

-- Helper policy predicate for ownership checks
create or replace function public.company_is_owned_by_current_user(company_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.companies c
    where c.id = company_id
      and c.owner_id = auth.uid()
  );
$$;

-- Companies policies
create policy companies_owner_select
  on public.companies
  for select using (owner_id = auth.uid());

create policy companies_owner_modify
  on public.companies
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Voice profiles policies
create policy voice_profiles_owner_select
  on public.voice_profiles
  for select using (public.company_is_owned_by_current_user(company_id));

create policy voice_profiles_owner_modify
  on public.voice_profiles
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- Business hours policies
create policy business_hours_owner_select
  on public.business_hours
  for select using (public.company_is_owned_by_current_user(company_id));

create policy business_hours_owner_modify
  on public.business_hours
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- Catalog items policies
create policy catalog_items_owner_select
  on public.catalog_items
  for select using (public.company_is_owned_by_current_user(company_id));

create policy catalog_items_owner_modify
  on public.catalog_items
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- FAQs policies
create policy faqs_owner_select
  on public.faqs
  for select using (public.company_is_owned_by_current_user(company_id));

create policy faqs_owner_modify
  on public.faqs
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- Chat sessions policies
create policy chat_sessions_owner_select
  on public.chat_sessions
  for select using (public.company_is_owned_by_current_user(company_id));

create policy chat_sessions_owner_modify
  on public.chat_sessions
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- Messages policies
create policy messages_owner_select
  on public.messages
  for select using (public.company_is_owned_by_current_user(company_id));

create policy messages_owner_modify
  on public.messages
  for all
  using (public.company_is_owned_by_current_user(company_id))
  with check (public.company_is_owned_by_current_user(company_id));

-- Dashboard views for aggregated insights
create or replace view public.dashboard_company_summary
with (security_invoker = on)
as
select
  c.id as company_id,
  c.name,
  c.segment,
  c.created_at,
  coalesce(vp.tone, 'friendly') as tone,
  count(distinct bh.id) as total_business_days,
  count(distinct ci.id) as total_catalog_items,
  count(distinct fq.id) as total_faqs,
  count(distinct cs.id) filter (where cs.ended_at is null) as active_chat_sessions,
  count(distinct cs.id) as total_chat_sessions,
  count(msg.id) as total_messages
from public.companies c
left join public.voice_profiles vp on vp.company_id = c.id
left join public.business_hours bh on bh.company_id = c.id and bh.is_closed = false
left join public.catalog_items ci on ci.company_id = c.id
left join public.faqs fq on fq.company_id = c.id
left join public.chat_sessions cs on cs.company_id = c.id
left join public.messages msg on msg.company_id = c.id
group by c.id, vp.tone;

create or replace view public.dashboard_recent_messages
with (security_invoker = on)
as
select
  msg.id,
  msg.company_id,
  msg.chat_session_id,
  msg.sender_type,
  msg.body,
  msg.created_at
from public.messages msg
order by msg.created_at desc
limit 100;

-- RPC helper to fetch a single company's dashboard snapshot for the current user
create or replace function public.get_company_dashboard_snapshot(target_company_id uuid)
returns table (
  company_id uuid,
  name text,
  segment text,
  tone text,
  total_business_days bigint,
  total_catalog_items bigint,
  total_faqs bigint,
  active_chat_sessions bigint,
  total_chat_sessions bigint,
  total_messages bigint
)
language sql
security invoker
stable
as $$
  select
    dcs.company_id,
    dcs.name,
    dcs.segment,
    dcs.tone,
    dcs.total_business_days,
    dcs.total_catalog_items,
    dcs.total_faqs,
    dcs.active_chat_sessions,
    dcs.total_chat_sessions,
    dcs.total_messages
  from public.dashboard_company_summary dcs
  where dcs.company_id = target_company_id
    and exists (
      select 1
      from public.companies c
      where c.id = target_company_id
        and c.owner_id = auth.uid()
    );
$$;

-- Ensure views respect RLS by depending on base tables; no extra policies required.
