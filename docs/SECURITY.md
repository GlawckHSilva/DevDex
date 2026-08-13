# Segurança

## Ameaças prioritárias

- escape da sandbox, mineração, fork bomb, loop infinito e exfiltração;
- IDOR entre alunos, alteração fraudulenta de XP e enumeração de perfis;
- vazamento de testes privados e soluções;
- XSS no preview HTML e conteúdo editorial;
- abuso de custos e supply chain.

## Controles

- SIWC e autorização server-side por `user_id` em toda operação pessoal;
- binding D1 disponível somente ao Worker;
- testes privados consultados somente durante a avaliação e anonimizados na resposta;
- XP/domínio concluídos em transação idempotente;
- CSP, headers seguros, sanitização e iframe sandbox sem mesma origem;
- rate limit por usuário/IP/missão e auditoria de eventos sensíveis;
- secrets apenas no ambiente, rotação e menor privilégio;
- dependências travadas e imagens do runner verificadas.

Antes do piloto: pentest dos fluxos de submissão, alertas de abuso e plano de resposta a incidentes.
