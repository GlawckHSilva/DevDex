import { writeFileSync } from "node:fs";
import { join } from "node:path";
import initSqlJs from "sql.js";

const H = (slug, title, concept, example, rules) => ({ slug, title, concept, example, rules });
const C = (slug, title, concept, selector, declarations) => ({ slug, title, concept, selector, declarations });
const J = (slug, title, concept, fn, starter, tests, explanation, example) => ({ slug, title, concept, fn, starter, tests, explanation, example });
const Q = (slug, title, concept, query, explanation) => ({ slug, title, concept, query, explanation });

const html = [
  [
    H("metadados-essenciais", "Metadados essenciais", "charset e viewport", '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>', [{ type: "element", tag: "meta", attributes: { charset: "UTF-8" } }, { type: "element", tag: "meta", attributes: { name: "viewport" } }]),
    H("paragrafos-organizados", "Parágrafos organizados", "parágrafos e fluxo de leitura", "<main><p>Aprenda.</p><p>Pratique.</p></main>", [{ type: "element", tag: "main" }, { type: "element", tag: "p", min: 2 }]),
    H("link-externo-seguro", "Link externo seguro", "target e rel", '<a href="https://developer.mozilla.org" target="_blank" rel="noopener">MDN</a>', [{ type: "element", tag: "a", attributes: { target: "_blank", rel: "noopener" } }]),
    H("pagina-apresentacao", "Página de apresentação", "estrutura HTML integrada", '<main><h1>DevDex</h1><p>Aprenda programação.</p><a href="#curso">Ver curso</a></main>', [{ type: "element", tag: "main" }, { type: "element", tag: "h1", textIncludes: "DevDex" }, { type: "element", tag: "p" }, { type: "element", tag: "a", attributes: { href: "#curso" } }]),
  ],
  [
    H("abreviacoes-html", "Abreviações", "abbr com significado", '<p>Aprenda <abbr title="HyperText Markup Language">HTML</abbr>.</p>', [{ type: "element", tag: "abbr", attributes: { title: "HyperText Markup Language" } }]),
    H("datas-html", "Datas legíveis", "time e datetime", '<time datetime="2026-08-27">27 de agosto</time>', [{ type: "element", tag: "time", attributes: { datetime: "2026-08-27" } }]),
    H("documentacao-textual", "Documentação textual", "texto técnico integrado", '<article><h2>Versão</h2><p><abbr title="Application Programming Interface">API</abbr> publicada em <time datetime="2026-08-27">agosto</time>.</p></article>', [{ type: "element", tag: "article" }, { type: "element", tag: "abbr" }, { type: "element", tag: "time" }]),
  ],
  [
    H("imagem-responsiva-html", "Imagem responsiva", "picture, source e img", '<picture><source media="(min-width: 800px)" srcset="hero-large.png"><img src="hero.png" alt="Herói DevDex"></picture>', [{ type: "element", tag: "picture" }, { type: "element", tag: "source" }, { type: "element", tag: "img", attributes: { alt: "Herói DevDex" } }]),
    H("citacao-com-fonte", "Citação com fonte", "blockquote e cite", '<blockquote cite="https://example.com/guia">Código legível importa.</blockquote>', [{ type: "element", tag: "blockquote", attributes: { cite: "https://example.com/guia" } }]),
    H("galeria-semantica", "Galeria semântica", "mídia com contexto", '<section><h2>Galeria</h2><figure><img src="mapa.png" alt="Mapa"><figcaption>Mapa da campanha</figcaption></figure></section>', [{ type: "element", tag: "section" }, { type: "element", tag: "figure" }, { type: "element", tag: "img", attributes: { alt: "Mapa" } }, { type: "element", tag: "figcaption" }]),
  ],
  [
    H("secoes-de-tabela", "Seções de tabela", "thead e tbody", "<table><thead><tr><th>Curso</th></tr></thead><tbody><tr><td>HTML</td></tr></tbody></table>", [{ type: "element", tag: "thead" }, { type: "element", tag: "tbody" }, { type: "element", tag: "th" }, { type: "element", tag: "td" }]),
    H("lista-de-sugestoes", "Lista de sugestões", "datalist ligado ao input", '<label for="stack">Stack</label><input id="stack" list="stacks"><datalist id="stacks"><option value="Web"></datalist>', [{ type: "element", tag: "input", attributes: { list: "stacks" } }, { type: "element", tag: "datalist", attributes: { id: "stacks" } }]),
    H("cadastro-estruturado", "Cadastro estruturado", "dados e controles integrados", '<form><fieldset><legend>Perfil</legend><label for="nome">Nome</label><input id="nome" required><button>Salvar</button></fieldset></form>', [{ type: "element", tag: "form" }, { type: "element", tag: "fieldset" }, { type: "element", tag: "legend" }, { type: "element", tag: "label" }, { type: "element", tag: "input", attributes: { required: "" } }, { type: "element", tag: "button" }]),
  ],
  [
    H("progresso-nativo", "Progresso nativo", "progress com limite", '<label for="curso">Curso</label><progress id="curso" value="6" max="8">6 de 8</progress>', [{ type: "element", tag: "progress", attributes: { max: "8" } }]),
    H("medicao-html", "Medição semântica", "meter com faixa", '<meter min="0" max="100" value="75">75%</meter>', [{ type: "element", tag: "meter", attributes: { min: "0", max: "100" } }]),
    H("painel-de-status-html", "Painel de status", "elementos interativos integrados", '<section><h2>Progresso</h2><progress value="6" max="8">6/8</progress><details><summary>Detalhes</summary><p>Continue praticando.</p></details></section>', [{ type: "element", tag: "section" }, { type: "element", tag: "progress", attributes: { max: "8" } }, { type: "element", tag: "details" }, { type: "element", tag: "summary" }]),
  ],
  [
    H("descricao-associada", "Descrição associada", "aria-describedby", '<label for="senha">Senha</label><input id="senha" aria-describedby="ajuda"><p id="ajuda">Use oito caracteres.</p>', [{ type: "element", tag: "input", attributes: { "aria-describedby": "ajuda" } }, { type: "element", tag: "p", attributes: { id: "ajuda" } }]),
    H("auditoria-final-html", "Auditoria final de HTML", "semântica e acessibilidade profissionais", '<main id="conteudo"><h1>DevDex</h1><label for="busca">Buscar</label><input id="busca" aria-describedby="dica"><p id="dica">Digite uma tecnologia.</p><output aria-live="polite">Pronto</output></main>', [{ type: "element", tag: "main", attributes: { id: "conteudo" } }, { type: "element", tag: "h1" }, { type: "element", tag: "label" }, { type: "element", tag: "input", attributes: { "aria-describedby": "dica" } }, { type: "element", tag: "output", attributes: { "aria-live": "polite" } }]),
  ],
];

const css = [
  [
    C("seletor-de-tipo", "Seletores de tipo", "seletores fundamentais", "body", { color: "#e2e8f0", "background-color": "#020617" }),
    C("seletor-de-classe", "Seletores de classe", "classes reutilizáveis", ".card", { padding: "16px", "border-radius": "12px" }),
    C("heranca-css", "Herança", "propriedades herdáveis", ".page", { color: "#e2e8f0", "font-family": "system-ui" }),
    C("fundamentos-visuais", "Fundamentos visuais", "seletores, contraste e espaço", ".card", { color: "#e2e8f0", "background-color": "#111827", padding: "24px", "border-radius": "12px" }),
  ],
  [
    C("margem-centralizada", "Centralização", "margin inline auto", ".container", { width: "90%", margin: "0 auto" }),
    C("imagem-fluida-css", "Imagens fluidas", "max-width e height", "img", { "max-width": "100%", height: "auto" }),
    C("caixa-profissional", "Caixa profissional", "dimensionamento integrado", ".painel", { width: "90%", "max-width": "960px", padding: "24px", overflow: "auto" }),
  ],
  [
    C("pseudo-elemento", "Pseudo-elementos", "conteúdo decorativo", ".badge::before", { content: '"✦"', color: "#22d3ee" }),
    C("fundo-dimensionado", "Fundos dimensionados", "background-size e position", ".hero", { "background-size": "cover", "background-position": "center" }),
    C("componente-interativo", "Componente interativo", "estados e feedback", ".button", { cursor: "pointer", transition: "transform .2s ease", "border-radius": "8px" }),
  ],
  [
    C("flex-em-coluna", "Fluxo em coluna", "flex-direction", ".sidebar", { display: "flex", "flex-direction": "column", gap: "12px" }),
    C("ordem-flexivel", "Ordem flexível", "order", ".featured", { order: "-1" }),
    C("layout-aplicacao", "Layout de aplicação", "Grid e Flex combinados", ".layout", { display: "grid", "grid-template-columns": "240px 1fr", gap: "24px" }),
  ],
  [
    C("rolagem-suave", "Rolagem suave", "scroll-behavior", "html", { "scroll-behavior": "smooth" }),
    C("midia-recortada", "Mídia recortada", "object-fit", ".preview", { "aspect-ratio": "16/9", "object-fit": "cover" }),
    C("movimento-controlado", "Movimento controlado", "transform e transition", ".badge", { transition: "transform .2s ease", transform: "translateY(-4px) scale(1.05)" }),
  ],
  [
    C("esquema-de-cores", "Esquema de cores", "color-scheme", ":root", { "color-scheme": "dark", "--accent": "#22d3ee" }),
    C("sistema-visual-final", "Sistema visual final", "tokens e componente profissional", ".card", { display: "grid", gap: "16px", padding: "24px", color: "#e2e8f0", "background-color": "#0f172a", "border-radius": "16px" }),
  ],
];

const js = [
  [
    J("operacoes-basicas", "Operações básicas", "operadores aritméticos", "calcularOperacoes", "function calcularOperacoes(a, b) {\n  // retorne soma e produto\n}", [[ [2, 3], { soma: 5, produto: 6 } ], [ [0, 5], { soma: 5, produto: 0 } ]], "Operadores transformam valores e objetos agrupam resultados relacionados.", "return { soma: a + b, produto: a * b };"),
    J("classificar-numero", "Decisões completas", "if, else if e else", "classificarNumero", "function classificarNumero(numero) {\n  // retorne positivo, negativo ou zero\n}", [[ [4], "positivo" ], [ [-2], "negativo" ], [ [0], "zero" ]], "Condições ordenadas permitem tratar caminhos mutuamente exclusivos.", "if (n > 0) return 'positivo';"),
    J("resumo-numerico", "Fundamentos integrados", "variáveis, repetição e condição", "resumirNumeros", "function resumirNumeros(valores) {\n  // retorne soma e quantidade de positivos\n}", [[ [[-1, 2, 3]], { soma: 4, positivos: 2 } ], [ [[]], { soma: 0, positivos: 0 } ]], "Percorra uma vez e acumule somente os indicadores necessários.", "for (const valor of valores) { soma += valor; if (valor > 0) positivos++; }"),
  ],
  [
    J("filtrar-ativos", "Filtragem", "Array.filter", "filtrarAtivos", "function filtrarAtivos(itens) {\n  // mantenha apenas ativos\n}", [[ [[{ id: 1, ativo: true }, { id: 2, ativo: false }]], [{ id: 1, ativo: true }] ], [ [[]], [] ]], "filter cria uma lista somente com itens aprovados pelo predicado.", "return itens.filter(item => item.ativo);"),
    J("algum-invalido", "Verificação parcial", "Array.some", "temInvalido", "function temInvalido(valores) {\n  // inválido é valor menor que zero\n}", [[ [[1, -1, 3]], true ], [ [[0, 2]], false ]], "some encerra quando encontra o primeiro item correspondente.", "return valores.some(valor => valor < 0);"),
    J("pipeline-colecao", "Pipeline de coleção", "filter, map e join", "listarAprovados", "function listarAprovados(alunos) {\n  // nomes com nota >= 7, em maiúsculas e separados por vírgula\n}", [[ [[{ nome: "Ana", nota: 8 }, { nome: "Bia", nota: 6 }, { nome: "Caio", nota: 9 }]], "ANA, CAIO" ], [ [[]], "" ]], "Encadeie transformações pequenas na ordem em que os dados mudam.", "alunos.filter(a => a.nota >= 7).map(a => a.nome.toUpperCase()).join(', ');"),
  ],
  [
    J("indexar-por-id", "Índice por identificador", "objetos como índice", "indexarPorId", "function indexarPorId(itens) {\n  // use o id como chave\n}", [[ [[{ id: 1, nome: "A" }, { id: 2, nome: "B" }]], { "1": { id: 1, nome: "A" }, "2": { id: 2, nome: "B" } } ], [ [[]], {} ]], "Um índice evita buscas repetidas quando o acesso é feito por identificador.", "for (const item of itens) indice[item.id] = item;"),
    J("somar-propriedades", "Valores de objeto", "Object.values", "somarValores", "function somarValores(objeto) {\n  // some apenas valores numéricos\n}", [[ [{ a: 2, b: 3 }], 5 ], [ [{ a: 1, nome: "x" }], 1 ]], "Object.values expõe os valores para filtragem e redução.", "Object.values(objeto).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);"),
    J("catalogo-indexado", "Catálogo indexado", "normalização e indexação", "criarCatalogo", "function criarCatalogo(itens) {\n  // ignore itens sem id e indexe os demais\n}", [[ [[{ id: "a", nome: "A" }, { nome: "X" }]], { a: { id: "a", nome: "A" } } ], [ [[]], {} ]], "Valide antes de indexar para manter o contrato da estrutura resultante.", "if (item.id != null) catalogo[item.id] = item;"),
  ],
  [
    J("intercalar-listas", "Intercalação", "combinação de arrays", "intercalar", "function intercalar(a, b) {\n  // alterne os itens enquanto existirem\n}", [[ [[1, 3], [2, 4]], [1, 2, 3, 4] ], [ [[1], [2, 3]], [1, 2, 3] ]], "Use o maior comprimento e adicione somente posições existentes.", "for (let i = 0; i < Math.max(a.length, b.length); i++) { if (i < a.length) saida.push(a[i]); }"),
    J("top-valores", "Maiores valores", "ordenação e recorte", "maioresValores", "function maioresValores(valores, limite) {\n  // ordem decrescente sem alterar a entrada\n}", [[ [[3, 1, 5, 2], 2], [5, 3] ], [ [[1], 3], [1] ]], "Copie, ordene e recorte para preservar a entrada.", "return [...valores].sort((a, b) => b - a).slice(0, limite);"),
    J("relatorio-ranking", "Relatório de ranking", "ordenação, projeção e posição", "criarRanking", "function criarRanking(jogadores) {\n  // retorne [{ posicao, nome, pontos }]\n}", [[ [[{ nome: "A", pontos: 2 }, { nome: "B", pontos: 5 }]], [{ posicao: 1, nome: "B", pontos: 5 }, { posicao: 2, nome: "A", pontos: 2 }] ], [ [[]], [] ]], "Ordene uma cópia antes de projetar a posição de cada registro.", "[...jogadores].sort((a,b) => b.pontos-a.pontos).map((j,i) => ({ posicao:i+1, ...j }));"),
  ],
  [
    J("json-seguro", "JSON seguro", "try e catch", "lerJson", "function lerJson(texto) {\n  // retorne null quando for inválido\n}", [[ ['{"ok":true}'], { ok: true } ], [ ["{"], null ]], "Exceções de entrada devem ser convertidas no contrato esperado pela função.", "try { return JSON.parse(texto); } catch { return null; }"),
    J("parametros-url", "Parâmetros de URL", "serialização de dados", "criarQuery", "function criarQuery(parametros) {\n  // encode chave e valor e una com &\n}", [[ [{ busca: "html css", pagina: 2 }], "busca=html%20css&pagina=2" ], [ [{}], "" ]], "Object.entries e encodeURIComponent produzem uma query previsível.", "Object.entries(parametros).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');"),
    J("processar-entrada", "Processamento robusto", "parse, validação e projeção", "processarEntrada", "function processarEntrada(texto) {\n  // aceite JSON com nome e idade adulta; caso contrário retorne null\n}", [[ ['{"nome":"Ada","idade":30}'], { nome: "Ada", idade: 30 } ], [ ['{"nome":"A","idade":15}'], null ], [ ["inválido"], null ]], "Separe leitura, validação e saída para impedir dados inconsistentes.", "const dado = JSON.parse(texto); if (!dado.nome || dado.idade < 18) return null;"),
  ],
  [
    J("diferenca-de-ids", "Diferença de coleções", "Set para comparação", "idsRemovidos", "function idsRemovidos(antes, depois) {\n  // ids que não existem mais\n}", [[ [[{ id: 1 }, { id: 2 }], [{ id: 2 }]], [1] ], [ [[], [{ id: 1 }]], [] ]], "Um Set torna a consulta de existência direta e eficiente.", "const atuais = new Set(depois.map(x => x.id)); return antes.filter(x => !atuais.has(x.id)).map(x => x.id);"),
    J("media-movel", "Média móvel", "janela deslizante", "mediaMovel", "function mediaMovel(valores, janela) {\n  // médias das janelas completas\n}", [[ [[1, 2, 3, 4], 2], [1.5, 2.5, 3.5] ], [ [[2, 4], 3], [] ]], "Calcule cada intervalo completo e avance uma posição por vez.", "for (let i = 0; i <= valores.length - janela; i++) saida.push(valores.slice(i, i + janela).reduce((a,b)=>a+b,0)/janela);"),
    J("painel-analitico", "Painel analítico", "pipeline profissional de dados", "criarResumo", "function criarResumo(eventos) {\n  // retorne total, ativos únicos e média por evento\n}", [[ [[{ usuario: "a", valor: 10 }, { usuario: "b", valor: 20 }, { usuario: "a", valor: 30 }]], { total: 60, usuarios: 2, media: 20 } ], [ [[]], { total: 0, usuarios: 0, media: 0 } ]], "Agregue valores e identidades em uma passagem, mantendo o caso vazio explícito.", "const total = eventos.reduce((s,e)=>s+e.valor,0); return { total, usuarios:new Set(eventos.map(e=>e.usuario)).size, media:eventos.length ? total/eventos.length : 0 };"),
  ],
];

const sql = [
  [
    Q("sql-coluna-calculada", "Coluna calculada", "expressões no SELECT", "SELECT NOME,PRECO,ROUND(PRECO*0.9,2) AS PROMOCIONAL FROM PRODUTOS WHERE ATIVO=1 ORDER BY ID", "Expressões calculam novos valores sem alterar os dados armazenados."),
    Q("sql-catalogo-basico", "Catálogo básico", "seleção, filtro e ordenação", "SELECT ID,NOME,PRECO AS VALOR FROM PRODUTOS WHERE ATIVO=1 AND PRECO>=80 ORDER BY PRECO,NOME", "Combine projeção, alias, filtro e ordenação em uma consulta legível."),
  ],
  [
    Q("sql-offset", "Paginação com OFFSET", "LIMIT e OFFSET", "SELECT ID,NOME FROM PRODUTOS ORDER BY ID LIMIT 2 OFFSET 2", "OFFSET ignora as primeiras linhas após a ordenação definida."),
    Q("sql-filtro-profissional", "Filtro profissional", "condições, nulos e paginação", "SELECT ID,NOME,COALESCE(ESTOQUE,0) AS ESTOQUE FROM PRODUTOS WHERE (ATIVO=1 AND PRECO>=80) OR CATEGORIA_ID IS NULL ORDER BY ID LIMIT 5", "Agrupe condições e trate nulos para produzir um resultado previsível."),
  ],
  [
    Q("sql-min-max", "Extremos", "MIN e MAX", "SELECT MIN(PRECO) AS MENOR,MAX(PRECO) AS MAIOR FROM PRODUTOS WHERE ATIVO=1", "MIN e MAX resumem os limites de uma coleção numérica."),
    Q("sql-resumo-categorias", "Resumo por categoria", "agregações por grupo", "SELECT CATEGORIA_ID,COUNT(*) AS PRODUTOS,ROUND(AVG(PRECO),2) AS MEDIA,MAX(PRECO) AS MAIOR FROM PRODUTOS WHERE ATIVO=1 GROUP BY CATEGORIA_ID ORDER BY CATEGORIA_ID", "Combine agregações para gerar indicadores por grupo."),
  ],
  [
    Q("sql-nullif", "Divisão protegida", "NULLIF", "SELECT ID,TOTAL,ROUND(TOTAL/NULLIF(QUANTIDADE,0),2) AS UNITARIO FROM VENDAS ORDER BY ID", "NULLIF evita divisão por zero transformando o divisor inválido em NULL."),
    Q("sql-relacoes-seguras", "Relações seguras", "JOIN, CASE e subconsulta", "SELECT P.NOME,COALESCE(C.NOME,'SEM CATEGORIA') AS CATEGORIA,CASE WHEN P.PRECO>(SELECT AVG(PRECO) FROM PRODUTOS) THEN 'ACIMA' ELSE 'PADRAO' END AS FAIXA FROM PRODUTOS P LEFT JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID ORDER BY P.ID", "Relacione entidades, trate ausências e compare com um indicador global."),
  ],
  [
    Q("sql-rank", "Ranking com janela", "RANK", "SELECT NOME,PRECO,RANK() OVER (ORDER BY PRECO DESC) AS POSICAO FROM PRODUTOS ORDER BY POSICAO,NOME", "RANK atribui posições preservando empates."),
    Q("sql-analise-por-categoria", "Análise por categoria", "CTE, JOIN e janela", "WITH BASE AS (SELECT P.NOME,C.NOME AS CATEGORIA,P.PRECO FROM PRODUTOS P LEFT JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID WHERE P.ATIVO=1) SELECT NOME,CATEGORIA,PRECO,RANK() OVER (PARTITION BY CATEGORIA ORDER BY PRECO DESC) AS POSICAO FROM BASE ORDER BY CATEGORIA,POSICAO", "Uma CTE prepara os dados e a janela calcula rankings independentes."),
  ],
  [
    Q("sql-agregacao-condicional", "Agregação condicional", "SUM com CASE", "SELECT COUNT(*) AS TOTAL,SUM(CASE WHEN ATIVO=1 THEN 1 ELSE 0 END) AS ATIVOS FROM PRODUTOS", "CASE dentro de SUM conta subconjuntos sem consultas separadas."),
    Q("sql-anti-join", "Registros sem relação", "NOT EXISTS", "SELECT P.ID,P.NOME FROM PRODUTOS P WHERE NOT EXISTS (SELECT 1 FROM VENDAS V WHERE V.PRODUTO_ID=P.ID) ORDER BY P.ID", "NOT EXISTS encontra registros que não possuem correspondência."),
    Q("sql-receita-categoria", "Receita por categoria", "múltiplos JOINs e SUM", "SELECT C.NOME AS CATEGORIA,SUM(V.TOTAL) AS RECEITA FROM VENDAS V JOIN PRODUTOS P ON P.ID=V.PRODUTO_ID JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID GROUP BY C.ID,C.NOME ORDER BY RECEITA DESC", "Relatórios cruzam entidades antes de agregar seus indicadores."),
    Q("sql-percentual-receita", "Percentual de receita", "agregação e janela", "SELECT PRODUTO_ID,SUM(TOTAL) AS RECEITA,ROUND(100.0*SUM(TOTAL)/SUM(SUM(TOTAL)) OVER (),2) AS PERCENTUAL FROM VENDAS GROUP BY PRODUTO_ID ORDER BY RECEITA DESC", "Uma janela sobre agregações calcula participação no total."),
    Q("sql-total-acumulado", "Total acumulado", "SUM OVER ordenado", "SELECT ID,DATA,TOTAL,SUM(TOTAL) OVER (ORDER BY DATA,ID) AS ACUMULADO FROM VENDAS ORDER BY DATA,ID", "A janela ordenada mantém as linhas enquanto acumula valores."),
    Q("sql-comparacao-anterior", "Comparação anterior", "LAG", "SELECT ID,DATA,TOTAL,LAG(TOTAL) OVER (ORDER BY DATA,ID) AS ANTERIOR FROM VENDAS ORDER BY DATA,ID", "LAG acessa o valor da linha anterior sem autojunção."),
    Q("sql-top-por-categoria", "Top por categoria", "ROW_NUMBER particionado", "WITH RANKING AS (SELECT P.NOME,C.NOME AS CATEGORIA,P.PRECO,ROW_NUMBER() OVER (PARTITION BY C.ID ORDER BY P.PRECO DESC) AS POSICAO FROM PRODUTOS P JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID WHERE P.ATIVO=1) SELECT NOME,CATEGORIA,PRECO FROM RANKING WHERE POSICAO=1 ORDER BY CATEGORIA", "Numere dentro de cada categoria e filtre a primeira posição."),
    Q("sql-dashboard-final", "Dashboard profissional", "CTEs, agregações e JOINs", "WITH VENDAS_PRODUTO AS (SELECT PRODUTO_ID,SUM(QUANTIDADE) AS UNIDADES,SUM(TOTAL) AS RECEITA FROM VENDAS GROUP BY PRODUTO_ID), RANKING AS (SELECT PRODUTO_ID,UNIDADES,RECEITA,RANK() OVER (ORDER BY RECEITA DESC) AS POSICAO FROM VENDAS_PRODUTO) SELECT P.NOME,R.UNIDADES,R.RECEITA,R.POSICAO FROM RANKING R JOIN PRODUTOS P ON P.ID=R.PRODUTO_ID ORDER BY R.POSICAO,P.NOME", "Separe o cálculo em etapas nomeadas e entregue indicadores auditáveis."),
  ],
];

const courses = [
  { key: "html", pathId: 3, runtime: "html", ref: ["MDN — HTML", "https://developer.mozilla.org/en-US/docs/Web/HTML"], zones: [[1,[12,13,14,15],20],[5,[20,21,22,23,24],25],[6,[25,26,27,28,29],30],[7,[30,31,32,33,34],35],[8,[35,36,37,38,39],40],[9,[40,41,42,43,44,45],null]], topics: html },
  { key: "css", pathId: 4, runtime: "css", ref: ["MDN — CSS", "https://developer.mozilla.org/en-US/docs/Web/CSS"], zones: [[2,[16,17,18,19],46],[10,[46,47,48,49,50],51],[11,[51,52,53,54,55],56],[12,[56,57,58,59,60],61],[13,[61,62,63,64,65],66],[14,[66,67,68,69,70,71],null]], topics: css },
  { key: "javascript", pathId: 1, runtime: "javascript", ref: ["MDN — JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"], zones: [[3,[1,2,3,4,5],72],[15,[72,73,74,75,76],77],[16,[77,78,79,80,81],82],[17,[82,83,84,85,86],87],[18,[87,88,89,90,91],92],[19,[92,93,94,95,96],null]], topics: js },
  { key: "sql", pathId: 2, runtime: "sqlite", ref: ["SQLite — SQL", "https://sqlite.org/lang.html"], zones: [[4,[6,7,8,9,10,11],97],[20,[97,98,99,100,101,102],103],[21,[103,104,105,106,107,108],109],[22,[109,110,111,112,113,114],115],[23,[115,116,117,118,119,120],null],[24,[],null]], topics: sql },
];

const sqlSchema = `CREATE TABLE CATEGORIAS (ID INTEGER PRIMARY KEY, NOME TEXT NOT NULL);\nCREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, NOME TEXT NOT NULL, CATEGORIA_ID INTEGER, PRECO REAL NOT NULL, ATIVO INTEGER NOT NULL, ESTOQUE INTEGER);\nCREATE TABLE VENDAS (ID INTEGER PRIMARY KEY, PRODUTO_ID INTEGER NOT NULL, QUANTIDADE INTEGER NOT NULL, TOTAL REAL NOT NULL, DATA TEXT NOT NULL);`;
const sqlSeed = `INSERT INTO CATEGORIAS VALUES (1,'Web'),(2,'Dados'),(3,'Mobile');\nINSERT INTO PRODUTOS VALUES (1,'Curso HTML',1,80,1,12),(2,'Curso CSS',1,90,1,8),(3,'Curso SQL',2,120,1,5),(4,'Curso Legado',NULL,40,0,NULL),(5,'Curso JS',1,150,1,3);\nINSERT INTO VENDAS VALUES (1,1,2,160,'2026-01-10'),(2,3,1,120,'2026-01-12'),(3,5,2,300,'2026-02-01'),(4,1,1,80,'2026-02-03'),(5,3,3,360,'2026-02-05');`;
const esc = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const values = (rows) => rows.map((row) => `(${row.map((value) => typeof value === "number" ? value : value === null ? "NULL" : esc(value)).join(",")})`).join(",\n");
const statements = [];
let missionId = 121;

statements.push("INSERT OR IGNORE INTO campaign_zones (id,campaign_id,slug,title,story_intro,story_outro,sort_order,status) VALUES (24,4,'sql-zona-6','Central de Inteligência','Transforme consultas avançadas em análises profissionais e auditáveis.','A inteligência dos dados foi restaurada.',6,'published');");

const SQL = await initSqlJs({ locateFile: (file) => join(process.cwd(), "node_modules", "sql.js", "dist", file) });
for (const course of courses) {
  const newMissions = [];
  const sequences = [];
  course.zones.forEach(([zoneId, existing, nextFirst], zoneIndex) => {
    const additions = course.topics[zoneIndex].map((topic) => ({ id: missionId++, topic, zoneId }));
    newMissions.push(...additions);
    sequences.push({ zoneId, existing, additions, nextFirst, all: [...existing, ...additions.map((item) => item.id)] });
  });

  statements.push(`INSERT OR IGNORE INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES\n${values(newMissions.map(({ id, topic }, index) => [id, course.pathId, topic.slug, topic.title, topic.concept, 0, 31 + index, "published"]))};`);
  statements.push(`INSERT OR IGNORE INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug) VALUES\n${values(newMissions.map(({ id, topic }, index) => [id,id,topic.slug,topic.title,`Aula e prática: ${topic.concept}.`,course.runtime === "javascript" ? `Implemente ${topic.fn} e passe todos os testes.` : course.runtime === "sqlite" ? `Escreva a consulta solicitada usando ${topic.concept}.` : course.runtime === "html" ? `Construa a estrutura usando ${topic.concept}.` : `Aplique ${topic.concept}.`,course.runtime === "javascript" ? topic.starter : course.runtime === "sqlite" ? `-- ${topic.title}\nSELECT` : course.runtime === "html" ? "<!-- Escreva a estrutura aqui -->" : `/* ${topic.title} */`,course.runtime === "javascript" ? topic.fn : "","{}",course.runtime,course.runtime === "javascript" ? "javascript-quickjs-1" : course.runtime === "sqlite" ? "sqlite-wasm-1" : "web-parser-1",index < 6 ? "medium" : "hard",1,"published",index < 6 ? 140 : 180,31 + index,null]))};`);
  statements.push(...newMissions.map(({ id, topic, zoneId }) => `INSERT OR IGNORE INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order) SELECT ${id},${zoneId},slug,${esc(`Bug de ${topic.title}`)},'enemy',${id},${esc(`Revise a aula sobre ${topic.concept}.`)},${esc(`A corrupção domina ${topic.concept}.`)},'Aplique o conceito explicado para vencer.','','',8 FROM campaign_zones WHERE id=${zoneId};`));

  if (course.runtime === "javascript") statements.push(`INSERT OR IGNORE INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) VALUES\n${values(newMissions.flatMap(({ id, topic }) => topic.tests.map(([input, expected], index) => [id,`Teste ${index + 1}`,JSON.stringify(input),JSON.stringify(expected),1,index + 1])))};`);
  if (course.runtime === "html") statements.push(`INSERT OR IGNORE INTO web_mission_configs (mission_id,document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length) VALUES\n${values(newMissions.map(({ id, topic }) => [id,"html","web-parser-1","<!-- Escreva a estrutura aqui -->","","body{font-family:system-ui;padding:32px;color:#e2e8f0;background:#0f172a}",JSON.stringify(topic.rules),8000]))};`);
  if (course.runtime === "css") statements.push(`INSERT OR IGNORE INTO web_mission_configs (mission_id,document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length) VALUES\n${values(newMissions.map(({ id, topic }) => [id,"css","web-parser-1",`/* Estilize ${topic.selector} */`,`<main class="page app dashboard container layout"><aside class="sidebar"></aside><section><article class="card featured painel hero preview badge"><h1>DevDex</h1><button class="button">Continuar</button></article></section></main>`,"",JSON.stringify([{ type: "style", selector: topic.selector, declarations: topic.declarations }]),8000]))};`);
  if (course.runtime === "sqlite") statements.push(`INSERT OR IGNORE INTO sql_mission_configs (mission_id,dialect,runtime_version,schema_sql,seed_sql,starter_sql,expected_result_json,table_schema_json,table_preview_json,max_rows,timeout_ms,max_statements) VALUES\n${values(newMissions.map(({ id, topic }) => {
    const db = new SQL.Database(); db.run(sqlSchema); db.run(sqlSeed); const result = db.exec(topic.query)[0]; db.close();
    return [id,"sqlite","sqlite-wasm-1",sqlSchema,sqlSeed,`-- ${topic.title}\nSELECT`,JSON.stringify({ columns: result?.columns ?? [], rows: result?.values ?? [], orderMatters: /ORDER BY/i.test(topic.query) }),JSON.stringify([{ name: "PRODUTOS", columns: [{ name: "ID", type: "INTEGER", primaryKey: true }, { name: "NOME", type: "TEXT" }, { name: "PRECO", type: "REAL" }] }, { name: "VENDAS", columns: [{ name: "ID", type: "INTEGER", primaryKey: true }, { name: "PRODUTO_ID", type: "INTEGER" }, { name: "TOTAL", type: "REAL" }] }]),JSON.stringify({ columns: ["ID","NOME","PRECO"], rows: [[1,"Curso HTML",80],[2,"Curso CSS",90],[3,"Curso SQL",120]] }),100,350,1];
  }))};`);

  statements.push(`INSERT OR IGNORE INTO mission_study_materials (mission_id,title,introduction,explanation,example_code,example_explanation,key_points_json,common_mistakes_json,references_json) VALUES\n${values(newMissions.map(({ id, topic }) => [id,topic.title,`Antes da batalha, entenda ${topic.concept}.`,topic.explanation ?? `${topic.concept} integra esta etapa do aprendizado de ${course.key.toUpperCase()}.`,topic.example ?? topic.query ?? (course.runtime === "html" ? topic.example : `${topic.selector} { ${Object.entries(topic.declarations).map(([key,value]) => `${key}: ${value};`).join(" ")} }`),"O exemplo ensina o conceito sem entregar a solução da batalha.",JSON.stringify([`Entenda ${topic.concept}`,"Aplique o conceito no contexto pedido","Valide o resultado antes de atacar"]),JSON.stringify(["Ignorar a aula explicativa","Copiar sem adaptar ao objetivo"]),JSON.stringify([{ label: course.ref[0], url: course.ref[1] }])]))};`);

  const order = sequences.flatMap((zone) => zone.all);
  statements.push(`DELETE FROM mission_prerequisites WHERE mission_id IN (${order.join(",")});`);
  statements.push(`INSERT OR IGNORE INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES\n${values(order.slice(1).map((id, index) => [id, order[index]]))};`);
  statements.push(...order.map((id, index) => `UPDATE missions SET sort_order=${index + 1},next_mission_slug=${index + 1 < order.length ? `(SELECT slug FROM missions WHERE id=${order[index + 1]})` : "NULL"} WHERE id=${id};`));
  statements.push(...order.map((id, index) => `UPDATE skills SET sort_order=${index + 1} WHERE id=(SELECT skill_id FROM missions WHERE id=${id});`));
  for (const zone of sequences) {
    statements.push(...zone.all.map((id, index) => {
      const type = index === 7 ? "boss" : index === 6 ? "elite" : "enemy";
      const label = type === "boss" ? "Guardião" : type === "elite" ? "Elite" : "Bug";
      return `UPDATE mission_battle_configs SET zone_id=${zone.zoneId},sort_order=${index + 1},enemy_type='${type}',enemy_name='${label} de '||(SELECT title FROM missions WHERE id=${id}),boss_intro=${type === "boss" ? "'O guardião combina todos os conhecimentos desta zona.'" : "''"},boss_victory=${type === "boss" ? "'Zona restaurada. A próxima etapa foi liberada.'" : "''"} WHERE mission_id=${id};`;
    }));
    statements.push(`UPDATE campaign_zones SET boss_mission_id=${zone.all[7]} WHERE id=${zone.zoneId};`);
  }
}

statements.push("UPDATE learning_paths SET version=3,description=REPLACE(description,'30 aulas explicativas e 30 práticas','48 aulas explicativas e 48 práticas') WHERE id IN (1,2,3,4);");
statements.push("PRAGMA optimize;");
writeFileSync(join(process.cwd(), "drizzle", "0011_eight_missions_per_zone.sql"), `-- Generated by scripts/generate-eight-missions-per-zone.mjs\n${statements.join("\n--> statement-breakpoint\n")}\n`);
console.log(`Generated ${missionId - 121} missions: 6 zones × 8 missions for 4 courses.`);
