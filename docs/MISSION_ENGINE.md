# Motor de missões

## Fluxo

1. validar sessão, trilha e pré-requisitos;
2. entregar briefing, starter code e somente testes públicos;
3. aceitar submissão com limite de tamanho e idempotency key;
4. enviar ao runner isolado;
5. normalizar stdout, erros e testes;
6. concluir em transação: tentativa, domínio, XP e próximo desbloqueio.

Tipos: tutorial, coding challenge, bug hunt, support, project e boss. O MVP implementará primeiro `coding_challenge`, depois HTML/CSS preview e SQL.

Estados: `available`, `in_progress`, `completed`. Repetir missão pode melhorar domínio, mas não concede o mesmo XP indefinidamente.
