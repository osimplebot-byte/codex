-- OMR Studio MVP schema
create extension if not exists pgcrypto;
create extension if not exists moddatetime schema extensions;

create table if not exists public.usuarios (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password_hash text,
    created_at timestamptz not null default now()
);

create table if not exists public.empresas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.usuarios (id) on delete cascade,
    nome text not null,
    tipo text,
    horario_funcionamento text,
    contatos_extras text,
    endereco text,
    observacoes text,
    persona text not null default 'josi',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_empresas_updated
    before update on public.empresas
    for each row execute procedure moddatetime(updated_at);

create table if not exists public.produtos (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas (id) on delete cascade,
    nome text not null,
    descricao text,
    preco numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_produtos_updated
    before update on public.produtos
    for each row execute procedure moddatetime(updated_at);

create table if not exists public.faqs (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas (id) on delete cascade,
    pergunta text not null,
    resposta text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_faqs_updated
    before update on public.faqs
    for each row execute procedure moddatetime(updated_at);

create table if not exists public.instancias (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas (id) on delete cascade,
    evolution_instance_id text not null unique,
    status text not null default 'desconectado',
    settings jsonb not null default '{}',
    last_event jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_instancias_updated
    before update on public.instancias
    for each row execute procedure moddatetime(updated_at);

-- Row Level Security
alter table public.empresas enable row level security;
alter table public.produtos enable row level security;
alter table public.faqs enable row level security;
alter table public.instancias enable row level security;

create policy "Usuário acessa apenas sua empresa"
    on public.empresas
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Usuário acessa apenas seus produtos"
    on public.produtos
    using (
        exists(
            select 1 from public.empresas e
            where e.id = produtos.empresa_id and e.user_id = auth.uid()
        )
    )
    with check (
        exists(
            select 1 from public.empresas e
            where e.id = produtos.empresa_id and e.user_id = auth.uid()
        )
    );

create policy "Usuário acessa apenas suas FAQs"
    on public.faqs
    using (
        exists(
            select 1 from public.empresas e
            where e.id = faqs.empresa_id and e.user_id = auth.uid()
        )
    )
    with check (
        exists(
            select 1 from public.empresas e
            where e.id = faqs.empresa_id and e.user_id = auth.uid()
        )
    );

create policy "Usuário acessa apenas suas instâncias"
    on public.instancias
    using (
        exists(
            select 1 from public.empresas e
            where e.id = instancias.empresa_id and e.user_id = auth.uid()
        )
    )
    with check (
        exists(
            select 1 from public.empresas e
            where e.id = instancias.empresa_id and e.user_id = auth.uid()
        )
    );
