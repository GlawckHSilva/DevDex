# Project Status

Atualizado em: 2026-08-14

## Situação

Public Beta v0.2 pronta para publicação em Cloudflare Sites.

## Implementado

- landing page, dashboard autenticado, missão e API de submissão;
- UI dark inspirada em IDE, responsiva;
- D1 como banco principal, com migrations versionadas;
- autorização server-side por usuário e bloqueio de testes privados;
- seed versionado das quatro trilhas do MVP;
- Monaco, QuickJS/Wasm isolado, testes privados, XP idempotente e desbloqueio;
- limite por usuário e histórico de submissões sem armazenar o código-fonte;
- cinco missões JavaScript encadeadas;
- seis missões SQL Fundamentals · SQLite, de SELECT a IN;
- SQLite/Wasm descartável por execução, sem acesso ao D1 principal;
- visualizador de dados/estrutura, editor SQL e resultado tabular;
- quatro missões HTML e quatro CSS com validação estrutural no backend;
- preview visual em iframe opaco, sem scripts, rede, formulários ou navegação;
- Project Mode com To-do App em cinco etapas e três arquivos;
- progresso de projeto próprio, XP idempotente e autosave local do código;
- E2E de autenticação, persistência, isolamento, bloqueio e XP concorrente.
- acesso público com SIWC, limite configurável de participantes e administrador único;
- painel administrativo com métricas agregadas de usuários, missões, runtimes e projetos;
- status derivado do currículo publicado e favicon configurado.
- quatro campanhas RPG independentes: Crônicas da Estrutura, Reino dos Estilos, Cidade da Lógica e Minas dos Dados;
- todas as 19 missões publicadas representadas por inimigos, elites ou bosses em zonas configuráveis no D1;
- personagem compartilhado, três vidas, TESTAR, ATACAR, PESQUISAR e renascimento em todos os runners;
- Project Mode ligado à Cidade da Lógica como boss de construção, mantendo domínio e sandbox próprios;
- Cidade da Lógica com mapa pixel art interativo, caminho SVG por estado, painel contextual e trilha mobile vertical;
- telemetria de batalhas, derrotas, vidas perdidas, pesquisas e tempo de conclusão.
- 23 testes de fundação/runners e 13 cenários E2E passando.

## Não implementado

- login independente por e-mail/senha fora do ChatGPT;
- login independente, mentor IA e tecnologias pós-MVP.

## Próxima tarefa

Validar o mapa da Cidade da Lógica com usuários reais antes de reaplicar o sistema em HTML, CSS e SQL.
