# Arquitetura

## Decisões

O DevDex começa como monólito modular para produto e dados. JavaScript não confiável roda em uma VM QuickJS compilada para Wasm, sem APIs do host; linguagens futuras usarão um serviço externo.

```text
Browser
  └─ Web App (React/TypeScript)
       ├─ Identity (SIWC no deploy privado; Supabase Auth no produto público)
       ├─ Curriculum + Progress (D1 adapter; PostgreSQL como alvo)
       └─ Runner QuickJS/Wasm isolado
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
supabase/migrations/  modelo PostgreSQL alvo
drizzle/              migration D1 executável no Sites
tests/                validações automatizadas
worker/               entrada de deploy do app
lib/quickjs-runner*    sandbox JavaScript e limites de execução
```

## Limites

- A interface nunca consulta `mission_tests`.
- O cliente não concede XP nem altera domínio.
- Conclusão, domínio e XP serão gravados por operação transacional server-side.
- O runner não compartilha banco, filesystem ou credenciais com o app.
- Conteúdo publicado é versionado; progresso aponta para a versão estudada.

## Evolução

Separar backend da aplicação somente quando carga, equipe ou limites de deploy justificarem. O runner externo entra com novas linguagens ou quando métricas exigirem isolamento de processo. Filas, cache e storage entram por necessidade medida.
