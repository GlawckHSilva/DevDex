# Execução de código

## Princípio

Código do aluno nunca executa no app ou no banco principal.

## Runner

Cada runtime implementa `RunnerAdapter`. JavaScript cria um contexto QuickJS/Wasm; SQL cria um banco SQLite/Wasm totalmente novo em memória; HTML/CSS é analisado por AST no backend.

Controles atuais: sem APIs do host, rede ou filesystem; interrupção por tempo; limites de memória, pilha e tamanho de código.

O runner SQL executa schema e seed confiáveis, prepara um único SELECT do aluno, valida o resultado e fecha o banco. O D1 principal nunca é exposto ao adapter.

## Implementação atual

JavaScript roda em QuickJS/Wasm. SQL roda em SQLite/Wasm descartável. HTML e CSS usam validação estrutural e preview em iframe sandbox. Python usa runner próprio com Pyodide. GitHub usa validação segura de comandos e procedimentos, sem executar ações reais.

As seis trilhas publicadas possuem materiais de estudo antes das batalhas e validações privadas no backend.

Runtimes futuros podem migrar para serviço externo quando exigirem isolamento de processo.
