# Banco de dados

Cloudflare D1 é o banco principal, definido em `db/schema.ts` e migrado por `drizzle/`. A interface nunca acessa o banco diretamente.

## Modelo

- Currículo: `technologies → learning_paths → skills → lessons → missions → mission_tests`.
- Pré-requisitos: `mission_prerequisites` controla o desbloqueio sequencial.
- Usuário: `profiles`, `user_learning_paths`, `user_skill_progress`, `user_missions`, `user_xp_history`, `user_resources`.
- Operação: `submissions` registra hash, runtime, versão, duração e contagens, nunca o código.
- Laboratório SQL: `sql_mission_configs` guarda schema, seed, validador, dialeto e limites; o banco do aluno existe somente em memória.

## Regras

- porcentagem da trilha deriva do peso/domínio das skills, não de valor manual;
- `mastery` varia de 0 a 100 e é reavaliado por tentativas futuras;
- XP é ledger append-only em `user_xp_history`; `profiles.total_xp` é projeção transacional;
- testes privados só são lidos pelo serviço responsável por avaliar submissões;
- conteúdo usa `draft`, `review`, `published` e `deprecated`.

## Segurança

D1 não possui RLS. Todas as consultas pessoais recebem o `user_id` autenticado pelo SIWC, e escritas de resultado e XP existem somente no backend.

## Migrations

- `0000`: fundação, índices e seed inicial.
- `0001`: submissões operacionais.
- `0002`: trilha com cinco missões, aulas, pré-requisitos e métricas.
- `0003`: configuração e seis missões SQL Fundamentals · SQLite.
- `0004`: configuração e oito missões HTML/CSS.
- `0005`: projetos, etapas, arquivos, progresso, XP e submissões do Project Mode.
- `0006` a `0012`: beta pública, métricas, campanhas RPG, materiais e lore.
- `0013` a `0016`: Python, nós de estudo e expansão profissional das seis trilhas.
- `0017` a `0020`: desbloqueio de projetos, GitHub App, revisão de repositório e currículo GitHub.
- `0021` e `0022`: Biblioteca educacional, favoritos, histórico e revisão espaçada.
- `0023`: progressão gamificada global, corações, dicas, habilidades e desempenho.
