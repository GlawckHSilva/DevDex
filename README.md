# DevDex

Plataforma gamificada para aprender programação escrevendo, executando, testando e corrigindo código real.

## Estado

Fase 0 concluída: arquitetura, modelo PostgreSQL, migrations, documentação, interface-base e validações. O primeiro fluxo funcional de missão ainda não foi implementado.

## Stack

- React 19, TypeScript, Tailwind CSS 4 e Vinext (modelo de aplicação Next.js)
- PostgreSQL e Supabase Auth planejados para o MVP
- Monaco Editor e runner isolado na próxima etapa

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
