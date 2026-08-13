# Execução de código

## Princípio

Código do aluno nunca executa no app ou no banco principal.

## Runner

Cada execução JavaScript cria um contexto QuickJS/Wasm efêmero. Entrada: código, função, testes privados e limites. Saída: status, testes anonimizados e métricas.

Controles atuais: sem APIs do host, rede ou filesystem; interrupção por tempo; limites de memória, pilha e tamanho de código.

JavaScript será o primeiro runtime. SQL usa banco efêmero por missão, credenciais únicas e statements permitidos. HTML/CSS usa iframe sandbox no preview e validação DOM/CSS separada.

## Implementação atual

As cinco missões usam QuickJS/Wasm isolado dentro do Worker. Cada teste recebe valores serializados e compara o resultado dentro do contexto descartável.

Runtimes futuros podem migrar para serviço externo quando exigirem isolamento de processo.
