# Motor de missões

## Fluxo

1. validar sessão, trilha e pré-requisitos;
2. entregar briefing, starter code e somente testes públicos;
3. aceitar submissão com limite de tamanho e rate limit;
4. enviar ao runner isolado;
5. normalizar stdout, erros e testes;
6. concluir em transação: tentativa, domínio, XP e próximo desbloqueio.

Tipos: tutorial, coding challenge, bug hunt, support, project e boss. A beta atual possui desafios de GitHub, HTML, CSS, JavaScript, SQL e Python.

Projetos são um domínio próprio: `projects`, `project_steps`, `project_files` e progresso dedicado. Lessons ensinam conceitos, challenges praticam habilidades isoladas, projects combinam tecnologias e boss battles reduzem a orientação.

Estados: `available`, `in_progress`, `completed`. Repetir missão pode melhorar domínio, mas não concede o mesmo XP indefinidamente.

O primeiro fluxo aplica essas regras em batch transacional D1: falhas incrementam tentativas; a primeira conclusão concede XP, atualiza domínio e cria a disponibilidade da próxima missão. Repetições mantêm o XP total.
