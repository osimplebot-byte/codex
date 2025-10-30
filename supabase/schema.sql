-- Tabela principal de mensagens
create table if not exists public.whatsapp_messages (
    id uuid default gen_random_uuid() primary key,
    instance text not null,
    direction text not null check (direction in ('inbound', 'outbound')),
    whatsapp_message_id text,
    "from" text not null,
    "to" text not null,
    body text,
    type text,
    timestamp timestamptz default now(),
    raw_payload jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists whatsapp_messages_instance_idx on public.whatsapp_messages (instance);
create index if not exists whatsapp_messages_direction_idx on public.whatsapp_messages (direction);
create index if not exists whatsapp_messages_timestamp_idx on public.whatsapp_messages (timestamp);

-- Tabela de status de conexão consumida pelo painel
create table if not exists public.whatsapp_connection_status (
    instance text primary key,
    status text not null check (status in ('DISCONNECTED', 'CONNECTING', 'CONNECTED')),
    last_checked_at timestamptz not null default now(),
    last_connected_at timestamptz,
    attempting_reconnect boolean default false,
    metadata jsonb default '{}'::jsonb
);

-- Tabela para armazenar tokens e segredos (restrinja o acesso via RLS)
create table if not exists public.integration_settings (
    instance text primary key,
    evolution_instance_key text not null,
    evolution_token text not null,
    evolution_secret text,
    webhook_token text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.integration_settings
    enable row level security;

create policy "service-role-only"
    on public.integration_settings
    for all
    using (auth.role() = 'service_role');

-- Função para atualizar status
create or replace function public.update_connection_status(
    instance_name text,
    new_status text,
    attempting boolean default false
) returns void language plpgsql as $$
begin
    insert into public.whatsapp_connection_status as s (instance, status, last_checked_at, attempting_reconnect)
    values (instance_name, new_status, now(), attempting)
    on conflict (instance) do update
        set status = excluded.status,
            last_checked_at = now(),
            attempting_reconnect = excluded.attempting_reconnect,
            last_connected_at = case
                when excluded.status = 'CONNECTED' then now()
                else s.last_connected_at
            end;
end;
$$;
