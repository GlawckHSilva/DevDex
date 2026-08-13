# Segurança

## Ameaças prioritárias

- escape da sandbox, mineração, fork bomb, loop infinito e exfiltração;
- IDOR entre alunos, alteração fraudulenta de XP e enumeração de perfis;
- vazamento de testes privados e soluções;
- XSS no preview HTML e conteúdo editorial;
- abuso de custos e supply chain.

## Controles

- RLS e autorização server-side em toda operação pessoal;
- service role nunca exposta ao browser;
- testes privados sem policy e com grants revogados;
- XP/domínio concluídos em transação idempotente;
- CSP, headers seguros, sanitização e iframe sandbox sem mesma origem;
- rate limit por usuário/IP/missão e auditoria de eventos sensíveis;
- secrets apenas no ambiente, rotação e menor privilégio;
- dependências travadas e imagens do runner verificadas.

Antes do piloto: threat model do runner, teste de isolamento, revisão RLS, pentest dos fluxos de submissão e plano de resposta a incidentes.
