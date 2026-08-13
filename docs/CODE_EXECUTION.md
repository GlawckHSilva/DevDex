# Execução de código

## Princípio

Código do aluno nunca executa no app ou no banco principal.

## Runner

Cada runtime implementa `RunnerAdapter`. JavaScript cria um contexto QuickJS/Wasm; SQL cria um banco SQLite/Wasm totalmente novo em memória.

Controles atuais: sem APIs do host, rede ou filesystem; interrupção por tempo; limites de memória, pilha e tamanho de código.

O runner SQL executa schema e seed confiáveis, prepara um único SELECT do aluno, valida o resultado e fecha o banco. O D1 principal nunca é exposto ao adapter.

## Implementação atual

JavaScript possui cinco missões em QuickJS. SQLite possui seis missões de leitura, com limite de 4.000 caracteres, um statement, 100 linhas e timeout por missão.

Runtimes futuros podem migrar para serviço externo quando exigirem isolamento de processo.
