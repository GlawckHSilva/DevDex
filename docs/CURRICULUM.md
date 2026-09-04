# Currículo

Conteúdo nunca fica acoplado a componentes. A interface recebe uma versão publicada de `learning_paths`, com skills ordenadas e pré-requisitos.

## Beta atual

- GitHub: conta, Git local, commits, branches, pull requests, Actions e governança.
- HTML: semântica, estrutura, formulários, acessibilidade e páginas profissionais.
- CSS: seletores, layout, responsividade, componentes e polimento visual.
- JavaScript: fundamentos, DOM, assíncrono, dados, testes e arquitetura de front-end.
- SQL Fundamentals · SQLite: leitura, filtros, joins, agregações, modelagem e análise.
- Python: sintaxe, coleções, funções, arquivos, automação, APIs e código profissional.

## Publicação

`draft → review → published → deprecated`. Uma versão publicada é imutável; correções geram nova versão. O progresso conserva a referência curricular estudada.

## Domínio

0 nunca estudado; 25 introduzido; 50 praticando; 75 consistente; 100 dominado. Acertos, erros, dificuldade, dicas e tempo desde a prática alimentam a atualização server-side.

## Biblioteca educacional

`educational_contents` é a camada de consulta sobre o currículo existente. Ela referencia tecnologia, trilha, zona, skill, aula, missão e projeto sem substituir essas entidades nem alterar XP ou desbloqueios. Exemplos, snippets e pré-requisitos usam tabelas próprias; favoritos e histórico permanecem isolados por usuário.

Evolução prevista, em etapas:

1. catálogo, busca, detalhes, snippets, favoritos e histórico;
2. quizzes e revisões espaçadas baseadas em conteúdo já concluído (implementado);
3. recomendações por pré-requisito e dificuldade real da batalha (implementado sem alterar XP);
4. editoria/versionamento para novas tecnologias sem condicionais na interface.

As revisões usam acertos, erros, tentativas de missão e tempo desde o último estudo. O intervalo cresce de 1 até 30 dias quando o aluno acerta e volta para 1 dia quando erra. Esse domínio de revisão é independente de conclusão, XP e desbloqueio das campanhas.
