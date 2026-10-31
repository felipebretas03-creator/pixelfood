# Runbook de Produção (PixelFood / PixelEats SaaS)

Este documento contém os procedimentos operacionais para deploy em produção, configuração de variáveis de ambiente, webhooks e troubleshooting.

---

## 1. Arquitetura de Hospedagem

```
                      +-----------------------------+
                      |   Cloudflare / DNS Geral    |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+-----------------------+                             +--------------------+
|  Vercel (Frontends)   |                             | Railway / Render   |
+-----------------------+                             +--------------------+
| - site-pixeleats (LP) |                             | - Backend Express  |
| - painel (Lojistas)   |                             | - Socket.IO        |
| - frontend (Cardápios)|                             | - Background Cron  |
+-----------------------+                             +---------+----------+
                                                                |
                                             +------------------+------------------+
                                             |                  |                  |
                                             v                  v                  v
                                        +---------+        +---------+        +---------+
                                        |Supabase |        |  Asaas  |        | Resend  |
                                        |(Postgres|        |(SaaS Sub|        |(Emails) |
                                        +---------+        +---------+        +---------+
```

> [!IMPORTANT]
> O **Backend Express** precisa ser hospedado em um serviço com runtime contínuo (ex: **Railway**, **Render**, **Fly.io** ou **VPS**), pois utiliza conexões WebSocket persistentes (`Socket.IO`) e tarefas em segundo plano (`startTrialWorker` e `startEmailWorker`). Os três frontends devem ser hospedados na **Vercel**.

---

## 2. Variáveis de Ambiente de Produção

### A. Backend (`backend/.env`)
Configure no painel da Railway / Render:
```env
# Conexão com PostgreSQL / Supabase
DATABASE_URL="postgresql://postgres:[SENHA]@[HOST]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[SENHA]@[HOST]:5432/postgres"

# Servidor e Segurança
PORT=4000
NODE_ENV="production"
JWT_SECRET="gere-com: openssl rand -hex 32"
PAYMENT_CREDENTIALS_ENCRYPTION_KEY="gere-com: openssl rand -base64 32"
CORS_ORIGINS="https://pixeleats.com.br,https://painel.pixeleats.com.br"

# Gateway de Assinaturas (Asaas)
ASAAS_API_URL="https://api.asaas.com/v3"
ASAAS_API_KEY="$aact_sua_chave_producao_asaas"
ASAAS_WEBHOOK_SECRET="seu-token-autenticacao-webhook"

# E-mails Transacionais (Resend)
RESEND_API_KEY="re_sua_chave_producao"
EMAIL_FROM="PixelEats <nao-responda@pixeleats.com.br>"

# Feature Flags
FEATURE_ONLINE_PAYMENTS_ENABLED="true"
```

### B. Painel do Restaurante (`painel/.env`)
Configure na Vercel (Projeto `painel`):
```env
NEXT_PUBLIC_API_URL="https://api.pixeleats.com.br"
NEXT_PUBLIC_FRONTEND_URL="https://pixeleats.com.br"
```

### C. Cardápio do Consumidor (`frontend/.env.local`)
Configure na Vercel (Projeto `frontend`):
```env
NEXT_PUBLIC_API_URL="https://api.pixeleats.com.br"
NEXT_PUBLIC_RESTAURANT_SLUG=""
```

### D. Landing Page Institucional (`site-pixeleats/.env`)
Configure na Vercel (Projeto `site-pixeleats`):
```env
NEXT_PUBLIC_PAINEL_URL="https://painel.pixeleats.com.br"
```

---

## 3. Procedimento de Deploy

### Passo 1: Banco de Dados (Supabase / Postgres)
1. Crie o projeto no Supabase.
2. No seu terminal local ou na pipeline de CI:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### Passo 2: Backend (Railway ou Render)
1. Conecte o repositório GitHub.
2. Configure o **Root Directory** como `backend`.
3. Build Command: `npm install && npm run build` (o script já executa `prisma generate && tsc`).
4. Start Command: `npm run start`
5. Adicione todas as variáveis de ambiente listadas na Seção 2.A.
6. Configure o domínio personalizado (ex: `api.pixeleats.com.br`).

### Passo 3: Frontends (Vercel)
Crie três projetos separados na Vercel apontando para o mesmo repositório:

1. **Projeto 1: Cardápio do Consumidor**
   - Root Directory: `frontend`
   - Framework Preset: `Next.js`
   - Variáveis: `NEXT_PUBLIC_API_URL`
   - Domínio: `pixeleats.com.br`

2. **Projeto 2: Painel do Lojista & Master**
   - Root Directory: `painel`
   - Framework Preset: `Next.js`
   - Variáveis: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`
   - Domínio: `painel.pixeleats.com.br`

3. **Projeto 3: Landing Page**
   - Root Directory: `site-pixeleats`
   - Framework Preset: `Next.js`
   - Variáveis: `NEXT_PUBLIC_PAINEL_URL`
   - Domínio: `institucional.pixeleats.com.br` (ou configure no domínio raiz com rewrites)

---

## 4. Configuração de Webhooks

### A. Webhook do Asaas (Assinaturas SaaS)
1. Acesse o painel do Asaas: **Configurações da Conta** -> **Integrações** -> **Webhooks**.
2. URL do Webhook: `https://api.pixeleats.com.br/api/webhooks/asaas`
3. Eventos selecionados:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_DELETED`
   - `PAYMENT_REFUNDED`

### B. Webhook do Mercado Pago (Pedidos dos Clientes)
A URL do Webhook é gerada dinamicamente pelo backend com o ID do restaurante:
`https://api.pixeleats.com.br/api/webhooks/mercadopago/:tenantId`

---

## 5. Troubleshooting Comum

| Problema | Causa | Solução |
| :--- | :--- | :--- |
| **CORS blocked** | O domínio do frontend não está listado | Adicionar o domínio na variável `CORS_ORIGINS` do backend |
| **WebSocket desconectando** | Backend hospedado em serverless | Migrar o backend para Railway/Render com container contínuo |
| **Pix não gera no cardápio** | Lojista não preencheu o Access Token | O lojista deve ir em Configurações no Painel e salvar suas chaves do Mercado Pago |
| **Trial expirado não bloqueia** | Worker não rodou | O `trialWorker` roda a cada hora no backend. Verifique os logs do backend para `[TrialWorker]` |
| **E-mails caindo em spam** | Domínio não autenticado no Resend | Configurar registros SPF, DKIM e DMARC no DNS do domínio no painel da Resend |
