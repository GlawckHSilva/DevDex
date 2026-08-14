# Roadmap

## Implementado — Fase 0

- arquitetura modular e limites de segurança;
- design base responsivo;
- schema D1, autorização server-side e migrations;
- modelo de currículo versionado e progresso por domínio;
- documentação operacional e escopo fechado do MVP;
- lint, typecheck, testes e build.

## Implementado — Fase 1A.1

Primeiro fluxo vertical JavaScript:

- autenticação SIWC e separação por usuário;
- currículo e progresso persistidos em D1;
- cinco missões sequenciais carregadas do banco;
- Monaco, execução/validação e testes privados;
- sandbox QuickJS/Wasm sem APIs do host;
- XP idempotente, domínio e desbloqueio.

## Implementado — Fase 1A.2

- runner QuickJS/Wasm para JavaScript completo, sem APIs do host;
- limites de CPU, memória, pilha e tamanho de código;
- rate limit e histórico de submissões com hash do código;
- E2E autenticado, persistência e testes de concorrência do XP.

## Implementado — Fase 1B.1

- adapters independentes para JavaScript e SQLite;
- banco SQLite/Wasm novo e descartado a cada submissão;
- seis missões: SELECT, WHERE, ORDER BY, BETWEEN, LIKE e IN;
- resultado tabular, estrutura do banco e erros didáticos;
- SELECT único, limites de query, linhas, tempo e escopo;
- E2E de erros, 20 reenvios, concorrência e isolamento.

## Implementado — Public Beta v0.1

- acesso público com autenticação SIWC e progresso isolado;
- flag e limite configurável de participantes;
- métricas agregadas sem armazenamento do código-fonte;
- painel de métricas exclusivo do administrador;
- status sincronizado com o currículo publicado.

## Próximo

- testar as quatro campanhas com usuários reais;
- ajustar vidas, PESQUISAR, narrativa e bosses com base nas métricas;
- criar novas zonas somente após validar o loop atual.

## Implementado — Campaign RPG v0.2

- uma campanha independente para cada tecnologia atual;
- mapas, zonas, história e visual configurados no D1;
- HTML, CSS, JavaScript e SQL convertidos em batalhas;
- progresso técnico separado por campanha e XP global;
- Project Mode integrado como boss de construção;
- área RPG genérica removida da navegação.

## Implementado — RPG Zone 01

- escolha persistente entre aventureiro e aventureira;
- mapa do Bosque dos Fundamentos com cinco batalhas JavaScript;
- três vidas, TESTAR, ATACAR, PESQUISAR e renascimento;
- Mago das Funções como elite e Hidra dos Arrays como chefe;
- métricas agregadas de vitórias, derrotas, vidas, pesquisa e duração.

## Implementado — Fase 1D

- entidades próprias para projetos, etapas, arquivos e progresso;
- To-do App em cinco etapas cumulativas;
- workspace com árvore de arquivos, editor, preview e requisitos;
- JavaScript + DOM validado em QuickJS com DOM controlado;
- autosave do código somente no navegador;
- projeto concluído exibido no dashboard.

## Implementado — Fase 1C

- adapters HTML/CSS com parsing e validação server-side;
- quatro missões HTML e quatro CSS encadeadas;
- preview em iframe sandbox com CSP sem scripts, rede ou navegação;
- E2E do fluxo visual e bloqueio de conteúdo ativo.

## Depois — Fase 1B

- expandir HTML, CSS, JavaScript e SQL básico;
- dashboard, perfil, skill tree e revisão;
- observabilidade e painel editorial mínimo.

## Pendente

- Fase 2: expandir as campanhas atuais antes de avaliar novas tecnologias;
- Fase 3: React, TypeScript, PostgreSQL avançado e mentor IA;
- Fases 4–6: mobile, backend, Flutter e atualização inteligente.

## Riscos

- isolamento para linguagens futuras e custo por execução;
- consistência entre conclusão, domínio e XP;
- vazamento de testes privados;
- compatibilidade de execução SQL entre dialetos;
- manutenção editorial do currículo.

## Débitos técnicos conhecidos

- SIWC depende do ambiente do ChatGPT e não oferece login independente;
- D1 não tem RLS nativo; toda autorização permanece no backend.
