# Runbook de Produção (PixelFood MVP)

Este runbook contém os procedimentos padrões de operação, deploy e troubleshooting para a aplicação PixelFood.

## 1. Variáveis de Ambiente Críticas
Certifique-se de que o ambiente de produção possua todas estas variáveis devidamente configuradas:
```env
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/pixelfood?schema=public"
JWT_SECRET="seu-jwt-secret-super-seguro"
PAYMENT_CREDENTIALS_ENCRYPTION_KEY="sua-chave-base64-de-32-bytes"
ASAAS_ACCESS_TOKEN="seu-token-asaas"
ASAAS_WEBHOOK_SECRET="seu-segredo-webhook-asaas"

# Frontend e Painel (.env)
NEXT_PUBLIC_API_URL="https://api.pixelfood.com.br"
```

## 2. Processo de Deploy

### Backend (Node.js/Express)
Se estiver utilizando Vercel para Node puro (Serverless), o `vercel.json` deve apontar os rewrites.
Se estiver utilizando Render / Railway:
1. Conecte o repositório.
2. Defina o Root Directory como `backend`.
3. Defina o Build Command: `npm install && npx prisma generate && npm run build`
4. Defina o Start Command: `npm run start`

> [!WARNING]
> Nunca se esqueça de rodar as migrations em produção utilizando `npx prisma migrate deploy` durante o build ou via console antes do deploy.

### Frontend & Painel (Next.js na Vercel)
1. Crie dois projetos na Vercel.
2. Projeto 1 (Painel): Root Directory `painel`, Framework Preset `Next.js`.
3. Projeto 2 (Frontend): Root Directory `frontend`, Framework Preset `Next.js`.
4. Configure a variável `NEXT_PUBLIC_API_URL` em ambos.

## 3. Troubleshooting

### Erro P2002 (Prisma)
- **Sintoma:** Log indicando `Prisma P2002 Unique constraint failed`.
- **Causa:** O usuário tentou cadastrar um e-mail, telefone ou URL que já existe no banco de dados.
- **Solução:** Trata-se de um erro esperado em uso normal que já está sendo tratado pelo `errorHandler.ts`. Nenhuma ação é necessária, mas caso ocorra em lote, investigue por ataques de spam.

### Erro "Mercado Pago integration not configured"
- **Sintoma:** Consumidores não conseguem gerar o Pix ou Cartão na tela de checkout. O pedido morre na cozinha e não notifica o lojista.
- **Causa:** O Lojista configurou o botão para aceitar Pix/Cartão, mas o Access Token não foi preenchido corretamente ou a chave foi invalidada pelo Mercado Pago.
- **Solução:** Instruir o lojista a acessar o Painel -> Configurações, preencher as credenciais novamente e salvar.

## 4. Testes de Performance
Periodicamente, teste a escalabilidade utilizando o script configurado de Artillery:
```bash
npx artillery run scripts/load-test.yml
```
Monitore a latência P95. Se a latência ultrapassar 1000ms de forma consistente na Rota de Pedidos, considere escalar o banco de dados e as instâncias Node.js.

## 5. Integração Contínua (CI)
O repositório está configurado com **GitHub Actions** (`.github/workflows/main.yml`). Qualquer Pull Request ou Push na branch `main` executará os testes E2E do Playwright e construirá os três projetos. Só faça deploy para produção quando o Check da Action estiver "Verde".
