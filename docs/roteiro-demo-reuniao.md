# Roteiro de Demonstração do Fonolife (7 a 10 min)

Este guia prático foi desenhado para apresentações online onde você compartilha sua tela. O ambiente sobe em segundos usando Docker e dados sintéticos, pronto para impressionar.

## Preparação
- Execute `npm run demo:up` (ou `docker compose up --build --wait`).
- Acesse `http://localhost:3000`.

## Minuto 0-1: Abertura e Acesso Expresso
- Apresente a tela de login. Destaque que não precisa digitar senhas.
- Explique o conceito de isolamento de perfil (cada papel enxerga uma versão simplificada do painel).
- **Ação:** Clique em **Entrar como Administrador**.

## Minuto 2-3: Visão Executiva (Dashboard)
- Na tela Início, passe pelos **Indicadores Principais** (KPIs de vendas, inadimplência e consultas).
- Destaque o calendário mensal integrado direto no painel, mostrando a ocupação orgânica (os dados sintéticos sempre preenchem o mês atual).
- **Ação:** Mostre a estabilidade: clique em dias diferentes do calendário do dashboard para ver a lista lateral atualizar instantaneamente.

## Minuto 4-5: A Área Clínica e Agenda
- **Ação:** Navegue para a aba **Agenda**.
- Mostre a distinção de status das pílulas (Cancelado riscado, Confirmado, Agendado).
- Clique em *Novo Agendamento*. Mostre a interface simples da modal, sem dezenas de campos confusos.
- Salve um atendimento teste.

## Minuto 6-7: Gestão do Paciente (CRM Médico)
- **Ação:** Navegue até **Pacientes** e abra o Prontuário de um paciente (selecione o *Paciente QA* se existir, ou qualquer um da lista).
- Destaque o fluxo de vida real: Alertas clínicos, anotações de evolução e ações rápidas (WhatsApp/Telefone).
- Isso mostra como a ferramenta não é apenas administrativa, mas o braço direito do clínico.

## Minuto 8-10: Venda e Financeiro Integrado
- **Ação:** No prontuário ainda, inicie uma **Nova Venda/Serviço**. 
- Venda um *Aparelho* ou *Sessão*. 
- **Ação:** Vá à guia **Financeiro**.
- Mostre como aquela venda realizada há 10 segundos já consta no controle de caixa, eliminando re-trabalho ou planilhas desconexas.
- Finalize com a ideia de *"Tudo no mesmo lugar, rodando em qualquer dispositivo"* (se possível, redimensione a aba do navegador para provar o layout responsivo).
