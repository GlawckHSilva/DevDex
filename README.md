# DevDex

Plataforma gamificada para aprender programação escrevendo, executando, testando e corrigindo código real.

## Estado

Fase 1A em andamento: as primeiras missões JavaScript funcionam ponta a ponta com autenticação, sandbox, testes privados, XP idempotente e desbloqueio.

## Stack

- React 19, TypeScript, Tailwind CSS 4 e Vinext (modelo de aplicação Next.js)
- D1 + Sign in with ChatGPT no deploy privado; PostgreSQL/Supabase permanece o alvo público
- Monaco Editor e QuickJS/Wasm isolado com limites de CPU, memória e pilha

## Desenvolvimento

Requisitos: Node.js 22+ e, para o banco local, Supabase CLI + Docker.

```bash
npm ci
npm run dev
```

Validação:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Banco local:

```bash
supabase start
supabase db reset
```

Copie `.env.example` para `.env.local` e preencha apenas no ambiente local. Nunca versione secrets.

## Leitura obrigatória para novas sessões

1. [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. [ROADMAP.md](ROADMAP.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)
4. [CHANGELOG.md](CHANGELOG.md)
5. [docs/](docs/README.md)
