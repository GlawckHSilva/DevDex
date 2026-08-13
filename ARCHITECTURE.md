# Arquitetura

## Decisões

O DevDex começa como monólito modular para produto e dados. JavaScript roda em QuickJS/Wasm; SQL roda em SQLite/Wasm descartável; HTML/CSS é analisado no backend e renderizado em iframe opaco. Nenhum runtime recebe o binding do D1 principal.

```text
Browser
  └─ Web App (React/TypeScript)
       ├─ Identity (Sign in with ChatGPT)
       ├─ Curriculum + Progress (Cloudflare D1)
       └─ Runner adapters
            ├─ QuickJS/Wasm
            ├─ SQLite/Wasm efêmero
            └─ Parser Web + iframe sandbox
```

## Domínios

- `identity`: conta, perfil e autorização.
- `curriculum`: tecnologias, versões, trilhas, skills, aulas, missões e testes.
- `progression`: domínio, tentativas, XP, desbloqueios e revisões.
- `execution`: submissões, sandbox, limites e resultados.
- `updates`: fontes oficiais, mudanças detectadas e revisão editorial.

## Estrutura atual

```text
app/                  rotas e interface
db/                   schema e adapter D1 do deploy privado
docs/                 decisões e especificações
drizzle/              migration D1 executável no Sites
tests/                validações automatizadas
worker/               entrada de deploy do app
lib/runners/           contratos e adapters de runtime
lib/quickjs-runner*    sandbox JavaScript existente
```

## Limites

- A interface nunca consulta `mission_tests`.
- O cliente não concede XP nem altera domínio.
- Conclusão, domínio e XP são gravados por batch transacional e idempotente no servidor.
- O runner não compartilha banco, filesystem ou credenciais com o app.
- Conteúdo publicado é versionado; progresso aponta para a versão estudada.

## Evolução

Separar backend da aplicação somente quando carga, equipe ou limites de deploy justificarem. O runner externo entra com novas linguagens ou quando métricas exigirem isolamento de processo. Filas, cache e storage entram por necessidade medida.
