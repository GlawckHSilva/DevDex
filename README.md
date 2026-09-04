# DevDex

Plataforma gamificada para aprender programação escrevendo, executando, testando e corrigindo código real.

## Estado

Public Beta v0.3: seis campanhas RPG publicadas com materiais, batalhas, revisão inteligente, Biblioteca, Project Mode, GitHub e progressão gamificada.

## Stack

- React 19, TypeScript, Tailwind CSS 4 e Vinext (modelo de aplicação Next.js)
- Cloudflare D1 + Sign in with ChatGPT
- Monaco Editor, QuickJS/Wasm, SQLite/Wasm descartável e preview Web isolado

## Desenvolvimento

Requisito: Node.js 22+.

```bash
npm ci
npm run dev
```

Validação:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Banco local:

```bash
node scripts/dev-e2e.mjs
```

O D1 local é criado pelas migrations em `drizzle/`; o teste E2E usa estado isolado em `work/`.

## Leitura obrigatória para novas sessões

1. [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. [ROADMAP.md](ROADMAP.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)
4. [CHANGELOG.md](CHANGELOG.md)
5. [CURRICULUM.md](CURRICULUM.md)
6. [CAMPAIGNS.md](CAMPAIGNS.md)
7. [docs/](docs/README.md)
