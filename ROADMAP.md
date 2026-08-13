# Roadmap

## Implementado — Fase 0

- arquitetura modular e limites de segurança;
- design base responsivo;
- schema PostgreSQL, RLS e migrations;
- modelo de currículo versionado e progresso por domínio;
- documentação operacional e escopo fechado do MVP;
- lint, typecheck, testes e build.

## Implementado — Fase 1A.1

Primeiro fluxo vertical JavaScript:

- autenticação SIWC e separação por usuário;
- currículo e progresso persistidos em D1;
- cinco missões sequenciais carregadas do banco;
- Monaco, execução/validação e testes privados;
- sandbox QuickJS/Wasm sem APIs do host;
- XP idempotente, domínio e desbloqueio.

## Implementado — Fase 1A.2

- runner QuickJS/Wasm para JavaScript completo, sem APIs do host;
- limites de CPU, memória, pilha e tamanho de código;
- rate limit e histórico de submissões com hash do código;
- E2E autenticado, persistência e testes de concorrência do XP.

## Próximo

- primeiro runtime SQL isolado;
- métricas agregadas e alertas de execução.

## Depois — Fase 1B

- expandir HTML, CSS, JavaScript e SQL básico;
- preview HTML/CSS;
- sandbox SQL por desafio;
- dashboard, perfil, skill tree e revisão;
- observabilidade e painel editorial mínimo.

## Pendente

- Fase 2: JavaScript/SQL intermediário, Python e projetos;
- Fase 3: React, TypeScript, PostgreSQL avançado e mentor IA;
- Fases 4–6: mobile, backend, Flutter e atualização inteligente.

## Riscos

- isolamento para linguagens futuras e custo por execução;
- consistência entre conclusão, domínio e XP;
- vazamento de testes privados;
- compatibilidade de execução SQL entre dialetos;
- manutenção editorial do currículo.

## Débitos técnicos conhecidos

- SIWC depende do ambiente do ChatGPT e não oferece login independente;
- D1 não tem RLS nativo; toda autorização permanece no backend.
