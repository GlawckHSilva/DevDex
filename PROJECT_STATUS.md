# Project Status

Atualizado em: 2026-09-04

## Situação

Public Beta v0.3 com Revisão Inteligente 2.0 integrada ao Learning Engine.

## Implementado

- landing page, dashboard autenticado, missão e API de submissão;
- UI dark inspirada em IDE, responsiva;
- D1 como banco principal, com migrations versionadas;
- autorização server-side por usuário e bloqueio de testes privados;
- seed versionado das seis trilhas publicadas;
- Monaco, QuickJS/Wasm isolado, testes privados, XP idempotente e desbloqueio;
- limite por usuário e histórico de submissões sem armazenar o código-fonte;
- GitHub, HTML, CSS, JavaScript, SQL e Python com 24 materiais e 126 batalhas por trilha;
- SQLite/Wasm descartável por execução, sem acesso ao D1 principal;
- visualizador de dados/estrutura, editor SQL e resultado tabular;
- HTML/CSS com validação estrutural no backend;
- Python com runner próprio e conteúdo profissional progressivo;
- GitHub com validação segura de comandos, fluxos e práticas profissionais;
- preview visual em iframe opaco, sem scripts, rede, formulários ou navegação;
- Project Mode com To-do App em cinco etapas e três arquivos;
- progresso de projeto próprio, XP idempotente e autosave local do código;
- E2E de autenticação, persistência, isolamento, bloqueio e XP concorrente.
- acesso público com SIWC, limite configurável de participantes e administrador único;
- painel administrativo com métricas agregadas de usuários, missões, runtimes e projetos;
- status derivado do currículo publicado e favicon configurado.
- seis campanhas RPG independentes: Forja Colaborativa, Crônicas da Estrutura, Reino dos Estilos, Cidade da Lógica, Minas dos Dados e Código da Serpente;
- todas as missões publicadas representadas por inimigos, elites ou bosses em zonas configuráveis no D1;
- personagem compartilhado, três vidas, TESTAR, ATACAR, PESQUISAR e renascimento em todos os runners;
- Project Mode ligado à Cidade da Lógica como boss de construção, mantendo domínio e sandbox próprios;
- HTML, CSS, JavaScript e SQL com mapas pixel art próprios, caminho SVG por estado, painel contextual e trilha mobile vertical;
- tela de batalha RPG + IDE com vidas e XP no header, arena jogador versus inimigo, HP determinístico por critérios, objetivos reativos, preview em moldura de navegador, console compacto e ações PESQUISAR/TESTAR/ATACAR;
- Espectro do Esqueleto como asset pixel art substituível e estados visuais de dano, derrota, retry e vitória;
- telemetria de batalhas, derrotas, vidas perdidas, pesquisas e tempo de conclusão.
- Biblioteca educacional com 144 conteúdos, favoritos, histórico, quiz e Revisão Inteligente 2.0;
- Maestria técnica dedicada em `/maestria`, com cálculo separado de XP, estados visíveis e indicação discreta de revisão;
- recomendações adaptativas em `getUserReviewRecommendations(userId)`, consumidas por Biblioteca, Dashboard e Maestria;
- testes de fundação/runners e 25 cenários E2E cobrindo o fluxo crítico.

## Não implementado

- login independente por e-mail/senha fora do ChatGPT;
- tela Hoje;
- caminhos de carreira;
- Mentor IA geral de missão com escada de ajuda.

## Próxima tarefa

Implementar a Fase 4 do Learning Engine: criar a tela Hoje como plano curto de estudo usando as recomendações já centralizadas.
