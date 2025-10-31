-- Schema base para OMR Studio
create extension if not exists "uuid-ossp";

create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  senha_hash text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists personas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  estilo text not null default 'informal',
  prompt_base text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists empresas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references usuarios(id) on delete cascade,
  nome text not null,
  descricao text,
  whatsapp text,
  website text,
  horario_funcionamento text,
  persona_id uuid references personas(id),
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists produtos (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  titulo text not null,
  descricao text,
  preco numeric,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists faqs (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  pergunta text not null,
  resposta text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists instancias (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  status text not null default 'desconectado',
  numero text,
  qr_code text,
  connected_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create view if not exists empresa_detalhada as
select e.*, 
  coalesce(json_agg(distinct p) filter (where p.id is not null), '[]'::json) as produtos,
  coalesce(json_agg(distinct f) filter (where f.id is not null), '[]'::json) as faqs
from empresas e
left join produtos p on p.empresa_id = e.id
left join faqs f on f.empresa_id = e.id
group by e.id;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on usuarios
for each row execute procedure public.set_updated_at();

create trigger set_timestamp_empresas
before update on empresas
for each row execute procedure public.set_updated_at();

create trigger set_timestamp_produtos
before update on produtos
for each row execute procedure public.set_updated_at();

create trigger set_timestamp_faqs
before update on faqs
for each row execute procedure public.set_updated_at();

create trigger set_timestamp_instancias
before update on instancias
for each row execute procedure public.set_updated_at();
