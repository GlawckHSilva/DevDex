# Execução de código

## Princípio

Código do aluno nunca executa no app ou no banco principal.

## Runner

Cada execução cria um ambiente efêmero com imagem imutável por runtime. Entrada: runtime, versão, arquivos, testes privados e limites. Saída: status, stdout/stderr truncados, testes e métricas.

Controles obrigatórios: usuário sem privilégios, filesystem read-only, diretório temporário descartável, rede bloqueada, allowlist de processos, seccomp/AppArmor equivalentes, CPU/memória/PIDs limitados, timeout externo, código e saída limitados, imagem assinada e destruição após uso.

JavaScript será o primeiro runtime. SQL usa banco efêmero por missão, credenciais únicas e statements permitidos. HTML/CSS usa iframe sandbox no preview e validação DOM/CSS separada.

O app envia apenas um `submission_id`; o runner não recebe credenciais Supabase nem dados de outros usuários.
