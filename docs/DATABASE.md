# Banco de dados

PostgreSQL/Supabase é a fonte de verdade. `supabase/migrations` é canônico; `db/schema.ts` fornece tipos e geração Drizzle.

## Modelo

- Currículo: `technologies → curriculum_versions → learning_paths → skills → lessons → missions → mission_tests`.
- Pré-requisitos: `skill_prerequisites` forma um grafo acíclico validado pela aplicação/editorial.
- Usuário: `profiles`, `user_learning_paths`, `user_skill_progress`, `user_missions`, `user_xp_history`.
- Atualização: `curriculum_sources` registra fonte, versão, verificação e mudança detectada.

## Regras

- porcentagem da trilha deriva do peso/domínio das skills, não de valor manual;
- `mastery` varia de 0 a 100 e é reavaliado por tentativas futuras;
- XP é ledger append-only em `user_xp_history`; `profiles.total_xp` é projeção transacional;
- testes privados só são lidos pelo serviço responsável por avaliar submissões;
- conteúdo usa `draft`, `review`, `published` e `deprecated`.

## Segurança

RLS permite leitura de conteúdo publicado e acesso do aluno apenas aos próprios dados. Escritas de resultado, domínio e XP são revogadas do cliente e devem ocorrer em função/serviço server-side.

## Migrations

- `20260813130000_foundation.sql`: tipos, tabelas, índices, triggers, RLS e grants.
- `20260813131000_seed_mvp_curriculum.sql`: quatro trilhas e skills iniciais.
