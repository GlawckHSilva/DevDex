# Changelog

## 2026-08-14

- Cidade da Lógica redesenhada como mapa de aventura com cenário pixel art original.
- Caminho SVG, nodes interativos, personagem no progresso atual e painel de missão selecionada.
- Layout mobile convertido em trilha vertical sem alterar batalhas, runners ou autoridade do backend.
- Campaign RPG v0.2 com quatro campanhas independentes e mapas próprios.
- As 19 missões de HTML, CSS, JavaScript e SQL agora são batalhas com três vidas.
- Campanhas, zonas, narrativa e vínculo de boss com Project Mode configuráveis no D1.
- Dashboard reorganizado por campanhas; `/aventura` mantido apenas como redirecionamento compatível.
- Public Beta v0.1 com SIWC, limite de participantes e administrador único.
- Métricas agregadas por missão, runtime e projeto sem armazenar código-fonte.
- `/status` sincronizado com D1 e favicon configurado.
- RPG Zone 01 com personagens, mapa, cinco inimigos, três vidas, pesquisa, elite e chefe.

## [0.7.0] — 2026-08-13

### Added

- Project Mode como domínio separado de missões;
- primeiro projeto To-do App em cinco etapas;
- workspace com três arquivos, preview e requisitos privados;
- validação DOM em QuickJS e XP idempotente por etapa;
- autosave local sem persistir código no servidor.

## [0.6.0] — 2026-08-13

### Added

- `WebRunnerAdapter` separado dos runners existentes;
- HTML e CSS Fundamentals com quatro missões cada;
- validação DOM/CSS server-side sem expor critérios privados;
- preview em iframe sandbox com CSP restritiva;
- testes de conteúdo ativo, recursos externos e fluxo visual.

## [0.5.0] — 2026-08-13

### Added

- `SqlRunnerAdapter` separado do QuickJS;
- SQLite/Wasm descartável por submissão;
- SQL Fundamentals · SQLite com seis missões encadeadas;
- visualizador de estrutura/dados, editor e resultado tabular;
- validação semântica de resultados e erros SQL didáticos;
- testes de limites, repetição, concorrência e isolamento.

## [0.4.0] — 2026-08-13

### Added

- D1 como banco principal do currículo, progresso e operação;
- trilha JavaScript com cinco skills e cinco missões encadeadas;
- autorização de pré-requisitos no backend e XP transacional/idempotente;
- E2E autenticado com persistência, isolamento, repetição e concorrência;
- métricas de submissão sem armazenamento do código-fonte.

## [0.3.0] — 2026-08-13

### Added

- sandbox QuickJS/Wasm compatível com Workers;
- limites de tempo, memória, pilha e tamanho de código;
- histórico D1 com hash do código e rate limit por usuário;
- testes de isolamento e interrupção de loops infinitos.

## [0.2.0] — 2026-08-13

### Added

- autenticação privada com Sign in with ChatGPT;
- persistência D1 versionada para currículo e progresso;
- dashboard real e duas missões JavaScript sequenciais;
- Monaco Editor, testes privados e feedback;
- avaliador AST seguro sem execução arbitrária;
- XP idempotente, domínio e desbloqueio automático.

## [0.1.0] — 2026-08-13

### Added

- fundação visual e rotas iniciais do DevDex;
- arquitetura e documentação da Fase 0;
- schema PostgreSQL com currículo, skills, missões, progresso e XP;
- migrations com RLS e seed das trilhas HTML, CSS, JavaScript e SQL;
- validações de TypeScript, lint, estrutura e renderização.
