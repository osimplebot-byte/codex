-- Schema for storing standard prompts, FAQ cache, and session usage metrics
create table if not exists public.standard_prompts (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null,
    prompt_type text not null check (prompt_type in ('brand_voice', 'catalog', 'faqs')),
    locale text not null default 'pt-BR',
    content jsonb not null,
    version int not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint standard_prompts_business_type_unique unique (business_id, prompt_type, locale, version)
);

create index if not exists standard_prompts_business_idx on public.standard_prompts (business_id, prompt_type, locale);

create table if not exists public.response_cache (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null,
    locale text not null default 'pt-BR',
    question_hash text not null,
    question text not null,
    answer text not null,
    metadata jsonb default '{}'::jsonb,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    constraint response_cache_business_hash_unique unique (business_id, locale, question_hash)
);

create index if not exists response_cache_business_idx on public.response_cache (business_id, locale);
create index if not exists response_cache_expires_idx on public.response_cache (expires_at);

create table if not exists public.session_usage (
    id uuid primary key default gen_random_uuid(),
    session_id text not null,
    business_id uuid not null,
    model text not null,
    prompt_tokens int not null default 0,
    completion_tokens int not null default 0,
    total_tokens int generated always as (prompt_tokens + completion_tokens) stored,
    cost_usd numeric(10,4) not null default 0,
    currency text not null default 'USD',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint session_usage_unique unique (session_id, created_at)
);

create index if not exists session_usage_business_idx on public.session_usage (business_id, created_at desc);
