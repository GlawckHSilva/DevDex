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
- duas missões sequenciais carregadas do banco;
- Monaco, execução/validação e testes privados;
- avaliador AST por allowlist, sem `eval`;
- XP idempotente, domínio e desbloqueio.

## Próximo — Fase 1A.2

- serviço runner isolado para JavaScript completo;
- adapter PostgreSQL/Supabase e autenticação pública;
- E2E do login à conclusão;
- observabilidade, rate limit e histórico de submissões.

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

- isolamento real do runner e custo por execução;
- consistência entre conclusão, domínio e XP;
- vazamento de testes privados;
- compatibilidade de execução SQL entre dialetos;
- manutenção editorial do currículo.

## Débitos técnicos conhecidos

- Supabase ainda não foi provisionado; o deploy privado usa D1/SIWC;
- o avaliador atual suporta apenas expressões AST permitidas, não JavaScript geral;
- migrations foram validadas estaticamente, sem instância PostgreSQL local;
- runner e E2E pertencem à próxima etapa.
