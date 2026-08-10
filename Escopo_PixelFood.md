# Escopo de Desenvolvimento: PixelFood SaaS
**Data:** Agosto de 2026
**Projeto:** PixelFood - Plataforma de Cardápio Digital (SaaS)

---

## 1. Visão Geral do Sistema
O PixelFood é uma plataforma SaaS (Software as a Service) voltada para restaurantes, lanchonetes e deliverys. O sistema permite que cada lojista crie seu cardápio digital exclusivo, receba pedidos (inclusive integrados via WhatsApp) e gerencie suas vendas, enquanto o dono da plataforma (Master) gerencia as assinaturas e a base de clientes.

## 2. O que foi implementado e configurado

### 2.1. Arquitetura Base
- **Backend:** Node.js com Express e TypeScript.
- **Banco de Dados:** PostgreSQL hospedado no Supabase, utilizando Prisma ORM para modelagem de dados.
- **Frontend (Painel Lojista):** Next.js (React) com Tailwind CSS e componentes da biblioteca Lucide.
- **Frontend (Cardápio Cliente Final):** Next.js focado em performance (SEO, Mobile-first) para os consumidores dos restaurantes.

### 2.2. Integração de Pagamentos e Assinaturas (Asaas)
Toda a estrutura de cobrança foi arquitetada para funcionar de forma 100% automatizada (Funil SaaS) via Asaas.
- **Cobrança Recorrente:** Suporte para planos "Mensal" e "Anual".
- **Webhook de Pagamento (`/api/webhooks/asaas`):**
  - **Identificação Automática:** Quando um pagamento é aprovado no Asaas, o sistema identifica o cliente.
  - **Onboarding Automático:** Se o cliente comprou diretamente pela Landing Page e ainda não tem conta, o backend captura os dados via API do Asaas e cria a conta do restaurante de forma automática no banco de dados.
  - **Renovação Automática:** Se a conta já existe, o webhook adiciona +30 dias (Mensal) ou +365 dias (Anual) de acesso e renova o status.

### 2.3. Sistema de E-mails Automatizados (Resend)
Implementação de um motor de e-mails usando a API do Resend, com suporte a templates HTML modernos.
- **E-mail de Setup (Boas-Vindas):** Quando a conta é criada no automático via Webhook, o lojista recebe um e-mail com um link seguro (Token JWT) para acessar o painel e cadastrar sua própria senha (`/completar-cadastro`).
- **E-mail de Pagamento Aprovado:** E-mail de recibo/confirmação sempre que a assinatura é renovada.
- **E-mail de Broadcast (Comunicados):** Funcionalidade para o Administrador Master disparar mensagens em massa.

### 2.4. Painel Administrador Master
Área restrita e privilegiada para gestão completa da plataforma SaaS.
- **Métricas Globais:** Visualização de total de usuários, novos usuários, inadimplentes, trial e faturamento global.
- **Gestão de Lojistas:** Listagem de todos os restaurantes, possibilidade de bloquear/desbloquear acesso.
- **Disparo de Comunicados:** Botão "Enviar Comunicado" que permite escrever um Assunto e Mensagem e disparar via Resend para todos os lojistas ativos da plataforma.

### 2.5. Painel do Lojista (Tenant)
- **Criação Segura de Senha (`/completar-cadastro`):** Tela dedicada e segura para lojistas oriundos da Landing Page definirem sua senha antes do primeiro acesso ao dashboard.
- **Gestão de Cardápio e Pedidos:** Estrutura baseada em Next.js para gerenciamento de itens, categorias e recebimento de pedidos.

---

## 3. Fluxo de Vendas (Onboarding Zero-Touch)
1. **Atração:** Cliente entra na Landing Page do PixelFood.
2. **Conversão:** Cliente clica em "Assinar Plano", é levado ao checkout do Asaas e realiza o pagamento.
3. **Provisionamento:** Asaas notifica o backend do PixelFood. O backend cria a infraestrutura do restaurante (Banco de Dados).
4. **Ativação:** Cliente recebe um e-mail com o link mágico. Ele clica, cadastra a senha e o cardápio já está pronto para uso!
