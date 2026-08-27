import { writeFileSync } from "node:fs";
import { join } from "node:path";
import initSqlJs from "sql.js";

const mdnHtml = "https://developer.mozilla.org/en-US/curriculum/core/semantic-html/";
const mdnCss = "https://developer.mozilla.org/en-US/curriculum/core/css-fundamentals/";
const mdnLayout = "https://developer.mozilla.org/en-US/curriculum/core/css-layout/";
const mdnJs = "https://developer.mozilla.org/en-US/curriculum/core/javascript-fundamentals/";
const sqliteDocs = "https://sqlite.org/lang.html";

const html = [
  ["documento-html", "Documento HTML", "Estrutura do documento", "html", { lang: "pt-BR" }, "Crie o elemento html com lang pt-BR.", "<html lang=\"pt-BR\"><body></body></html>"],
  ["hierarquia-titulos", "Hierarquia de títulos", "Títulos bem organizados", "h2", {}, "Crie um h2 chamado Recursos dentro de uma section.", "<section><h2>Recursos</h2></section>", [{ type: "element", tag: "section" }, { type: "element", tag: "h2", textIncludes: "Recursos" }]],
  ["texto-semantico", "Semântica de texto", "Ênfase com significado", "strong", {}, "Marque Atenção com strong e detalhes com em.", "<p><strong>Atenção</strong>: leia os <em>detalhes</em>.</p>", [{ type: "element", tag: "strong", textIncludes: "Atenção" }, { type: "element", tag: "em", textIncludes: "detalhes" }]],
  ["citacoes-codigo", "Citações e código", "Conteúdo técnico legível", "code", {}, "Use pre e code para mostrar npm test.", "<pre><code>npm test</code></pre>", [{ type: "element", tag: "pre" }, { type: "element", tag: "code", textIncludes: "npm test" }]],
  ["link-interno", "Links claros", "Navegação compreensível", "a", { href: "#guia" }, "Crie um link Guia para #guia.", "<a href=\"#guia\">Guia</a>"],
  ["imagem-acessivel", "Imagens acessíveis", "Texto alternativo", "img", { alt: "Diagrama da aplicação" }, "Crie uma imagem com alt Diagrama da aplicação.", "<img alt=\"Diagrama da aplicação\">"],
  ["figura-legenda", "Figuras e legendas", "Mídia com contexto", "figcaption", {}, "Crie figure com figcaption Arquitetura do sistema.", "<figure><img alt=\"Fluxo\"><figcaption>Arquitetura do sistema</figcaption></figure>", [{ type: "element", tag: "figure" }, { type: "element", tag: "figcaption", textIncludes: "Arquitetura do sistema" }]],
  ["lista-ordenada", "Listas ordenadas", "Sequências de passos", "ol", {}, "Crie uma ol com pelo menos três li.", "<ol><li>Planejar</li><li>Criar</li><li>Testar</li></ol>", [{ type: "element", tag: "ol" }, { type: "element", tag: "li", min: 3 }]],
  ["lista-descricao", "Listas de descrição", "Termos e definições", "dl", {}, "Crie uma dl com dt API e uma definição dd.", "<dl><dt>API</dt><dd>Interface entre sistemas</dd></dl>", [{ type: "element", tag: "dt", textIncludes: "API" }, { type: "element", tag: "dd" }]],
  ["artigo-secao", "Artigos e seções", "Estrutura editorial", "article", {}, "Crie article com header e section.", "<article><header><h2>Guia</h2></header><section>Conteúdo</section></article>", [{ type: "element", tag: "article" }, { type: "element", tag: "header" }, { type: "element", tag: "section" }]],
  ["landmarks", "Landmarks da página", "Regiões semânticas", "main", {}, "Crie header, nav, main e footer.", "<header></header><nav></nav><main></main><footer></footer>", [{ type: "element", tag: "header" }, { type: "element", tag: "nav" }, { type: "element", tag: "main" }, { type: "element", tag: "footer" }]],
  ["tabela-basica", "Tabelas de dados", "Linhas e colunas", "table", {}, "Crie table com duas linhas tr e duas células td.", "<table><tr><td>Nome</td></tr><tr><td>Ada</td></tr></table>", [{ type: "element", tag: "table" }, { type: "element", tag: "tr", min: 2 }, { type: "element", tag: "td", min: 2 }]],
  ["tabela-acessivel", "Tabelas acessíveis", "Cabeçalhos e legenda", "caption", {}, "Crie table com caption Relatório e th scope col.", "<table><caption>Relatório</caption><tr><th scope=\"col\">Mês</th></tr></table>", [{ type: "element", tag: "caption", textIncludes: "Relatório" }, { type: "element", tag: "th", attributes: { scope: "col" } }]],
  ["fieldset-legend", "Grupos de formulário", "Fieldset e legend", "fieldset", {}, "Agrupe opções em fieldset com legend Plano.", "<fieldset><legend>Plano</legend><label><input type=\"radio\">Pro</label></fieldset>", [{ type: "element", tag: "fieldset" }, { type: "element", tag: "legend", textIncludes: "Plano" }]],
  ["tipos-input", "Tipos de entrada", "Campos adequados aos dados", "input", { type: "number", min: "0" }, "Crie input number com min 0.", "<label for=\"qtd\">Quantidade</label><input id=\"qtd\" type=\"number\" min=\"0\">"],
  ["textarea-select", "Controles de escolha", "Textarea e select", "select", {}, "Crie textarea e select com duas option.", "<textarea></textarea><select><option>Web</option><option>Dados</option></select>", [{ type: "element", tag: "textarea" }, { type: "element", tag: "select" }, { type: "element", tag: "option", min: 2 }]],
  ["validacao-nativa", "Validação nativa", "Restrições úteis", "input", { type: "email", required: "", minlength: "6" }, "Crie input email obrigatório com minlength 6.", "<input type=\"email\" required minlength=\"6\">"],
  ["detalhes-progressivos", "Conteúdo expansível", "Details e summary", "details", {}, "Crie details com summary Ver detalhes.", "<details><summary>Ver detalhes</summary><p>Conteúdo</p></details>", [{ type: "element", tag: "details" }, { type: "element", tag: "summary", textIncludes: "Ver detalhes" }]],
  ["midia-nativa", "Áudio e vídeo", "Mídia com controles", "video", { controls: "" }, "Crie video com controls e texto alternativo.", "<video controls>Seu navegador não suporta vídeo.</video>"],
  ["dialogo-nativo", "Diálogos nativos", "Interação semântica", "dialog", { open: "" }, "Crie dialog aberto com título Confirmação.", "<dialog open><h2>Confirmação</h2></dialog>", [{ type: "element", tag: "dialog", attributes: { open: "" } }, { type: "element", tag: "h2", textIncludes: "Confirmação" }]],
  ["data-attributes", "Atributos de dados", "Metadados da interface", "article", { "data-status": "ativo" }, "Crie article com data-status ativo.", "<article data-status=\"ativo\">Projeto</article>"],
  ["skip-link", "Atalho de conteúdo", "Navegação por teclado", "a", { href: "#conteudo" }, "Crie link Pular para o conteúdo e main id conteudo.", "<a href=\"#conteudo\">Pular para o conteúdo</a><main id=\"conteudo\"></main>", [{ type: "element", tag: "a", textIncludes: "Pular para o conteúdo", attributes: { href: "#conteudo" } }, { type: "element", tag: "main", attributes: { id: "conteudo" } }]],
  ["status-acessivel", "Mensagens de status", "Atualizações anunciadas", "output", { "aria-live": "polite" }, "Crie output com aria-live polite.", "<output aria-live=\"polite\">Salvo</output>"],
  ["formulario-completo", "Formulário profissional", "Estrutura, validação e ação", "form", { method: "post" }, "Crie form post com label, input required e button submit.", "<form method=\"post\"><label for=\"nome\">Nome</label><input id=\"nome\" required><button type=\"submit\">Salvar</button></form>", [{ type: "element", tag: "form", attributes: { method: "post" } }, { type: "element", tag: "label", attributes: { for: "nome" } }, { type: "element", tag: "input", attributes: { id: "nome", required: "" } }, { type: "element", tag: "button", attributes: { type: "submit" } }]],
  ["pagina-semantica", "Página semântica completa", "Arquitetura HTML profissional", "main", {}, "Monte header, nav, main com article e footer.", "<header><nav></nav></header><main><article><h1>DevDex</h1></article></main><footer></footer>", [{ type: "element", tag: "header" }, { type: "element", tag: "nav" }, { type: "element", tag: "main" }, { type: "element", tag: "article" }, { type: "element", tag: "h1", textIncludes: "DevDex" }, { type: "element", tag: "footer" }]],
  ["auditoria-html", "Auditoria de acessibilidade", "Semântica aplicada", "button", { type: "button" }, "Crie nav rotulada, main e button real do tipo button.", "<nav aria-label=\"Principal\"></nav><main><button type=\"button\">Abrir</button></main>", [{ type: "element", tag: "nav", attributes: { "aria-label": "Principal" } }, { type: "element", tag: "main" }, { type: "element", tag: "button", attributes: { type: "button" } }]],
];

const css = [
  ["tipografia-base", "Tipografia", "font-family e line-height", "body", { "font-family": "system-ui", "line-height": "1.5" }],
  ["escala-rem", "Unidades relativas", "Tamanhos com rem", "h1", { "font-size": "2rem" }],
  ["largura-fluida", "Dimensionamento fluido", "width e max-width", ".container", { width: "90%", "max-width": "1200px" }],
  ["box-sizing", "Box model previsível", "box-sizing border-box", "*", { "box-sizing": "border-box" }],
  ["overflow-seguro", "Controle de overflow", "overflow auto", ".painel", { overflow: "auto", "max-height": "320px" }],
  ["fundo-gradiente", "Fundos", "Gradientes sem imagem externa", ".hero", { background: "linear-gradient(135deg,#0f172a,#312e81)" }],
  ["sombra-elevacao", "Elevação", "box-shadow", ".card", { "box-shadow": "0 8px 24px #0003" }],
  ["estado-hover", "Estados interativos", "Pseudo-classe hover", ".button:hover", { transform: "translateY(-2px)" }],
  ["foco-visivel", "Foco acessível", "focus-visible", ".button:focus-visible", { outline: "3px solid #22d3ee" }],
  ["flex-alinhamento", "Alinhamento Flex", "justify e align", ".toolbar", { display: "flex", "justify-content": "space-between", "align-items": "center" }],
  ["flex-crescimento", "Itens flexíveis", "flex grow", ".content", { flex: "1 1 320px" }],
  ["grid-colunas", "CSS Grid", "Colunas fr", ".grid", { display: "grid", "grid-template-columns": "repeat(3,1fr)", gap: "16px" }],
  ["grid-responsivo", "Grid responsivo", "minmax e auto-fit", ".grid", { display: "grid", "grid-template-columns": "repeat(auto-fit,minmax(220px,1fr))" }],
  ["grid-areas", "Áreas de Grid", "grid-template-areas", ".layout", { display: "grid", "grid-template-areas": "\"header header\" \"nav main\"" }],
  ["posicao-sticky", "Posicionamento", "position sticky", ".menu", { position: "sticky", top: "0" }],
  ["aspect-ratio", "Proporção de mídia", "aspect-ratio", ".preview", { "aspect-ratio": "16/9", "object-fit": "cover" }],
  ["transicao", "Transições", "Mudança suave", ".button", { transition: "transform .2s ease,background-color .2s ease" }],
  ["transformacao", "Transformações", "translate e scale", ".badge", { transform: "translateY(-4px) scale(1.05)" }],
  ["variaveis-css", "Custom properties", "Tokens de design", ":root", { "--accent": "#22d3ee", "--space": "16px" }],
  ["calc-clamp", "Funções de tamanho", "clamp responsivo", "h1", { "font-size": "clamp(2rem,5vw,4rem)" }],
  ["seletor-atributo", "Seletores avançados", "Seletores por atributo", "input[required]", { "border-color": "#f59e0b" }],
  ["combinadores", "Combinadores", "Filho direto", ".menu > a", { display: "block" }],
  ["camada-visual", "Sobreposição", "isolation e z-index", ".modal", { position: "fixed", "z-index": "100", isolation: "isolate" }],
  ["tema-escuro", "Tema consistente", "Paleta completa", ".app", { color: "#e2e8f0", "background-color": "#020617" }],
  ["componente-card", "Componente profissional", "Card reutilizável", ".card", { display: "grid", gap: "12px", padding: "24px", "border-radius": "16px" }],
  ["layout-dashboard", "Dashboard responsivo", "Grid de aplicação", ".dashboard", { display: "grid", "grid-template-columns": "minmax(220px,280px) 1fr", "min-height": "100vh" }],
];

const js = [
  ["normalizar-texto", "Normalização de texto", "normalizarTexto", "function normalizarTexto(texto) {\n  // remova espaços e use minúsculas\n}", [["  DevDex  "], ["API"]], ["devdex", "api"], "Use trim e toLowerCase para produzir uma forma consistente.", "const nome = \"  Ada \".trim().toLowerCase();"],
  ["formatar-usuario", "Template literals", "formatarUsuario", "function formatarUsuario(usuario) {\n  // retorne Nome — função\n}", [[{ nome: "Ada", funcao: "Dev" }], [{ nome: "Linus", funcao: "Maintainer" }]], ["Ada — Dev", "Linus — Maintainer"], "Template literals combinam valores com texto sem concatenações confusas.", "const mensagem = `${nome} — ${cargo}`;"],
  ["mapear-valores", "Transformações com map", "dobrarValores", "function dobrarValores(valores) {\n  // devolva um novo array\n}", [[[1, 2, 3]], [[-2, 0, 4]]], [[2, 4, 6], [-4, 0, 8]], "map cria uma nova coleção transformando cada item.", "const nomes = pessoas.map(pessoa => pessoa.nome);"],
  ["validar-colecao", "Testes com every", "todosPositivos", "function todosPositivos(valores) {\n  // todos precisam ser maiores que zero\n}", [[[1, 2, 3]], [[1, 0, 3]]], [true, false], "every confirma se todos os elementos atendem ao critério.", "const validos = itens.every(item => item.ativo);"],
  ["encontrar-registro", "Busca com find", "encontrarPorId", "function encontrarPorId(itens, id) {\n  // retorne o item ou null\n}", [[[{ id: 1 }, { id: 2, nome: "B" }], 2], [[{ id: 1 }], 9]], [{ id: 2, nome: "B" }, null], "find devolve o primeiro item correspondente; normalize undefined para null.", "const item = itens.find(x => x.id === id) ?? null;"],
  ["reduzir-precos", "Agregação com reduce", "somarPrecos", "function somarPrecos(itens) {\n  // some a propriedade preco\n}", [[[{ preco: 10 }, { preco: 5.5 }]], [[]]], [15.5, 0], "reduce transforma uma coleção em um único resultado acumulado.", "const total = itens.reduce((soma, item) => soma + item.valor, 0);"],
  ["contar-itens", "Objetos acumuladores", "contarOcorrencias", "function contarOcorrencias(itens) {\n  // conte cada valor\n}", [["a", "b", "a"], ["x"]], [{ a: 2, b: 1 }, { x: 1 }], "Um objeto pode servir como índice de frequência durante um reduce.", "contagem[item] = (contagem[item] ?? 0) + 1;"],
  ["valores-unicos", "Set e unicidade", "valoresUnicos", "function valoresUnicos(valores) {\n  // preserve a primeira ocorrência\n}", [[[1, 1, 2, 3, 2]], [["a", "a"]]], [[1, 2, 3], ["a"]], "Set guarda valores únicos e pode ser convertido de volta em array.", "const unicos = [...new Set(valores)];"],
  ["mesclar-config", "Spread de objetos", "mesclarConfig", "function mesclarConfig(padrao, customizado) {\n  // customizado deve prevalecer\n}", [[{ tema: "dark", pagina: 10 }, { pagina: 20 }], [{ a: 1 }, { b: 2 }]], [{ tema: "dark", pagina: 20 }, { a: 1, b: 2 }], "A ordem no spread define quais propriedades prevalecem.", "const config = { ...padrao, ...usuario };"],
  ["divisao-segura", "Guard clauses", "dividirSeguro", "function dividirSeguro(a, b) {\n  // retorne null quando b for zero\n}", [[10, 2], [5, 0]], [5, null], "Uma guard clause trata entradas inválidas antes do caminho principal.", "if (divisor === 0) return null;"],
  ["limitar-valor", "Math min e max", "limitar", "function limitar(valor, minimo, maximo) {\n  // mantenha o valor no intervalo\n}", [[12, 0, 10], [-2, 0, 10], [4, 0, 10]], [10, 0, 4], "Math.min e Math.max podem compor um limite inferior e superior.", "const seguro = Math.min(maximo, Math.max(minimo, valor));"],
  ["fatiar-array", "Particionamento", "fatiar", "function fatiar(valores, tamanho) {\n  // divida em grupos\n}", [[[1, 2, 3, 4, 5], 2], [[1, 2], 3]], [[[1, 2], [3, 4], [5]], [[1, 2]]], "slice extrai partes sem alterar o array original.", "partes.push(valores.slice(i, i + tamanho));"],
  ["ordenar-ranking", "Ordenação imutável", "ordenarRanking", "function ordenarRanking(jogadores) {\n  // maior pontuação primeiro, sem alterar a entrada\n}", [[[{ nome: "A", pontos: 2 }, { nome: "B", pontos: 5 }]]], [[{ nome: "B", pontos: 5 }, { nome: "A", pontos: 2 }]], "Copie antes de sort para preservar a coleção recebida.", "const ranking = [...itens].sort((a, b) => b.pontos - a.pontos);"],
  ["agrupar-categoria", "Agrupamento de dados", "agruparPorCategoria", "function agruparPorCategoria(itens) {\n  // use categoria como chave\n}", [[[{ categoria: "web", nome: "HTML" }, { categoria: "web", nome: "CSS" }, { categoria: "dados", nome: "SQL" }]]], [{ web: ["HTML", "CSS"], dados: ["SQL"] }], "Agrupar transforma uma lista em um índice de listas.", "(grupos[item.tipo] ??= []).push(item.nome);"],
  ["selecionar-campos", "Projeção de objetos", "selecionarCampos", "function selecionarCampos(objeto, campos) {\n  // crie um novo objeto só com os campos existentes\n}", [[{ id: 1, nome: "Ada", senha: "x" }, ["id", "nome"]]], [{ id: 1, nome: "Ada" }], "Projetar dados reduz o objeto ao contrato necessário.", "for (const campo of campos) if (campo in objeto) saida[campo] = objeto[campo];"],
  ["remover-nulos", "Limpeza de objetos", "removerNulos", "function removerNulos(objeto) {\n  // remova null e undefined\n}", [[{ a: 1, b: null, c: 0 }], [{ x: null }]], [{ a: 1, c: 0 }, {}], "Object.entries permite filtrar pares e reconstruir um objeto.", "Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));"],
  ["achatar-lista", "Arrays aninhados", "achatarUmaVez", "function achatarUmaVez(valores) {\n  // remova um nível de aninhamento\n}", [[[[1, 2], [3], [4, 5]]], [[[1], []]]], [[1, 2, 3, 4, 5], [1]], "flat(1) remove exatamente um nível de arrays aninhados.", "const simples = valores.flat();"],
  ["rotular-itens", "Pipeline de strings", "rotularItens", "function rotularItens(itens) {\n  // retorne '1. A | 2. B'\n}", [["A", "B"], []], ["1. A | 2. B", ""], "map pode produzir rótulos e join compõe a saída final.", "itens.map((item, i) => `${i + 1}. ${item}`).join(\" | \");"],
  ["validar-usuario", "Validação composta", "usuarioValido", "function usuarioValido(usuario) {\n  // nome >= 2 e idade >= 18 e email contém @\n}", [[{ nome: "Ada", idade: 30, email: "a@b.com" }], [{ nome: "A", idade: 17, email: "x" }]], [true, false], "Validações profissionais combinam critérios claros e retornam booleanos.", "return nome.length >= 2 && idade >= 18 && email.includes(\"@\");"],
  ["calcular-carrinho", "Regra de negócio", "calcularCarrinho", "function calcularCarrinho(itens, desconto) {\n  // total quantidade*preco menos desconto percentual\n}", [[[{ preco: 10, quantidade: 2 }, { preco: 5, quantidade: 1 }], 10], [[], 20]], [22.5, 0], "Separe subtotal e regra de desconto para manter a intenção legível.", "const total = subtotal * (1 - desconto / 100);"],
  ["paginar-dados", "Paginação", "paginar", "function paginar(itens, pagina, tamanho) {\n  // páginas começam em 1\n}", [[[1, 2, 3, 4, 5], 2, 2], [[1, 2], 3, 2]], [[3, 4], []], "Calcule o deslocamento e use slice para devolver apenas a página.", "const inicio = (pagina - 1) * tamanho;"],
  ["atualizar-registro", "Atualização imutável", "atualizarPorId", "function atualizarPorId(itens, id, mudancas) {\n  // retorne nova lista\n}", [[[{ id: 1, nome: "A" }, { id: 2, nome: "B" }], 2, { nome: "Beta" }]], [[{ id: 1, nome: "A" }, { id: 2, nome: "Beta" }]], "map e spread atualizam somente o registro correspondente.", "itens.map(item => item.id === id ? { ...item, ...mudancas } : item);"],
  ["reduzir-estado", "Reducer de estado", "reduzirEstado", "function reduzirEstado(estado, acao) {\n  // suporte incrementar e resetar\n}", [[{ contador: 2 }, { tipo: "incrementar" }], [{ contador: 9 }, { tipo: "resetar" }]], [{ contador: 3 }, { contador: 0 }], "Reducers produzem o próximo estado sem alterar o anterior.", "if (acao.tipo === \"incrementar\") return { ...estado, contador: estado.contador + 1 };"],
  ["reconciliar-dados", "Reconciliação", "reconciliar", "function reconciliar(atuais, recebidos) {\n  // atualize por id e preserve não recebidos\n}", [[[{ id: 1, v: "a" }, { id: 2, v: "b" }], [{ id: 2, v: "B" }]]], [[{ id: 1, v: "a" }, { id: 2, v: "B" }]], "Um Map por id torna a reconciliação previsível e eficiente.", "const novos = new Map(recebidos.map(item => [item.id, item]));"],
  ["analisar-vendas", "Pipeline analítico", "analisarVendas", "function analisarVendas(valores) {\n  // retorne total, media e maior; zeros para lista vazia\n}", [[[10, 20, 30]], [[]]], [{ total: 60, media: 20, maior: 30 }, { total: 0, media: 0, maior: 0 }], "Um pipeline profissional trata o caso vazio e calcula métricas consistentes.", "const total = valores.reduce((soma, valor) => soma + valor, 0);"],
];

const sqlSchema = `CREATE TABLE CATEGORIAS (ID INTEGER PRIMARY KEY, NOME TEXT NOT NULL);
CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, NOME TEXT NOT NULL, CATEGORIA_ID INTEGER, PRECO REAL NOT NULL, ATIVO INTEGER NOT NULL, ESTOQUE INTEGER);
CREATE TABLE VENDAS (ID INTEGER PRIMARY KEY, PRODUTO_ID INTEGER NOT NULL, QUANTIDADE INTEGER NOT NULL, TOTAL REAL NOT NULL, DATA TEXT NOT NULL);`;
const sqlSeed = `INSERT INTO CATEGORIAS VALUES (1,'Web'),(2,'Dados'),(3,'Mobile');
INSERT INTO PRODUTOS VALUES (1,'Curso HTML',1,80,1,12),(2,'Curso CSS',1,90,1,8),(3,'Curso SQL',2,120,1,5),(4,'Curso Legado',NULL,40,0,NULL),(5,'Curso JS',1,150,1,3);
INSERT INTO VENDAS VALUES (1,1,2,160,'2026-01-10'),(2,3,1,120,'2026-01-12'),(3,5,2,300,'2026-02-01'),(4,1,1,80,'2026-02-03'),(5,3,3,360,'2026-02-05');`;
const sql = [
  ["sql-distinct", "Valores distintos", "DISTINCT", "SELECT DISTINCT CATEGORIA_ID FROM PRODUTOS WHERE CATEGORIA_ID IS NOT NULL ORDER BY CATEGORIA_ID", "Use DISTINCT para remover repetições do resultado."],
  ["sql-and", "Condições combinadas", "AND", "SELECT ID,NOME FROM PRODUTOS WHERE ATIVO=1 AND PRECO>=100 ORDER BY ID", "AND exige que todas as condições sejam verdadeiras."],
  ["sql-or", "Alternativas com OR", "OR", "SELECT ID,NOME FROM PRODUTOS WHERE PRECO<50 OR PRECO>=150 ORDER BY ID", "OR mantém linhas que atendam a pelo menos uma condição."],
  ["sql-null", "Valores ausentes", "IS NULL", "SELECT ID,NOME FROM PRODUTOS WHERE CATEGORIA_ID IS NULL", "NULL representa ausência e é comparado com IS NULL."],
  ["sql-limit", "Limite de resultados", "LIMIT", "SELECT ID,NOME,PRECO FROM PRODUTOS ORDER BY PRECO DESC LIMIT 3", "LIMIT controla quantas linhas são devolvidas após a ordenação."],
  ["sql-alias", "Aliases legíveis", "AS", "SELECT NOME AS PRODUTO,PRECO AS VALOR FROM PRODUTOS WHERE ATIVO=1 ORDER BY ID", "Aliases deixam colunas calculadas e relatórios mais claros."],
  ["sql-count", "Contagem", "COUNT", "SELECT COUNT(*) AS TOTAL FROM PRODUTOS WHERE ATIVO=1", "COUNT agrega várias linhas em uma contagem."],
  ["sql-sum", "Soma agregada", "SUM", "SELECT SUM(TOTAL) AS FATURAMENTO FROM VENDAS", "SUM calcula o total de uma coluna numérica."],
  ["sql-average", "Média", "AVG", "SELECT ROUND(AVG(PRECO),2) AS MEDIA FROM PRODUTOS WHERE ATIVO=1", "AVG calcula média; ROUND controla as casas decimais."],
  ["sql-group", "Agrupamento", "GROUP BY", "SELECT CATEGORIA_ID,COUNT(*) AS TOTAL FROM PRODUTOS WHERE CATEGORIA_ID IS NOT NULL GROUP BY CATEGORIA_ID ORDER BY CATEGORIA_ID", "GROUP BY produz uma linha agregada por grupo."],
  ["sql-having", "Filtro de grupos", "HAVING", "SELECT PRODUTO_ID,SUM(QUANTIDADE) AS UNIDADES FROM VENDAS GROUP BY PRODUTO_ID HAVING SUM(QUANTIDADE)>=3 ORDER BY PRODUTO_ID", "HAVING filtra depois do agrupamento."],
  ["sql-inner-join", "INNER JOIN", "Junção obrigatória", "SELECT P.NOME,C.NOME AS CATEGORIA FROM PRODUTOS P JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID ORDER BY P.ID", "JOIN relaciona linhas por chaves correspondentes."],
  ["sql-left-join", "LEFT JOIN", "Junção opcional", "SELECT P.NOME,C.NOME AS CATEGORIA FROM PRODUTOS P LEFT JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID ORDER BY P.ID", "LEFT JOIN preserva todas as linhas da tabela esquerda."],
  ["sql-case", "Classificação com CASE", "CASE", "SELECT NOME,CASE WHEN PRECO>=100 THEN 'PREMIUM' ELSE 'PADRAO' END AS FAIXA FROM PRODUTOS ORDER BY ID", "CASE cria valores condicionais dentro da consulta."],
  ["sql-coalesce", "Fallback com COALESCE", "COALESCE", "SELECT NOME,COALESCE(ESTOQUE,0) AS ESTOQUE FROM PRODUTOS ORDER BY ID", "COALESCE escolhe o primeiro valor não nulo."],
  ["sql-subquery", "Subconsulta escalar", "Subquery", "SELECT NOME,PRECO FROM PRODUTOS WHERE PRECO>(SELECT AVG(PRECO) FROM PRODUTOS) ORDER BY PRECO", "Uma subconsulta pode calcular o valor usado pelo filtro externo."],
  ["sql-in-subquery", "IN com subconsulta", "IN SELECT", "SELECT NOME FROM PRODUTOS WHERE ID IN (SELECT PRODUTO_ID FROM VENDAS WHERE QUANTIDADE>=2) ORDER BY NOME", "IN pode comparar com o conjunto produzido por outra consulta."],
  ["sql-exists", "Existência relacionada", "EXISTS", "SELECT P.NOME FROM PRODUTOS P WHERE EXISTS (SELECT 1 FROM VENDAS V WHERE V.PRODUTO_ID=P.ID) ORDER BY P.ID", "EXISTS verifica se a relação possui ao menos uma linha."],
  ["sql-cte", "CTE com WITH", "WITH", "WITH ATIVOS AS (SELECT * FROM PRODUTOS WHERE ATIVO=1) SELECT NOME,PRECO FROM ATIVOS ORDER BY PRECO DESC", "CTEs nomeiam etapas intermediárias e tornam consultas complexas legíveis."],
  ["sql-union", "Combinação com UNION", "UNION", "SELECT NOME AS ITEM FROM CATEGORIAS UNION SELECT NOME FROM PRODUTOS ORDER BY ITEM", "UNION combina resultados compatíveis e remove duplicatas."],
  ["sql-window-row-number", "Numeração com janela", "ROW_NUMBER", "SELECT NOME,ROW_NUMBER() OVER (ORDER BY PRECO DESC) AS POSICAO FROM PRODUTOS ORDER BY POSICAO", "Funções de janela calculam métricas sem agrupar as linhas."],
  ["sql-window-partition", "Janela particionada", "SUM OVER", "SELECT ID,PRODUTO_ID,TOTAL,SUM(TOTAL) OVER (PARTITION BY PRODUTO_ID) AS TOTAL_PRODUTO FROM VENDAS ORDER BY ID", "PARTITION BY reinicia o cálculo para cada grupo sem reduzir linhas."],
  ["sql-relatorio-joins", "Relatório com múltiplos joins", "Relatório", "SELECT V.ID,P.NOME,C.NOME AS CATEGORIA,V.TOTAL FROM VENDAS V JOIN PRODUTOS P ON P.ID=V.PRODUTO_ID LEFT JOIN CATEGORIAS C ON C.ID=P.CATEGORIA_ID ORDER BY V.ID", "Relatórios profissionais combinam entidades mantendo nomes de coluna claros."],
  ["sql-analise-final", "Análise profissional", "CTE e agregação", "WITH RESUMO AS (SELECT PRODUTO_ID,SUM(QUANTIDADE) AS UNIDADES,SUM(TOTAL) AS RECEITA FROM VENDAS GROUP BY PRODUTO_ID) SELECT P.NOME,R.UNIDADES,R.RECEITA FROM RESUMO R JOIN PRODUTOS P ON P.ID=R.PRODUTO_ID WHERE R.RECEITA>=200 ORDER BY R.RECEITA DESC", "Separe agregação e apresentação em etapas para construir relatórios auditáveis."],
];

const courses = [
  { key: "html", pathId: 3, campaignId: 1, existingCount: 4, existingLastId: 15, runtime: "html", topics: html, ref: ["MDN — HTML semântico", mdnHtml], zoneCounts: [5, 5, 5, 5, 6], zoneTitles: ["Arquivo dos Textos", "Galeria Semântica", "Fortaleza dos Dados", "Templo dos Formulários", "Cidadela Acessível"] },
  { key: "css", pathId: 4, campaignId: 2, existingCount: 4, existingLastId: 19, runtime: "css", topics: css, ref: ["MDN — CSS e layout", mdnCss], extraRef: ["MDN — CSS Layout", mdnLayout], zoneCounts: [5, 5, 5, 5, 6], zoneTitles: ["Vale da Tipografia", "Forja do Box Model", "Planície Flexível", "Grade Responsiva", "Torre do Design System"] },
  { key: "javascript", pathId: 1, campaignId: 3, existingCount: 5, existingLastId: 5, runtime: "javascript", topics: js, ref: ["MDN — JavaScript", mdnJs], zoneCounts: [5, 5, 5, 5, 5], zoneTitles: ["Distrito das Strings", "Ponte das Coleções", "Laboratório dos Objetos", "Núcleo de Estado", "Torre dos Algoritmos"] },
  { key: "sql", pathId: 2, campaignId: 4, existingCount: 6, existingLastId: 11, runtime: "sqlite", topics: sql, ref: ["SQLite — linguagem SQL", sqliteDocs], zoneCounts: [6, 6, 6, 6], zoneTitles: ["Galeria dos Filtros", "Câmara das Agregações", "Ponte das Relações", "Observatório Analítico"] },
];

const esc = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const values = (rows) => rows.map((row) => `(${row.map((value) => typeof value === "number" ? value : value === null ? "NULL" : esc(value)).join(",")})`).join(",\n");
const statements = [];
let missionId = 20;
let zoneId = 5;
const generated = [];

for (const course of courses) {
  let topicOffset = 0;
  const zoneRecords = course.zoneCounts.map((count, index) => ({ id: zoneId++, count, title: course.zoneTitles[index], slug: `${course.key}-zona-${index + 2}`, sortOrder: index + 2 }));
  statements.push(`INSERT OR IGNORE INTO campaign_zones (id,campaign_id,slug,title,story_intro,story_outro,sort_order,status) VALUES\n${values(zoneRecords.map((zone) => [zone.id, course.campaignId, zone.slug, zone.title, `Avance do nível ${course.existingCount + topicOffset + 1} ao domínio profissional de ${course.key.toUpperCase()}.`, `Zona ${zone.title} concluída.`, zone.sortOrder, "published"]))};`);
  const courseMissions = [];
  for (const zone of zoneRecords) {
    for (let localOrder = 1; localOrder <= zone.count; localOrder += 1) {
      const topic = course.topics[topicOffset++];
      courseMissions.push({ id: missionId, skillId: missionId, zone, localOrder, globalOrder: course.existingCount + topicOffset, topic });
      missionId += 1;
    }
  }
  generated.push({ course, missions: courseMissions });
}

for (const { course, missions } of generated) {
  statements.push(`INSERT OR IGNORE INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES\n${values(missions.map(({ skillId, topic, globalOrder }) => [skillId, course.pathId, topic[0], topic[1], topic[2], 0, globalOrder, "published"]))};`);
  statements.push(`UPDATE missions SET next_mission_slug=${esc(missions[0].topic[0])} WHERE id=${course.existingLastId};`);
  statements.push(`INSERT OR IGNORE INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug) VALUES\n${values(missions.map((mission, index) => {
    const topic = mission.topic;
    const next = missions[index + 1]?.topic[0] ?? null;
    const starter = course.runtime === "javascript" ? topic[3] : course.runtime === "sqlite" ? `-- ${topic[1]}\nSELECT` : course.runtime === "html" ? "<!-- Escreva a estrutura aqui -->" : `/* ${topic[1]} */`;
    const objective = course.runtime === "javascript" ? `Implemente ${topic[2]} e passe todos os testes.` : course.runtime === "sqlite" ? `Escreva a consulta solicitada usando ${topic[2]}.` : topic[5] ?? `Aplique ${topic[2]}.`;
    const difficulty = mission.globalOrder <= 10 ? "easy" : mission.globalOrder <= 20 ? "medium" : "hard";
    return [mission.id, mission.skillId, topic[0], topic[1], `Aula e prática: ${topic[2]}.`, objective, starter, course.runtime === "javascript" ? topic[2] : "", "{}", course.runtime, course.runtime === "javascript" ? "javascript-quickjs-1" : course.runtime === "sqlite" ? "sqlite-wasm-1" : "web-parser-1", difficulty, 1, "published", difficulty === "hard" ? 180 : difficulty === "medium" ? 140 : 110, mission.globalOrder, next];
  }))};`);
  statements.push(`INSERT OR IGNORE INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES\n${values(missions.map((mission, index) => [mission.id, index ? missions[index - 1].id : course.existingLastId]))};`);
  statements.push(`INSERT OR IGNORE INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order) VALUES\n${values(missions.map((mission) => {
    const last = mission.localOrder === mission.zone.count;
    const elite = !last && mission.localOrder === Math.max(3, mission.zone.count - 1);
    return [mission.id, mission.zone.id, mission.zone.slug, last ? `Guardião de ${mission.topic[1]}` : elite ? `Elite de ${mission.topic[1]}` : `Bug de ${mission.topic[1]}`, last ? "boss" : elite ? "elite" : "enemy", mission.globalOrder, `Revise a aula sobre ${mission.topic[2]}.`, `A corrupção domina ${mission.topic[2]}.`, "Aplique o conceito explicado para vencer.", last ? `O guardião combina os conhecimentos da zona ${mission.zone.title}.` : "", last ? `${mission.zone.title} foi restaurada.` : "", mission.localOrder];
  }))};`);
  statements.push(`INSERT OR IGNORE INTO mission_study_materials (mission_id,title,introduction,explanation,example_code,example_explanation,key_points_json,common_mistakes_json,references_json) VALUES\n${values(missions.map((mission) => {
    const topic = mission.topic;
    const example = course.runtime === "javascript" ? topic[8] : course.runtime === "sqlite" ? topic[3] : course.runtime === "html" ? topic[6] : `${topic[3]} { ${Object.entries(topic[4]).map(([k, v]) => `${k}: ${v};`).join(" ")} }`;
    const explanation = course.runtime === "javascript" ? topic[7] : course.runtime === "sqlite" ? topic[4] : course.runtime === "html" ? `Use ${topic[2]} com semântica e acessibilidade; a estrutura comunica intenção ao navegador e às tecnologias assistivas.` : `${topic[2]} faz parte de uma interface previsível, responsiva e fácil de manter.`;
    const refs = [{ label: course.ref[0], url: course.ref[1] }, ...(course.extraRef ? [{ label: course.extraRef[0], url: course.extraRef[1] }] : [])];
    return [mission.id, topic[1], `Antes da batalha, entenda ${topic[2]}.`, explanation, example, "O exemplo demonstra o conceito sem entregar a solução específica da missão.", JSON.stringify([`Entenda ${topic[2]}`, "Prefira código legível e verificável", "Teste casos comuns e limites"]), JSON.stringify(["Copiar o exemplo sem adaptar", "Ignorar a estrutura solicitada"]), JSON.stringify(refs)];
  }))};`);
  statements.push(`INSERT OR IGNORE INTO user_missions (user_id,mission_id,state) SELECT user_id,${missions[0].id},'available' FROM user_missions WHERE mission_id=${course.existingLastId} AND state='completed';`);
}

for (const { course, missions } of generated) {
  if (course.runtime === "javascript") {
    statements.push(`INSERT OR IGNORE INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) VALUES\n${values(missions.flatMap((mission) => mission.topic[4].map((input, index) => [mission.id, `Teste ${index + 1}`, JSON.stringify(input), JSON.stringify(mission.topic[5][index]), 1, index + 1])))};`);
  }
  if (course.runtime === "html") {
    statements.push(`INSERT OR IGNORE INTO web_mission_configs (mission_id,document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length) VALUES\n${values(missions.map((mission) => {
      const topic = mission.topic;
      const rules = topic[7] ?? [{ type: "element", tag: topic[3], attributes: topic[4] }];
      return [mission.id, "html", "web-parser-1", "<!-- Escreva a estrutura aqui -->", "", "body{font-family:system-ui;padding:32px;color:#e2e8f0;background:#0f172a}", JSON.stringify(rules), 8000];
    }))};`);
  }
  if (course.runtime === "css") {
    statements.push(`INSERT OR IGNORE INTO web_mission_configs (mission_id,document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length) VALUES\n${values(missions.map((mission) => {
      const topic = mission.topic;
      return [mission.id, "css", "web-parser-1", `/* Estilize ${topic[3]} */`, `<main class="app dashboard container"><nav class="menu toolbar"><a class="button">DevDex</a></nav><section class="content grid layout"><article class="card painel hero preview badge modal"><h1>Curso profissional</h1><input required><p>Visualize seu CSS.</p></article></section></main>`, "", JSON.stringify([{ type: "style", selector: topic[3], declarations: topic[4] }]), 8000];
    }))};`);
  }
}

const SQL = await initSqlJs({ locateFile: (file) => join(process.cwd(), "node_modules", "sql.js", "dist", file) });
const sqlCourse = generated.find(({ course }) => course.runtime === "sqlite");
statements.push(`INSERT OR IGNORE INTO sql_mission_configs (mission_id,dialect,runtime_version,schema_sql,seed_sql,starter_sql,expected_result_json,table_schema_json,table_preview_json,max_rows,timeout_ms,max_statements) VALUES\n${values(sqlCourse.missions.map((mission) => {
  const query = mission.topic[3];
  const db = new SQL.Database();
  db.run(sqlSchema); db.run(sqlSeed);
  const result = db.exec(query)[0]; db.close();
  const expected = { columns: result?.columns ?? [], rows: result?.values ?? [], orderMatters: /ORDER BY/i.test(query) };
  const schema = [{ name: "PRODUTOS", columns: [{ name: "ID", type: "INTEGER", primaryKey: true }, { name: "NOME", type: "TEXT" }, { name: "PRECO", type: "REAL" }] }, { name: "VENDAS", columns: [{ name: "ID", type: "INTEGER", primaryKey: true }, { name: "PRODUTO_ID", type: "INTEGER" }, { name: "TOTAL", type: "REAL" }] }];
  const preview = { columns: ["ID", "NOME", "PRECO"], rows: [[1, "Curso HTML", 80], [2, "Curso CSS", 90], [3, "Curso SQL", 120]] };
  return [mission.id, "sqlite", "sqlite-wasm-1", sqlSchema, sqlSeed, `-- ${mission.topic[1]}\nSELECT`, JSON.stringify(expected), JSON.stringify(schema), JSON.stringify(preview), 100, 350, 1];
}))};`);

statements.push("UPDATE learning_paths SET version=2,description=description || ' Curso completo com 30 aulas explicativas e 30 práticas, do básico ao profissional.' WHERE id IN (1,2,3,4);");
statements.push("PRAGMA optimize;");

const output = `-- Generated by scripts/generate-complete-curriculum.mjs\n${statements.join("\n--> statement-breakpoint\n")}\n`;
writeFileSync(join(process.cwd(), "drizzle", "0010_complete_curriculum.sql"), output);
console.log(`Generated ${missionId - 20} missions across ${zoneId - 5} zones.`);
