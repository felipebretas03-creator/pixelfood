# Regras Globais de Desenvolvimento

Estas regras foram extraídas do Roteador de Decisões:

## Regras Gerais
- Sempre entregue o prompt pronto para utilização direta no Claude Code.
- Após analisar a solicitação, escolha automaticamente o modelo, o nível de esforço e a(s) skill(s) mais adequada(s).
- Informe o modelo recomendado.
- Informe o nível recomendado.
- Informe quais skills utilizar (ou que nenhuma é necessária).
- Cite explicitamente as skills dentro do prompt quando forem utilizadas.
- Sempre informe: Modelo recomendado. Nível de esforço recomendado. Skills recomendadas (ou informe que nenhuma skill é necessária).
- Todo prompt gerado deve estar pronto para ser utilizado diretamente no Claude Code.
- Sempre que alguma skill for necessária, cite o nome da skill dentro do próprio prompt, exatamente no momento em que ela deve ser utilizada.
- Além disso, informe separadamente quais skills deverão ser utilizadas.
- Seja sempre curto e direto. Responda apenas o necessário. Não explique suas escolhas, exceto quando eu solicitar. Após entregar o prompt, não escreva textos adicionais.
- Ative obrigatoriamente o Caveman em todos os prompts que eu solicitar. (Cite no prompt para ser obrigatório o claude ativar, se for necessário). Nunca esqueça dessa etapa.
- Todo comentário em código deve ser escrito em português.
- Sempre que possível, utilize nomes de arquivos, pastas, funções e variáveis em português, desde que isso não prejudique bibliotecas, frameworks, APIs ou padrões obrigatórios do projeto.
- Considere toda a documentação das skills presente neste documento como referência oficial para tomar decisões.
- Nunca escolha uma skill apenas porque ela é semelhante a outra. Sempre selecione a skill mais especializada para a tarefa. Caso duas ou mais skills se complementem, utilize todas as necessárias.
- Caso exista mais de uma abordagem válida, escolha automaticamente a que produzirá o melhor resultado, sem solicitar confirmação ao usuário, exceto quando faltar alguma informação essencial para executar a tarefa.
- Sempre priorize soluções simples, organizadas, escaláveis e de fácil manutenção. Evite complexidade desnecessária.
- Sempre gere código de qualidade de produção, seguindo boas práticas, priorizando desempenho, legibilidade, reutilização e facilidade de manutenção.

## Prioridade de decisão
1. Entender completamente a solicitação.
2. Identificar o tipo de projeto (Frontend, Interface, UX, Backend, etc.).
3. Escolher a(s) skill(s) mais especializada(s).
4. Escolher o modelo ideal.
5. Escolher o nível de esforço.
6. Construir o prompt final.
7. Responder de forma curta e objetiva.

## Regra obrigatória - Caveman
- A Skill Caveman é obrigatória em absolutamente todos os prompts, sem exceção.
- Sempre inclua a ativação da Skill Caveman dentro do prompt destinado ao Claude Code.
- Nunca omita, substitua ou desative a Skill Caveman.
- Considere a Skill Caveman como parte obrigatória do fluxo de trabalho, independentemente do tipo de projeto.
- Utilize a Skill Caveman para otimizar o consumo de contexto e reduzir a utilização de tokens durante toda a execução do projeto.

## Hospedagem
- Considere que todos os projetos serão hospedados na Vercel, salvo quando eu informar o contrário.
- Sempre priorize arquitetura, configuração, estrutura e otimizações voltadas para o melhor desempenho na Vercel.
- Sempre que existir mais de uma solução, prefira aquela que seja mais compatível e eficiente para a Vercel.

## Construção do prompt
- Todo prompt deve ser completo e pronto para utilização.
- Sempre cite, dentro do próprio prompt, todas as skills que deverão ser utilizadas.
- Posicione a ativação de cada skill no momento mais apropriado da execução do prompt.
- Nunca esqueça de incluir a Skill Caveman.

## Controle de utilização de skills
- Utilize exclusivamente as skills que forem explicitamente citadas no prompt.
- É proibido ativar, executar ou considerar qualquer outra skill instalada que não tenha sido mencionada pelo nome no prompt.
- Nunca utilize uma skill apenas porque ela foi acionada por palavras-chave, contexto, similaridade ou detecção automática.
- A ativação de qualquer skill deve ocorrer somente quando seu nome estiver explicitamente informado no prompt.
- Caso uma skill seja necessária e não tenha sido citada, interrompa a execução e informe que ela precisa ser adicionada ao prompt antes de prosseguir.
- Considere a lista de skills informadas no prompt como a única lista autorizada para execução.

---

# Regras Adicionais (CLAUDE_RULES)

Estas regras foram extraídas do arquivo `CLAUDE_RULES.rtf`:

## Regras obrigatórias
- Nunca utilize nenhuma skill que não esteja explicitamente autorizada no prompt.
- Utilize exclusivamente as skills informadas.
- A Skill Caveman é obrigatória durante toda a execução do projeto.
- Nunca desative a Skill Caveman.
- Caso alguma nova skill seja necessária, interrompa a execução e informe ao usuário.

## Código
- Todo comentário deve estar em português.
- Sempre explique funções complexas.
- Utilize nomes em português sempre que possível.
- Não altere nomes obrigatórios de frameworks.

## Arquitetura
- Priorize código limpo.
- Evite duplicação.
- Evite arquivos gigantes.
- Utilize componentes reutilizáveis.
- Mantenha organização consistente.

## Performance
- O projeto talvez será hospedado na Vercel. (Me pergunte para confirmar e priorizar desempenho para Vercel)
- Evite dependências desnecessárias.
- Priorize SSR, SSG ou ISR quando fizer sentido.
- Otimize imagens.
- Otimize bundle.
- Evite código morto.

## Segurança
- Nunca exponha chaves.
- Nunca coloque secrets no frontend.
- Utilize variáveis de ambiente.
- Faça validações.

## Git
- Nunca apagar arquivos sem necessidade.
- Nunca alterar funcionalidades que não fazem parte da tarefa.
- Preserve compatibilidade.

## UX
- Interfaces responsivas.
- Boa acessibilidade.
- Feedback visual.
- Loading.
- Estados de erro.

## Antes de finalizar qualquer tarefa
Sempre verifique: Build, TypeScript, ESLint, Imports, Performance, e Responsividade. Só então entregue a tarefa.

## Diretrizes de Execução
1. **Escopo da tarefa (muito importante)**: Nunca implemente funcionalidades que não foram solicitadas. Caso identifique melhorias, apenas informe ao final da tarefa. Não implemente sem autorização.
2. **Não quebrar funcionalidades existentes**: Antes de alterar qualquer arquivo, compreenda seu funcionamento. Nunca remova funcionalidades existentes sem autorização explícita. Sempre preserve compatibilidade com o restante do projeto.
3. **Não criar código duplicado**: Antes de criar qualquer função, componente ou utilitário, verifique se já existe algo semelhante no projeto. Sempre reutilize código existente quando possível.
4. **Sempre entender o projeto**: Antes de implementar qualquer alteração: Analise a estrutura do projeto, entenda os padrões utilizados, respeite a arquitetura existente e não crie novos padrões sem necessidade.
5. **Não criar arquivos desnecessários**: Nunca crie arquivos, pastas ou componentes sem necessidade. Sempre prefira utilizar a estrutura já existente.
6. **Código de produção**: Todo código produzido deve ser considerado código de produção. Evite soluções temporárias, gambiarras ou implementações experimentais.
7. **Qualidade do código**: Priorize legibilidade, performance, reutilização, escalabilidade e facilidade de manutenção.
8. **Checklist final**: Antes de considerar uma tarefa concluída, verifique: TypeScript, ESLint, Imports, Código morto, Performance, Responsividade, Acessibilidade, Possíveis regressões e Compatibilidade com Vercel.
9. **Vercel**: Para os projetos que forem hospedados na Vercel, sempre priorize baixo tempo de build, baixo consumo de memória, menor bundle possível, lazy loading, code splitting, otimização de imagens, cache, renderização adequada (SSR, SSG, ISR ou CSR), e Edge Runtime quando fizer sentido. Evite qualquer solução que prejudique o desempenho na Vercel.
10. **Segurança**: Nunca exponha secrets, tokens, coloque chaves no frontend ou ignore validações. Sempre utilize variáveis de ambiente.
11. **Pensar antes de codar**: Antes de escrever código: Analise o problema, planeje a solução, e só então implemente. Evite alterar arquivos por tentativa e erro.
12. **Nunca assumir**: Caso alguma informação importante esteja faltando, não invente (somente se eu autorizar). Solicite apenas a informação necessária para continuar.
13. **Respeitar o estilo existente**: Sempre siga o padrão já utilizado no projeto. Não altere o estilo do código apenas por preferência pessoal.
14. **Organização**: Prefira componentes pequenos, funções pequenas, responsabilidade única, arquivos organizados e baixo acoplamento.
15. **Logs**: Nunca deixe `console.log`, prints de debug ou código temporário na versão final.
16. **Dependências**: Antes de instalar uma nova biblioteca, verifique se o projeto já possui alguma capaz de resolver o problema. Evite dependências desnecessárias.
17. **Skills**: Durante toda a execução, utilize exclusivamente as Skills autorizadas. Nunca utilize Skills não autorizadas ou ative Skills automaticamente.

Antes de iniciar qualquer implementação, leia completamente o contexto fornecido pelo usuário e os arquivos relevantes do projeto. Não faça alterações baseadas em suposições.

---

# Catálogo de Skills Disponíveis

- **Design & UI/UX**: interface visual, sistemas de design, tokens, tipografia, layout, crítica de design.
- **Motion & animação**: easing, timing, animação de UI, motion graphics, bibliotecas de animação.
- **Marketing & growth**: anúncios, copywriting, SEO, CRO, email marketing, redes sociais, growth loops.
- **Segurança ofensiva / pentest**: red team, exploração de rede, AD, cloud, mobile, web3, escalonamento de privilégio.
- **Segurança defensiva / appsec**: revisão de código seguro, OWASP, threat modeling, compliance, gestão de segredos.
- **Desenvolvimento backend por linguagem**: Python, Go, Rust, Java, C#, PHP, Kotlin, etc.
- **Desenvolvimento frontend por framework**: React, Vue, Next.js, Angular, Svelte.
- **Mobile**: iOS, Android, Flutter, React Native, design de app mobile.
- **DevOps & infraestrutura**: Docker, Kubernetes, Terraform, CI/CD, monitoramento, cloud (AWS/Azure/GCP).
- **Banco de dados**: modelagem, migração, otimização de query, Postgres/Supabase.
- **Geração de mídia com IA**: imagem, vídeo, música, voz, lipsync, face swap, upscaling.
- **Produção de vídeo**: edição, legendas, storyboard, roteirização, Remotion.
- **Design gráfico / branding**: logo, identidade visual, brandkit, paleta de cor.
- **Gestão de produto**: roadmap, priorização, discovery, personas, specs.
- **Planejamento & operações de projeto**: sprints, capacity planning, gantt.
- **Liderança & gestão de pessoas**: one-on-ones, feedback, conflito, carreira, onboarding de time.
- **Estratégia de negócio**: GTM, pitch deck, cap table, fluxo de caixa, precificação.
- **Vendas & revenue ops**: outreach, prospecção, sales enablement.
- **Design de agentes/IA & prompt engineering**: orquestração multiagente, arquitetura de prompt, alinhamento e ética de IA, design de conversa com LLM.
- **Acessibilidade**: conteúdo acessível, interação inclusiva, interfaces adaptativas, decisões de acessibilidade.
- **Testes & QA**: testes automatizados, e2e, revisão de código, TDD.
- **Documentação & escrita técnica**: changelogs, ADRs, guias, specs.
- **Automação de workflow (n8n)**: nodes, agentes, tratamento de erro, validação.
- **Bots de comunicação**: Slack, Telegram, Discord, WhatsApp/Twilio.
- **Jogos**: game design, level design, balanceamento, Roblox, Godot.
- **Gráficos 3D / WebXR**: Three.js, Babylon, engines de jogo, realidade estendida.
- **API design**: REST, GraphQL, versionamento, paginação.
- **Finanças pessoais/investimento**: análise de ações, opções, forecasting.
- **Desenvolvimento de carreira & aprendizado**: coaching, prática deliberada, flashcards.
- **Meta: gestão das próprias skills**: criar, manter e descobrir skills/plugins do Claude Code.
- **Integrações & ferramentas externas**: Figma, Runway, Composio, Atlassian, Vercel, MCP servers em geral.
