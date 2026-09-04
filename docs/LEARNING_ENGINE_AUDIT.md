# Auditoria do Learning Engine

Atualizado em: 2026-09-04.

## Base existente

- XP, nível global, pontos de habilidade e árvore de habilidades em `profiles`, `level_up_history`, `skill_abilities` e `user_abilities`.
- Corações, regeneração, dicas globais, dicas por missão e desempenho em `user_resources`, `mission_hints`, `user_mission_hints` e `mission_performance`.
- Campanhas RPG, zonas, batalhas, elites e bosses versionados no D1.
- Runners para JavaScript, SQL, HTML/CSS, Python e GitHub.
- Biblioteca com 144 conteúdos, favoritos, histórico, quiz e revisão espaçada.
- Project Mode com projetos, etapas, arquivos, progresso, GitHub e revisão de implementação.
- Histórico de tentativas e métricas agregadas sem expor testes privados.

## Estruturas reutilizáveis

- `user_skill_progress.mastery` deve ser a base da Maestria, sem criar tabela paralela.
- `mission_performance`, `mission_attempt_history`, `user_content_reviews` e `battle_events` já fornecem sinais para cálculo de domínio.
- `getLibraryOverview` já monta fila de revisão e pode evoluir para revisão 2.0.
- `getDashboard`, `getCampaignSummaries` e `getProjectSummaries` podem alimentar a futura tela Hoje.
- `Project Mode` já separa progresso de projetos das missões e deve receber categorias sem duplicar entidades.

## Inconsistências corrigidas nesta fase

- Documentação ainda citava quatro campanhas e 19 missões, apesar de seis trilhas publicadas.
- Documentação de execução ignorava Python e GitHub.
- Status público usava parte dos números do banco, mas não expunha materiais, Biblioteca, corações e dicas configuráveis.
- Landing page tinha números promocionais fixos que poderiam divergir do currículo publicado.
- Mentor IA estava descrito como totalmente ausente, embora já exista revisão de projetos com IA configurável.

## Maestria consolidada

- `user_skill_progress.mastery` segue separado de XP e nível global.
- A fórmula única usa acertos, erros, tentativas, dicas, primeira tentativa, conclusão sem dicas, elites/bosses e revisão de conteúdos.
- Repetir atividades fáceis não aumenta domínio acima do teto de evidência.
- A página `/maestria` mostra estados Novo, Familiar, Competente, Proficiente e Dominado por tecnologia, região, módulo e conceito.

## Ordem de implementação

1. Correções de inconsistência e documentação. Concluído.
2. Maestria: fórmula única, estados de domínio e página dedicada. Concluído.
3. Revisão inteligente 2.0 usando maestria, erros recentes e tempo sem prática.
4. Tela Hoje com plano curto de estudo.
5. Ciclo pedagógico Material → Treino → Batalha → Prática → Revisão → Elite/Boss.
6. Novos formatos de desafio reutilizando progressão existente.
7. Project Mode guiado, semi-guiado e independente.
8. Caminhos Frontend, Backend, Full Stack e IA sem duplicar cursos.
9. Mentor IA geral com escada de ajuda e limites conectados às dicas.
