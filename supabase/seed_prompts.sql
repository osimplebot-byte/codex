insert into public.standard_prompts (business_id, prompt_type, locale, content, version)
values
    (
        '00000000-0000-0000-0000-000000000001',
        'brand_voice',
        'pt-BR',
        jsonb_build_object(
            'persona', 'Atendente virtual cordial, acolhedor e objetivo',
            'tone', 'Amigável, com emojis moderados, foco em clareza',
            'greeting', 'Olá! Eu sou o assistente virtual da {{business_name}}. Como posso ajudar hoje?',
            'signature', 'Equipe {{business_name}}'
        ),
        1
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'catalog',
        'pt-BR',
        jsonb_build_object(
            'categories', jsonb_build_array(
                jsonb_build_object(
                    'name', 'Serviços Principais',
                    'items', jsonb_build_array(
                        jsonb_build_object('name', 'Plano Básico', 'description', 'Atendimento via WhatsApp com respostas padrão', 'price', 'R$ 99/mês'),
                        jsonb_build_object('name', 'Plano Profissional', 'description', 'Inclui automações personalizadas e relatórios semanais', 'price', 'R$ 199/mês')
                    )
                ),
                jsonb_build_object(
                    'name', 'Adicionais',
                    'items', jsonb_build_array(
                        jsonb_build_object('name', 'Integração com CRM', 'description', 'Sincronize contatos automaticamente com seu CRM favorito', 'price', 'R$ 49/mês'),
                        jsonb_build_object('name', 'Treinamento Personalizado', 'description', 'Sessão individual de 1h para otimização do bot', 'price', 'R$ 149/único')
                    )
                )
            ),
            'out_of_stock_message', 'No momento não temos itens adicionais. Posso ajudar com outra dúvida?'
        ),
        1
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'faqs',
        'pt-BR',
        jsonb_build_object(
            'items', jsonb_build_array(
                jsonb_build_object(
                    'question', 'Quais formas de pagamento vocês aceitam?',
                    'answer', 'Aceitamos cartões de crédito, PIX e boleto bancário.'
                ),
                jsonb_build_object(
                    'question', 'Qual o prazo para ativação do atendente virtual?',
                    'answer', 'Assim que você concluir o cadastro e conectar o WhatsApp Business, o robô fica disponível em até 10 minutos.'
                ),
                jsonb_build_object(
                    'question', 'O suporte humano está disponível?',
                    'answer', 'Sim! Nosso time acompanha a IA e pode assumir a conversa quando necessário, de segunda a sábado, das 8h às 20h.'
                )
            )
        ),
        1
    )
on conflict do nothing;
