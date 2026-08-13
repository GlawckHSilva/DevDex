# Roadmap

## Implementado — Fase 0

- arquitetura modular e limites de segurança;
- design base responsivo;
- schema PostgreSQL, RLS e migrations;
- modelo de currículo versionado e progresso por domínio;
- documentação operacional e escopo fechado do MVP;
- lint, typecheck, testes e build.

## Próximo — Fase 1A

Um fluxo vertical completo em JavaScript:

1. Supabase local e autenticação;
2. catálogo lido do banco;
3. uma lesson e uma coding challenge;
4. Monaco Editor;
5. runner JavaScript isolado mínimo;
6. testes privados, conclusão transacional, XP e desbloqueio;
7. E2E do cadastro à conclusão.

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

- Supabase ainda não foi provisionado neste ambiente;
- app ainda não possui adapter de banco nem autenticação do produto;
- migrations foram validadas estaticamente, sem instância PostgreSQL local;
- runner e E2E pertencem à próxima etapa.
