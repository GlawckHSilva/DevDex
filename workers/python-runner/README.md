## DevDex Python Runner

Backend isolado que avalia as missões Python sem armazenar o código-fonte do aluno.

### Types and autocomplete

This project also includes a pyproject.toml with some requirements which
set up autocomplete and type hints for this Python Workers project.

To get these installed you'll need `uv`, which you can install by following
https://docs.astral.sh/uv/getting-started/installation/.

Para desenvolver localmente:

```
uv sync
uv run pywrangler dev
```

O endpoint de execução exige o segredo `RUNNER_SECRET`.
