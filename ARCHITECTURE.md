# Arquitetura

## Decisões

O DevDex começa como monólito modular para produto e dados, com a execução de código obrigatoriamente separada. Essa divisão mantém a Fase 0 simples sem colocar código não confiável no processo principal.

```text
Browser
  └─ Web App (React/TypeScript)
       ├─ Identity (SIWC no deploy privado; Supabase Auth no produto público)
       ├─ Curriculum + Progress (D1 adapter; PostgreSQL como alvo)
       └─ Runner Client
            └─ Code Runner isolado (serviço futuro)
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
```

## Limites

- A interface nunca consulta `mission_tests`.
- O cliente não concede XP nem altera domínio.
- Conclusão, domínio e XP serão gravados por operação transacional server-side.
- O runner não compartilha banco, filesystem ou credenciais com o app.
- Conteúdo publicado é versionado; progresso aponta para a versão estudada.

## Evolução

Separar backend da aplicação somente quando carga, equipe ou limites de deploy justificarem. O runner já nasce como serviço independente. Filas, cache e storage entram por necessidade medida.
