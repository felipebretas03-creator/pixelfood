# 🍔 Escopo Completo e Consolidado: PixelFood SaaS

O **PixelFood** evoluiu para uma plataforma SaaS (Software as a Service) Multi-tenant robusta. O sistema atende três pontas essenciais: **O Cliente Final** (que compra comida), **O Lojista** (que gerencia o restaurante) e o **Administrador Master** (você, dono da plataforma).

Abaixo está o detalhamento completo de absolutamente **todas as telas, fluxos e regras de negócio** desenvolvidas e implementadas no sistema.

---

## 📱 1. Aplicativo do Cliente (Frontend Consumidor)
*Onde a mágica acontece. Interface otimizada para mobile, focada em conversão e velocidade (PWA-ready).*

### Telas e Fluxos:
- **Cardápio Digital (`/[slug]`)**:
  - Exibição do banner, logo, nome do restaurante e horário de funcionamento.
  - Alerta visual 🔴 "Fechado" se a loja estiver inativa no momento.
  - Divisão limpa por **Categorias** (ex: Lanches, Bebidas, Sobremesas) com âncoras automáticas de rolagem.
  - Produtos com imagem, descrição, preço e etiquetas promocionais.
- **Detalhes do Produto (Modal/Página)**:
  - Seleção de **Grupos de Opções** (ex: "Escolha seu ponto da carne", "Adicionais").
  - Regras de limite de seleção (Mínimo/Máximo), como obrigar a escolher 1 carne e permitir até 3 adicionais.
  - Botão flutuante para adicionar ao carrinho com cálculo de subtotal em tempo real.
- **Carrinho de Compras e Checkout**:
  - Resumo limpo dos itens adicionados e botão de remoção rápida.
  - **Identificação**: O cliente informa Nome, Telefone e Endereço (com busca de CEP ou taxas por bairro).
  - **Pagamento Integrado**: Integração com Mercado Pago (Pix copia e cola com QR Code instantâneo, Cartão de Crédito ou Pagamento na Entrega).
- **Acompanhamento Ao Vivo (Tracking)**:
  - Tela de status em tempo real via **Websockets**.
  - O cliente acompanha a barra de progresso: *Aguardando Pagamento ➔ Novo ➔ Preparando ➔ Saiu para Entrega ➔ Concluído*.

---

## 🏪 2. Painel do Lojista (Gestão do Restaurante)
*Área restrita de cada restaurante. O lojista só enxerga os dados dele, isolados por `tenantId`.*

### Telas e Fluxos:
- **Autenticação e Onboarding**:
  - **Login (`/login`)**: Autenticação segura via E-mail e Senha. Suporte a recuperação de senha via token no email.
  - **Completar Cadastro**: Após a criação pelo Master, o lojista preenche sua senha pessoal.
- **Dashboard Principal**:
  - Métricas de faturamento do dia, quantidade de pedidos e ticket médio.
  - Botão de Pânico/Controle: Ligar/Desligar a loja com um clique.
- **Gestão de Pedidos (Ao Vivo e Kanban)**:
  - Kanban dinâmico com colunas: **Novos**, **Em Preparo**, **Despachados** e **Entregues**.
  - Notificação sonora (`beep`) e visual sempre que um pedido novo cai.
  - Detalhes completos do pedido, impressão térmica de via e mudança de status em 1 clique.
- **Cardápio e Categorias (`/cardapio`)**:
  - Cadastro de Produtos (Nome, Imagem com upload para AWS S3/CDN, Preço, Descrição).
  - Criação de Categorias e ordenação.
  - Gestão de Opções e Adicionais complexos.
- **Marketing e Fidelidade (`/marketing`)**:
  - Criação de **Cupons de Desconto** (Fixo ou Porcentagem) com regras de limite de uso e validade.
  - **Programa de Fidelidade (Cashback)**: Configuração de % de retorno para incentivar o cliente a voltar.
- **Base de Clientes (`/clientes`)**:
  - CRM embutido. Lista de clientes que já compraram no restaurante, com histórico de pedidos e total gasto.
- **Configurações Gerais (`/configuracoes`)**:
  - **Perfil**: Logo, Banner, Nome, CNPJ, Telefone e Cores do Tema.
  - **Taxas de Entrega**: Cobrança fixa ou cadastro de valores diferenciados por bairros.
  - **Pagamentos**: Inserção das chaves do Mercado Pago (Segurança Criptografada) para receber direto na conta.
  - **Assinatura**: Gestão da assinatura SaaS (visualização da fatura atual e status de bloqueio via Asaas).

---

## 👑 3. Acesso Master (SaaS Admin)
*O cérebro da operação. Painel exclusivo do dono da plataforma para gerenciar todos os clientes (restaurantes).*

### Telas e Fluxos:
- **Dashboard Master**:
  - Visão geral da plataforma: Quantidade total de lojas, lojas ativas e MRR (Receita Recorrente Mensal estimada).
- **Gestão de Lojas (`/master/lojas`)**:
  - Lista completa de todos os restaurantes cadastrados na plataforma.
  - Botão para criar uma nova loja (dispara o email de Onboarding para o lojista).
- **Detalhes da Loja (`/master/lojas/[id]`)**:
  - **Visão Geral**: Dados técnicos, CNPJ, data de entrada e URL direta.
  - **Controles Supremos**:
    - 🔴 **Suspender/Reativar**: Bloqueia o acesso do lojista ao painel instantaneamente por inadimplência ou infração.
    - 🚫 **Cancelar Assinatura**: Interrompe cobranças recorrentes no Asaas.
    - ⭐ **Tornar Vitalício**: Libera a loja do sistema de cobrança. Pode ser definido por um **número X de dias** ou **Para sempre**. A aba de assinatura exibirá um contador de dias vermelho/elegante.
    - 🔒 **Revogar Vitalício**: Botão de reversão caso o restaurante precise voltar a ser cobrado.
    - 👤 **Entrar como Loja (Impersonation)**: O Master entra no painel do restaurante exatamente como o lojista veria, sem precisar da senha dele, para dar suporte avançado.
    - 💵 **Assinatura Manual**: Atribuição de um plano "por fora" da esteira do Asaas para lojas que não possuem assinatura registrada.
- **Aba de Atividades (Nova!)**:
  - **Logs (Esquerda)**: Histórico de auditoria em tempo real, informando quando a loja teve o plano alterado, acessos administrativos e metadados JSON formatados de forma humana e legível.
  - **Últimos Pedidos (Direita)**: Monitoramento ao vivo dos últimos clientes que compraram na loja, com valores e status.
- **Comunicados Globais (`/master/comunicados`)**:
  - Editor de texto rico para enviar notificações e e-mails em massa para todos os lojistas da plataforma.
- **Auditoria (`/master/auditoria`)**:
  - Log geral e inflexível de segurança registrando tudo o que a conta Master faz (quem suspendeu quem, quando e qual foi o motivo).

---

## ⚙️ 4. Arquitetura, API e Segurança Backend

- **Multitenancy Absoluto**:
  - Uma única API e Banco de Dados atendendo milhares de lojas sem mistura de informações. Cada query possui cláusula obrigatória de `where: { tenantId }`.
- **Prevenção de Fraudes e IDOR**:
  - Todo preço e carrinho é recalculado pelo servidor (Server-Side Calculation). O cliente não pode "injetar" valores falsos no frontend.
  - Snapshots de Preço: Pedidos antigos mantêm o valor histórico, mesmo que o lojista mude o valor do cardápio hoje.
- **Sistema de Pagamentos Duplo**:
  - **Para a Plataforma (Asaas)**: Cobrança recorrente dos lojistas via Webhooks automáticos que bloqueiam o painel em caso de calote.
  - **Para os Lojistas (Mercado Pago)**: Dinheiro caindo direto na conta deles via chaves guardadas com criptografia de banco (AES-256-GCM). Pagamento via Pix com validação de Webhook e atualização em tempo real para a cozinha.
- **Background Workers e Escalabilidade**:
  - E-mails são enfileirados de forma assíncrona para não travar a API.
  - A API em Node.js / Prisma foi projetada para lidar com requisições intensas de catálogos JSON.
- **UI/UX Premium (Frontend)**:
  - Desenvolvido em React + Next.js com Tailwind CSS. 
  - Todos os alertas padrão do navegador (feios) foram extirpados. O sistema utiliza modais centralizados, elegantes e modernos com animações e efeitos glassmorphism (desfoque de fundo) para 100% dos feedbacks de erro, avisos e confirmações destrutivas.

---

> **Resumo:** O projeto PixelFood está completo e consolidado como um **Micro-SaaS Profissional**. De um simples catálogo local, tornou-se uma máquina de multi-restaurantes com faturamento segregado, ferramentas de marketing, rastreamento ao vivo, segurança bancária e um painel de administração nível Enterprise.
