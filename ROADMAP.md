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

## Próximo — Learning Engine

- Fase 1: corrigir inconsistências de documentação e números públicos derivados do banco;
- Fase 2: consolidar Maestria como domínio técnico separado de XP/level;
- Fase 3: evoluir a revisão inteligente usando maestria, erro recente e tempo sem prática;
- Fase 4: criar a tela Hoje como plano curto de estudo;
- Fases seguintes: padronizar ciclo pedagógico, diversificar desafios, evoluir Project Mode, preparar Caminhos e Mentor IA.

## Implementado — Battle IDE

- header de batalha com retorno ao mapa, breadcrumb, vidas e XP;
- arena com personagem persistido, inimigo, HP por critérios e objetivos reativos;
- editor Monaco, preview/browser ou banco isolado e console compacto;
- PESQUISAR, TESTAR e ATACAR em hierarquia clara, sem alterar as regras de vidas e XP;
- derrota com retry, vitória, feedback de dano e layout mobile em fluxo vertical.

## Implementado — Adventure Map JavaScript

- Bosque dos Fundamentos como cenário pixel art original;
- caminho SVG sinuoso com estados concluído, disponível e bloqueado;
- nodes selecionáveis, painel contextual e navegação em duas etapas;
- personagem posicionado conforme o progresso real;
- boss de construção bloqueado no mapa até concluir as cinco missões;
- trilha vertical responsiva e acessível por teclado.

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

## Pendente

- página de Maestria;
- tela Hoje;
- revisão inteligente 2.0;
- formatos de desafio além de batalha de código;
- categorias de Project Mode: guiado, semi-guiado e independente;
- Caminhos Frontend, Backend, Full Stack e IA usando conteúdos existentes;
- Mentor IA geral com escada de ajuda e limites integrados às dicas.

## Riscos

- isolamento para linguagens futuras e custo por execução;
- consistência entre conclusão, domínio e XP;
- vazamento de testes privados;
- compatibilidade de execução SQL entre dialetos;
- manutenção editorial do currículo.

## Débitos técnicos conhecidos

- SIWC depende do ambiente do ChatGPT e não oferece login independente;
- D1 não tem RLS nativo; toda autorização permanece no backend.
