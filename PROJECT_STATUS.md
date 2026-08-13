# Project Status

Atualizado em: 2026-08-13

## Situação

Fase 1C concluída e publicada em Cloudflare Sites.

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
- E2E de autenticação, persistência, isolamento, bloqueio e XP concorrente.

## Não implementado

- login independente por e-mail/senha fora do ChatGPT;
- painel admin, mentor IA e tecnologias pós-MVP.

## Próxima tarefa

Adicionar métricas agregadas e alertas de execução.
