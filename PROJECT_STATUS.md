# Project Status

Atualizado em: 2026-08-13

## Situação

Fase 0 concluída e runner JavaScript da Fase 1A.2 funcional.

## Implementado

- landing page, dashboard autenticado, missão e API de submissão;
- UI dark inspirada em IDE, responsiva;
- modelo PostgreSQL alvo e adapter D1 versionado para o deploy privado;
- RLS para dados pessoais e bloqueio de testes privados;
- seed versionado das quatro trilhas do MVP;
- Monaco, QuickJS/Wasm isolado, testes privados, XP idempotente e desbloqueio;
- limite por usuário e histórico de submissões sem armazenar o código-fonte;
- duas missões JavaScript iniciais.

## Não implementado

- Supabase e autenticação pública do produto;
- E2E automatizado no navegador;
- painel admin, mentor IA e tecnologias pós-MVP.

## Próxima tarefa

Adicionar o adapter PostgreSQL/Supabase e o E2E do fluxo autenticado.
