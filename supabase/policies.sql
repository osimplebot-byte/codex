alter table usuarios enable row level security;
alter table empresas enable row level security;
alter table produtos enable row level security;
alter table faqs enable row level security;
alter table instancias enable row level security;

create policy "Usuário visualiza apenas seus dados" on empresas
for select using (auth.uid() = user_id);

create policy "Usuário altera apenas seus dados" on empresas
for all using (auth.uid() = user_id);

create policy "Produtos por empresa" on produtos
for all using (auth.uid() = (select user_id from empresas where empresas.id = produtos.empresa_id));

create policy "FAQs por empresa" on faqs
for all using (auth.uid() = (select user_id from empresas where empresas.id = faqs.empresa_id));

create policy "Instância por empresa" on instancias
for all using (auth.uid() = (select user_id from empresas where empresas.id = instancias.empresa_id));
