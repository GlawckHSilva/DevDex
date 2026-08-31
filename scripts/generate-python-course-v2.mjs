import { writeFileSync } from "node:fs";
import { join } from "node:path";

const A = (slug, title, fn, args, objective, tests, options = {}) => ({ slug, title, fn, args, objective, tests, ...options });
const Z = (slug, title, pdf, modules, boss) => ({ slug, title, pdf, modules, boss });
const learn = "https://learn.microsoft.com/en-us/shows/";
const docs = "https://docs.python.org/pt-br/3/";
const videos = {
  numbers: `${learn}intro-to-python-development/python-for-beginners-13-of-44-numeric-data-types`,
  strings: `${learn}intro-to-python-development/python-for-beginners-9-of-44-string-concepts`,
  errors: `${learn}intro-to-python-development/python-for-beginners-17-of-44-error-handling`,
  collections: `${learn}intro-to-python-development/python-for-beginners-25-of-44-collections`,
  loops: `${learn}intro-to-python-development/python-for-beginners-27-of-44-loops`,
  functions: `${learn}intro-to-python-development/python-for-beginners-29-of-44-introducing-functions`,
  parameters: `${learn}intro-to-python-development/python-for-beginners-31-of-44-parameterized-functions`,
  quality: `${learn}more-python-for-beginners/formatting-and-linting--more-python-for-beginners-2-of-20`,
  lambdas: `${learn}more-python-for-beginners/lambdas--more-python-for-beginners-4-of-20`,
  classes: `${learn}more-python-for-beginners/classes--more-python-for-beginners-6-of-20`,
  classDemo: `${learn}more-python-for-beginners/demo-classes--more-python-for-beginners-7-of-20`,
  inheritance: `${learn}more-python-for-beginners/inheritance--more-python-for-beginners-8-of-20`,
  context: `${learn}more-python-for-beginners/using-with-to-automatically-close-resources--more-python-for-beginners-16-of-20`,
  async: `${learn}more-python-for-beginners/asynchronous-operations--more-python-for-beginners-18-of-20`,
};
const resources = {
  "sintaxe-valores": [videos.numbers, "tutorial/introduction.html", "Números, texto e valores"],
  "texto-logica": [videos.strings, "tutorial/introduction.html#text", "Texto e strings"],
  "decisoes-repeticoes": [videos.loops, "tutorial/controlflow.html", "Controle de fluxo"],
  "funcoes-integradas": [videos.functions, "tutorial/controlflow.html#defining-functions", "Definindo funções"],
  "listas-sequencias": [videos.collections, "tutorial/datastructures.html#more-on-lists", "Listas e sequências"],
  "sets-dicionarios": [videos.collections, "tutorial/datastructures.html#dictionaries", "Dicionários e conjuntos"],
  "compreensoes-matrizes": [videos.collections, "tutorial/datastructures.html#list-comprehensions", "Compreensões de lista"],
  "ordenacao-agrupamento": [videos.lambdas, "howto/sorting.html", "Ordenação em Python"],
  "assinaturas-flexiveis": [videos.parameters, "tutorial/controlflow.html#more-on-defining-functions", "Parâmetros e assinaturas"],
  "pureza-closures": [videos.lambdas, "howto/functional.html", "Programação funcional"],
  "alta-ordem-pipelines": [videos.lambdas, "howto/functional.html", "Funções de alta ordem"],
  "recursao-decomposicao": [videos.functions, "tutorial/controlflow.html#defining-functions", "Funções e decomposição"],
  "erros-contratos": [videos.errors, "tutorial/errors.html", "Erros e exceções"],
  "formatos-padroes": [videos.strings, "tutorial/inputoutput.html#saving-structured-data-with-json", "JSON e dados estruturados"],
  "biblioteca-padrao": [videos.collections, "tutorial/stdlib.html", "Biblioteca padrão"],
  "qualidade-debug": [videos.quality, "library/unittest.html", "Testes com unittest"],
  "classes-encapsulamento": [videos.classes, "tutorial/classes.html", "Classes e encapsulamento"],
  "heranca-polimorfismo": [videos.inheritance, "tutorial/classes.html#inheritance", "Herança"],
  "composicao-dataclasses": [videos.classDemo, "library/dataclasses.html", "Dataclasses"],
  "iteracao-preguicosa": [videos.collections, "tutorial/classes.html#iterators", "Iteradores e geradores"],
  "decoradores-contextos": [videos.context, "reference/datamodel.html#context-managers", "Gerenciadores de contexto"],
  "arquitetura-dependencias": [videos.quality, "tutorial/modules.html#packages", "Módulos e pacotes"],
  "algoritmos-desempenho": [videos.lambdas, "library/timeit.html", "Medição de desempenho"],
  "assincrono-producao": [videos.async, "library/asyncio.html", "Programação assíncrona com asyncio"],
};

const zones = [
  Z("terminal-dos-fundamentos", "Terminal dos Fundamentos", "/materials/python/zona-1-fundamentos.pdf", [
    { slug:"sintaxe-valores", title:"Sintaxe, valores e funções", copy:[193,194], concepts:"funções, variáveis, tipos numéricos e retorno", example:"def calcular_total(preco, quantidade):\n    subtotal = preco * quantidade\n    return subtotal", add:[
      A("conversor-medidas","Conversor de medidas","converter_distancia","quilometros","Converta quilômetros em metros e centímetros e retorne um dicionário.",[[[1],{metros:1000,centimetros:100000}],[[2.5],{metros:2500,centimetros:250000}],[[0],{metros:0,centimetros:0}]]),
      A("orcamento-item","Orçamento completo","calcular_item","preco, quantidade, desconto","Calcule subtotal, valor do desconto percentual e total final.",[[[100,2,10],{subtotal:200,desconto:20,total:180}],[[50,3,0],{subtotal:150,desconto:0,total:150}],[[80,1,25],{subtotal:80,desconto:20,total:60}]]),
      A("perfil-resumido","Perfil resumido","montar_resumo","nome, idade, cidade","Normalize os dados e produza uma frase no formato pedido.",[[[" ada ",30," londres "],"Ada, 30 anos - Londres"],[["LINUS",55,"helsinque"],"Linus, 55 anos - Helsinque"],[["bia",18,"são paulo"],"Bia, 18 anos - São Paulo"]])
    ]},
    { slug:"texto-logica", title:"Texto, operadores e lógica", copy:[195,196], concepts:"operadores, strings, normalização e expressões booleanas", example:"nome = texto.strip().title()\nativo = idade >= 18 and bloqueado is False", add:[
      A("validar-usuario","Validação de usuário","validar_usuario","usuario","Aceite somente nomes com 3 a 20 caracteres alfanuméricos ou underscore.",[[["dev_dex"],true],[["ab"],false],[["nome inválido"],false],[["Ada123"],true]]),
      A("forca-senha","Força da senha","classificar_senha","senha","Classifique como forte, média ou fraca considerando tamanho, letras e números.",[[["DevDex2026"],"forte"],[["devdex"],"media"],[["123"],"fraca"],[["abcdefgh"],"media"]]),
      A("iniciais-seguras","Iniciais seguras","extrair_iniciais","nome","Remova espaços excedentes e retorne iniciais maiúsculas.",[[["Ada Lovelace"],"AL"],[["  guido   van rossum "],"GVR"],[["Linus"],"L"]])
    ]},
    { slug:"decisoes-repeticoes", title:"Decisões e repetições", copy:[197,198], concepts:"comparações, if, elif, for, range e acumulação", example:"total = 0\nfor valor in valores:\n    if valor > 0:\n        total += valor", add:[
      A("faixa-tarifaria","Faixa tarifária","calcular_tarifa","consumo","Aplique tarifas progressivas: até 100 custa 0.5, até 200 custa 0.7 e acima custa 0.9 por unidade.",[[[50],25],[[150],105],[[300],270]]),
      A("multiplos-intervalo","Múltiplos no intervalo","listar_multiplos","inicio, fim, divisor","Liste em ordem os valores divisíveis no intervalo inclusivo.",[[[1,10,3],[3,6,9]],[[5,5,5],[5]],[[1,4,7],[]]]),
      A("relatorio-paridade","Relatório de paridade","resumir_paridade","valores","Conte pares e ímpares e some apenas os números positivos.",[[[[1,2,3,4]],{pares:2,impares:2,soma_positivos:10}],[[[-2,-1,0]],{pares:2,impares:1,soma_positivos:0}],[[[]],{pares:0,impares:0,soma_positivos:0}]])
    ]},
    { slug:"funcoes-integradas", title:"Funções para resolver problemas", copy:[199,200], concepts:"decomposição, coleções simples, casos extremos e contratos", example:"def media_segura(valores):\n    return sum(valores) / len(valores) if valores else 0", add:[
      A("temperaturas","Análise de temperaturas","analisar_temperaturas","valores","Retorne mínima, máxima, média e quantidade acima da média.",[[[[10,20,30]],{minima:10,maxima:30,media:20,acima_media:1}],[[[5]],{minima:5,maxima:5,media:5,acima_media:0}],[[[]],{minima:0,maxima:0,media:0,acima_media:0}]]),
      A("numeros-primos","Filtro de primos","filtrar_primos","valores","Retorne somente números primos, sem duplicatas e ordenados.",[[[[7,2,4,7,11]],[2,7,11]],[[[0,1,-3]],[]],[[[13,12,5]],[5,13]]]),
      A("resumo-vendas-basico","Resumo de vendas","resumir_vendas","vendas","Some vendas válidas, calcule o ticket médio e conte valores ignorados.",[[[[10,20,-5]],{total:30,media:15,ignoradas:1}],[[[0,5]],{total:5,media:2.5,ignoradas:0}],[[[]],{total:0,media:0,ignoradas:0}]])
    ]}
  ], A("boss-fundamentos-v2","Central de pedidos","processar_pedidos_basico","pedidos","Valide pedidos, aplique desconto VIP, agregue totais e produza um relatório completo.",[[[[{cliente:"Ana",total:100,vip:true},{cliente:"Bia",total:50,vip:false}]],{faturamento:140,clientes:["Ana","Bia"],invalidos:0}],[[[{cliente:"",total:20,vip:false},{cliente:"Caio",total:-1,vip:false}]],{faturamento:0,clientes:[],invalidos:2}],[[[]],{faturamento:0,clientes:[],invalidos:0}]])),

  Z("floresta-das-colecoes", "Floresta das Coleções", "/materials/python/zona-2-colecoes.pdf", [
    { slug:"listas-sequencias", title:"Listas, tuplas e sequências", copy:[201,202], concepts:"índices, slices, cópias, tuplas e transformações", example:"ultimos = valores[-3:]\nprimeiro, *meio, ultimo = valores", add:[
      A("rotacionar-lista","Rotação de lista","rotacionar","valores, passos","Rotacione a lista para a direita sem alterar a entrada.",[[[[1,2,3,4],1],[4,1,2,3]],[[[1,2,3],4],[3,1,2]],[[[],3],[]]]),
      A("janelas-moveis","Janelas móveis","criar_janelas","valores, tamanho","Crie todas as janelas consecutivas do tamanho informado.",[[[[1,2,3,4],2],[[1,2],[2,3],[3,4]]],[[[1,2],3],[]],[[[1,2,3],1],[[1],[2],[3]]]]),
      A("intercalar-sequencias","Intercalar sequências","intercalar","a, b","Intercale duas listas e preserve os itens excedentes.",[[[[1,3],[2,4]],[1,2,3,4]],[[[1,2,3],[9]],[1,9,2,3]],[[[],[1,2]],[1,2]]])
    ]},
    { slug:"sets-dicionarios", title:"Conjuntos e dicionários", copy:[203,204], concepts:"unicidade, operações de conjunto, chaves, valores e contagens", example:"frequencias = {}\nfor item in itens:\n    frequencias[item] = frequencias.get(item, 0) + 1", add:[
      A("intersecao-equipes","Interseção de equipes","membros_comuns","equipe_a, equipe_b","Retorne membros em comum sem duplicatas e em ordem alfabética.",[[[["Ana","Bia"],["Bia","Caio"]],["Bia"]],[[["a","a"],["a"]],["a"]],[[[],["x"]],[]]]),
      A("inventario-consolidado","Inventário consolidado","consolidar_estoque","movimentos","Some entradas e saídas por produto e remova saldos zerados.",[[[[{produto:"A",qtd:3},{produto:"A",qtd:-1},{produto:"B",qtd:2}]],{A:2,B:2}],[[[{produto:"A",qtd:1},{produto:"A",qtd:-1}]],{}],[[[]],{}]]),
      A("indice-invertido","Índice invertido","indexar_palavras","documentos","Mapeie cada palavra normalizada aos índices dos documentos onde aparece.",[[[["Python web","Web dados"]],{python:[0],web:[0,1],dados:[1]}],[[["A a","B"]],{a:[0],b:[1]}],[[[]],{}]])
    ]},
    { slug:"compreensoes-matrizes", title:"Compreensões e dados aninhados", copy:[205,206], concepts:"estruturas aninhadas, compreensões, filtros e matrizes", example:"pares = [x * x for x in valores if x % 2 == 0]", add:[
      A("achatar-listas","Achatar listas","achatar","grupos","Transforme uma lista de listas em uma única lista preservando a ordem.",[[[[[1,2],[3],[]]],[1,2,3]],[[[]],[]],[[[["a"],["b","c"]]],["a","b","c"]]]),
      A("transpor-matriz","Transposição de matriz","transpor","matriz","Transponha uma matriz retangular; para matriz vazia retorne lista vazia.",[[[[[1,2],[3,4]]],[[1,3],[2,4]]],[[[[1,2,3]]],[[1],[2],[3]]],[[[]],[]]]),
      A("resumir-matriz","Resumo de matriz","resumir_matriz","matriz","Retorne somas de cada linha, de cada coluna e total geral.",[[[[[1,2],[3,4]]],{linhas:[3,7],colunas:[4,6],total:10}],[[[[5]]],{linhas:[5],colunas:[5],total:5}],[[[]],{linhas:[],colunas:[],total:0}]])
    ]},
    { slug:"ordenacao-agrupamento", title:"Ordenação, busca e agrupamento", copy:[207,208], concepts:"sorted, chaves compostas, agrupamento e rankings", example:"ordenados = sorted(itens, key=lambda item: (-item['pontos'], item['nome']))", add:[
      A("top-produtos","Top produtos","top_produtos","produtos, limite","Agregue vendas por produto e retorne os melhores por total decrescente e nome crescente.",[[[[{nome:"A",valor:10},{nome:"B",valor:20},{nome:"A",valor:5}],2],[{nome:"B",total:20},{nome:"A",total:15}]],[[[],3],[]],[[[{nome:"B",valor:1},{nome:"A",valor:1}],1],[{nome:"A",total:1}]]]),
      A("agrupar-faixas","Agrupar por faixa","agrupar_idades","pessoas","Agrupe nomes em menor, adulto e senior, mantendo ordem alfabética.",[[[[{nome:"Ana",idade:17},{nome:"Bia",idade:30},{nome:"Caio",idade:65}]],{menor:["Ana"],adulto:["Bia"],senior:["Caio"]}],[[[]],{menor:[],adulto:[],senior:[]}]]),
      A("mesclar-catalogos","Mesclar catálogos","mesclar_catalogos","principal, atualizacoes","Atualize preços por código, inclua novos itens e retorne por código.",[[[[{codigo:"A",preco:10}],[{codigo:"A",preco:12},{codigo:"B",preco:5}]],[{codigo:"A",preco:12},{codigo:"B",preco:5}]],[[[],[]],[]]])
    ]}
  ], A("boss-colecoes-v2","Dashboard de dados","gerar_dashboard","registros","Limpe, agrupe, ordene e resuma registros de vendas em um dashboard auditável.",[[[[{categoria:"web",valor:20},{categoria:"dados",valor:30},{categoria:"web",valor:10}]],{total:60,por_categoria:{dados:30,web:30},ranking:["dados","web"],invalidos:0}],[[[{categoria:"",valor:4},{categoria:"web",valor:-2}]],{total:0,por_categoria:{},ranking:[],invalidos:2}],[[[]],{total:0,por_categoria:{},ranking:[],invalidos:0}]])),

  Z("forja-das-funcoes", "Forja das Funções", "/materials/python/zona-3-funcoes.pdf", [
    { slug:"assinaturas-flexiveis", title:"Assinaturas flexíveis", copy:[209,210], concepts:"parâmetros padrão, argumentos nomeados, *args e contratos", example:"def totalizar(*valores, taxa=0):\n    return sum(valores) * (1 + taxa)", add:[
      A("media-ponderada","Média ponderada","media_ponderada","valores, pesos=None","Calcule média simples ou ponderada e trate entradas vazias.",[[[[10,20],null],15],[[[10,20],[1,3]],17.5],[[[],null],0]]),
      A("configuracao-segura","Configuração segura","configurar_servico","nome, opcoes=None","Monte configuração com padrões de timeout 30 e ativo True.",[[["api"],{nome:"api",timeout:30,ativo:true}],[["job",{timeout:10,ativo:false}],{nome:"job",timeout:10,ativo:false}]]),
      A("faixas-opcionais","Faixas opcionais","limitar_valores","valores, minimo=None, maximo=None","Filtre valores respeitando limites opcionais inclusivos.",[[[[1,2,3],2,null],[2,3]],[[[1,2,3],null,2],[1,2]],[[[1,2,3],2,2],[2]]])
    ]},
    { slug:"pureza-closures", title:"Pureza, escopo e closures", copy:[211,212], concepts:"escopo local, imutabilidade, closures e lambdas", example:"def criar_multiplicador(fator):\n    return lambda valor: valor * fator", add:[
      A("aplicar-regras","Aplicar regras puras","aplicar_regras","valores, minimo","Retorne nova lista apenas com valores acima do mínimo, dobrados.",[[[[1,3,5],2],[6,10]],[[[],0],[]],[[[-1,0,2],-1],[0,4]]]),
      A("contador-closure","Contador encapsulado","executar_contador","incrementos","Use closure para acumular incrementos e retorne cada estado.",[[[[1,2,-1]],[1,3,2]],[[[]],[]],[[[5,5]],[5,10]]]),
      A("ordenacao-multicriterio","Ordenação multicritério","ordenar_pessoas","pessoas","Ordene por idade crescente e nome normalizado.",[[[[{nome:"bia",idade:30},{nome:"Ana",idade:30},{nome:"Caio",idade:20}]],["Caio","Ana","bia"]],[[[]],[]]])
    ]},
    { slug:"alta-ordem-pipelines", title:"Alta ordem e pipelines", copy:[213,214], concepts:"funções como valores, map, filter, reduce e composição", example:"validos = filter(validar, dados)\nresultado = map(transformar, validos)", add:[
      A("pipeline-numerico","Pipeline numérico","pipeline_numerico","valores","Filtre positivos pares, eleve ao quadrado e some o resultado.",[[[[1,2,4,-2]],20],[[[3,5]],0],[[[]],0]]),
      A("compor-operacoes","Compor operações","executar_operacoes","valor, operacoes","Aplique em sequência dobrar, incrementar ou quadrado conforme a lista.",[[[2,["dobrar","incrementar"]],5],[[3,["quadrado","dobrar"]],18],[[5,[]],5]]),
      A("agrupar-transformar","Agrupar e transformar","processar_eventos","eventos","Filtre eventos ativos e some valores por tipo usando funções auxiliares.",[[[[{tipo:"a",valor:2,ativo:true},{tipo:"a",valor:3,ativo:false},{tipo:"b",valor:4,ativo:true}]],{a:2,b:4}],[[[]],{}]])
    ]},
    { slug:"recursao-decomposicao", title:"Recursão e decomposição", copy:[215,216], concepts:"caso base, divisão do problema e funções pequenas", example:"def soma_aninhada(valor):\n    if isinstance(valor, list):\n        return sum(soma_aninhada(x) for x in valor)\n    return valor", add:[
      A("soma-aninhada","Soma aninhada","somar_aninhado","dados","Some números em listas aninhadas de profundidade variável.",[[[[1,[2,[3]],4]],10],[[[]],0],[[[[-1],[2]]],1]]),
      A("achatar-dicionario","Achatar dicionário","achatar_dicionario","dados","Converta dicionários aninhados em chaves separadas por ponto.",[[[{usuario:{nome:"Ada",endereco:{cidade:"Londres"}}}],{"usuario.nome":"Ada","usuario.endereco.cidade":"Londres"}],[[{}],{}]]),
      A("troco-dinamico","Troco mínimo","minimo_moedas","valor, moedas","Calcule recursivamente a quantidade mínima de moedas ou -1 quando impossível.",[[[6,[1,3,4]],2],[[7,[2,4]],-1],[[0,[1,2]],0]])
    ]}
  ], A("boss-funcoes-v2","Motor de transações","processar_transacoes_v2","transacoes, regras","Crie um pipeline configurável de validação, transformação e agregação sem alterar as entradas.",[[[[{tipo:"credito",valor:100},{tipo:"debito",valor:30}],{taxa_credito:0.1}],{saldo:80,processadas:2,rejeitadas:0}],[[[{tipo:"x",valor:5}],{}],{saldo:0,processadas:0,rejeitadas:1}],[[[],{}],{saldo:0,processadas:0,rejeitadas:0}]])),

  Z("arquivo-da-confiabilidade", "Arquivo da Confiabilidade", "/materials/python/zona-4-confiabilidade.pdf", [
    { slug:"erros-contratos", title:"Erros e contratos", copy:[217,218], concepts:"try, except, erros de domínio, validação e mensagens úteis", example:"try:\n    valor = int(texto)\nexcept (TypeError, ValueError):\n    return None", add:[
      A("divisao-segura","Divisão segura","dividir_seguro","a, b","Retorne resultado ou um dicionário de erro previsível.",[[[10,2],{ok:true,valor:5}],[[10,0],{ok:false,erro:"divisao por zero"}],[["x",2],{ok:false,erro:"valor invalido"}]]),
      A("validar-cadastro","Validar cadastro","validar_cadastro","dados","Valide nome, idade adulta e e-mail e retorne todos os erros encontrados.",[[[{nome:"Ada",idade:30,email:"a@b.com"}],{valido:true,erros:[]}],[[{nome:"",idade:10,email:"x"}],{valido:false,erros:["nome","idade","email"]}]]),
      A("lote-resiliente","Lote resiliente","converter_lote","valores","Converta itens válidos para inteiro e relate índices inválidos sem interromper o lote.",[[[["1","x",2]],{valores:[1,2],erros:[1]}],[[[]],{valores:[],erros:[]}],[[[null,"3"]],{valores:[3],erros:[0]}]])
    ]},
    { slug:"formatos-padroes", title:"JSON, regex e datas", copy:[219,220], concepts:"serialização, expressões regulares e validação de formatos", example:"dados = json.loads(texto)\nvalido = re.fullmatch(padrao, valor)", add:[
      A("normalizar-telefones","Normalizar telefones","normalizar_telefones","telefones","Mantenha apenas 10 ou 11 dígitos e formate valores válidos.",[[[["(11) 99999-0000","123"]],["11999990000"]],[[[]],[]],[[["41 3333 2222"]],["4133332222"]]]),
      A("agrupar-datas","Agrupar por mês","agrupar_por_mes","datas","Conte datas ISO válidas por YYYY-MM e ignore entradas inválidas.",[[[["2026-08-01","2026-08-10","x"]],{"2026-08":2}],[[[]],{}],[[["2025-12-31","2026-01-01"]],{"2025-12":1,"2026-01":1}]]),
      A("mesclar-json","Mesclar configurações JSON","mesclar_json","base_texto, override_texto","Leia dois objetos JSON, aplique override e retorne None se algum formato for inválido.",[[["{\"tema\":\"dark\",\"timeout\":30}","{\"timeout\":10}"],{tema:"dark",timeout:10}],[["x","{}"],null]])
    ]},
    { slug:"biblioteca-padrao", title:"Biblioteca padrão e estatística", copy:[221,222], concepts:"datetime, collections, Counter, statistics e relatórios", example:"from collections import Counter\nmais_comum = Counter(itens).most_common(1)", add:[
      A("percentis-simples","Quartis simples","resumir_distribuicao","valores","Retorne média, mediana, mínimo e máximo; zeros para lista vazia.",[[[[1,2,9]],{media:4,mediana:2,minimo:1,maximo:9}],[[[]],{media:0,mediana:0,minimo:0,maximo:0}],[[[2,4]],{media:3,mediana:3,minimo:2,maximo:4}]]),
      A("janela-datas","Janela de datas","filtrar_periodo","registros, inicio, fim","Retorne registros cuja data ISO esteja no intervalo inclusivo, ordenados por data.",[[[[{id:1,data:"2026-08-02"},{id:2,data:"2026-07-01"}],"2026-08-01","2026-08-31"],[1]],[[[],"2026-01-01","2026-02-01"],[]]]),
      A("frequencia-estavel","Frequência estável","ranking_frequencia","itens","Ordene por frequência decrescente e, em empate, pela primeira aparição.",[[[["b","a","b","a","c"]],["b","a","c"]],[[[]],[]],[[[1,2,2,1]],[1,2]]])
    ]},
    { slug:"qualidade-debug", title:"Qualidade, testes e depuração", copy:[223,224], concepts:"casos extremos, invariantes, funções testáveis e diagnóstico", example:"if not dados:\n    return resultado_vazio\n# mantenha o contrato em todos os caminhos", add:[
      A("reconciliar-saldos","Reconciliação de saldos","reconciliar","inicial, movimentos, esperado","Aplique movimentos e informe saldo final, diferença e se confere.",[[[100,[20,-10],110],{saldo:110,diferenca:0,confere:true}],[[0,[5],10],{saldo:5,diferenca:-5,confere:false}]]),
      A("detectar-anomalias","Detecção de anomalias","detectar_anomalias","valores, limite","Retorne índices e valores cuja distância da média ultrapasse o limite.",[[[[10,10,30],10],[{indice:2,valor:30}]],[[[1,1,1],0],[]],[[[],5],[]]]),
      A("auditar-registros","Auditoria de registros","auditar_registros","registros","Separe registros válidos e erros detalhados por posição e campo.",[[[[{id:1,valor:10},{id:null,valor:-1}]],{validos:[{id:1,valor:10}],erros:[{indice:1,campos:["id","valor"]}]}],[[[]],{validos:[],erros:[]}]])
    ]}
  ], A("boss-confiabilidade-v2","Importador confiável","importar_dados","linhas_json","Processe um lote JSON sem interromper em erros, normalize registros, elimine duplicatas e gere relatório.",[[[["{\"id\":1,\"nome\":\" Ada \"}","x","{\"id\":1,\"nome\":\"Ada\"}"]],{registros:[{id:1,nome:"Ada"}],erros:[1],duplicados:1}],[[[]],{registros:[],erros:[],duplicados:0}],[[["{\"id\":2,\"nome\":\" Bia \"}","{\"id\":3,\"nome\":\"Caio\"}"]],{registros:[{id:2,nome:"Bia"},{id:3,nome:"Caio"}],erros:[],duplicados:0}]])),

  Z("cidadela-dos-objetos", "Cidadela dos Objetos", "/materials/python/zona-5-objetos.pdf", [
    { slug:"classes-encapsulamento", title:"Classes e encapsulamento", copy:[225,226], concepts:"instâncias, estado, métodos, propriedades e invariantes", example:"class Conta:\n    def __init__(self, saldo=0):\n        self._saldo = saldo", add:[
      A("conta-limite","Conta com limite","simular_conta","saldo, limite, operacoes","Modele depósitos e saques, rejeitando saque além do limite.",[[[100,50,[-120,20]],{saldo:0,rejeitadas:0}],[[0,10,[-20,5]],{saldo:5,rejeitadas:1}]]),
      A("produto-validado","Produto validado","atualizar_produto","preco, alteracoes","Use propriedade para impedir preços negativos e conte alterações rejeitadas.",[[[10,[20,-1,15]],{preco:15,rejeitadas:1}],[[5,[]],{preco:5,rejeitadas:0}]]),
      A("carrinho-objeto","Carrinho orientado a objetos","resumir_carrinho","itens","Modele itens, calcule subtotal, quantidade e produto mais caro.",[[[[{nome:"A",preco:10,qtd:2},{nome:"B",preco:15,qtd:1}]],{subtotal:35,quantidade:3,mais_caro:"B"}],[[[]],{subtotal:0,quantidade:0,mais_caro:null}]])
    ]},
    { slug:"heranca-polimorfismo", title:"Herança e polimorfismo", copy:[227,228], concepts:"classes base, especialização, sobrescrita e interfaces comuns", example:"class Forma:\n    def area(self):\n        raise NotImplementedError", add:[
      A("folha-pagamento","Folha polimórfica","calcular_folha","funcionarios","Modele mensalistas e horistas com o mesmo método de pagamento.",[[[[{tipo:"mensal",salario:3000},{tipo:"hora",horas:10,valor_hora:20}]],{total:3200,pagamentos:[3000,200]}],[[[]],{total:0,pagamentos:[]}]]),
      A("notificacoes","Notificações polimórficas","enviar_notificacoes","mensagens","Formate e-mail e SMS por implementações especializadas.",[[[[{canal:"email",destino:"a@b.com",texto:"Oi"},{canal:"sms",destino:"119",texto:"Olá"}]],["EMAIL a@b.com: Oi","SMS 119: Olá"]],[[[]],[]]]),
      A("descontos-polimorficos","Descontos polimórficos","aplicar_planos","compras","Aplique regras normal, vip e atacado por uma interface comum.",[[[[{plano:"normal",total:100},{plano:"vip",total:100},{plano:"atacado",total:100}]], [100,90,80]],[[[]],[]]])
    ]},
    { slug:"composicao-dataclasses", title:"Composição e dataclasses", copy:[229,230], concepts:"objetos colaboradores, dataclasses, agregados e imutabilidade", example:"@dataclass\nclass Item:\n    nome: str\n    preco: float", add:[
      A("pedido-composto","Pedido composto","montar_pedido","cliente, itens","Use dataclasses para montar pedido com subtotal e quantidade total.",[[["Ana",[{nome:"A",preco:10,qtd:2}]],{cliente:"Ana",subtotal:20,quantidade:2}],[["Bia",[]],{cliente:"Bia",subtotal:0,quantidade:0}]]),
      A("agenda-composta","Agenda composta","resumir_agenda","eventos","Modele eventos e agenda, ordene horários e detecte conflitos iguais.",[[[[{titulo:"B",hora:"10:00"},{titulo:"A",hora:"09:00"},{titulo:"C",hora:"10:00"}]],{ordem:["A","B","C"],conflitos:["10:00"]}],[[[]],{ordem:[],conflitos:[]}]]),
      A("estoque-com-servico","Estoque com serviço","processar_estoque","produtos, movimentos","Componha catálogo e serviço de estoque, rejeitando produto ausente ou saldo negativo.",[[[[{codigo:"A",qtd:2}],[{codigo:"A",qtd:-1},{codigo:"B",qtd:1}]],{estoque:{A:1},rejeitadas:1}],[[[],[]],{estoque:{},rejeitadas:0}]])
    ]},
    { slug:"iteracao-preguicosa", title:"Iteradores e geradores", copy:[231,232], concepts:"protocolo iterador, yield, pipelines preguiçosos e memória", example:"def lotes(itens, tamanho):\n    for inicio in range(0, len(itens), tamanho):\n        yield itens[inicio:inicio+tamanho]", add:[
      A("gerador-lotes","Gerador de lotes","gerar_lotes","itens, tamanho","Implemente um gerador de lotes, incluindo o último lote parcial.",[[[[1,2,3,4,5],2],[[1,2],[3,4],[5]]],[[[],3],[]],[[[1,2],5],[[1,2]]]],{generator:true}),
      A("sequencia-fibonacci","Fibonacci preguiçoso","fibonacci","quantidade","Gere a quantidade solicitada de números de Fibonacci.",[[[6],[0,1,1,2,3,5]],[[0],[]],[[1],[0]]],{generator:true}),
      A("pipeline-geradores","Pipeline de geradores","processar_stream","valores","Use geradores para filtrar positivos, dobrar e limitar aos cinco primeiros resultados.",[[[[1,-1,2,3,4,5,6]],[2,4,6,8,10]],[[[]],[]]])
    ]}
  ], A("boss-objetos-v2","Sistema de locadora","processar_locadora","itens, clientes, operacoes","Modele catálogo, clientes e empréstimos com composição, polimorfismo e relatório final.",[[[["A","B"],["Ana"],[{acao:"emprestar",cliente:"Ana",item:"A"}]],{disponiveis:["B"],emprestimos:{Ana:["A"]},erros:[]}],[[["A"],["Ana"],[{acao:"emprestar",cliente:"X",item:"A"}]],{disponiveis:["A"],emprestimos:{Ana:[]},erros:[0]}],[[[],["Ana"],[]],{disponiveis:[],emprestimos:{Ana:[]},erros:[]}]])),

  Z("nucleo-profissional", "Núcleo Profissional", "/materials/python/zona-6-profissional.pdf", [
    { slug:"decoradores-contextos", title:"Decoradores, contextos e tipos", copy:[233,234], concepts:"wrappers, context managers, type hints e contratos", example:"def auditar(funcao):\n    def wrapper(*args, **kwargs):\n        return funcao(*args, **kwargs)\n    return wrapper", add:[
      A("cache-decorador","Cache por decorador","executar_com_cache","valores","Decore uma função cara, retorne resultados e quantidade real de execuções.",[[[[2,2,3]],{resultados:[4,4,9],execucoes:2}],[[[]],{resultados:[],execucoes:0}]]),
      A("transacao-contexto","Transação com rollback","simular_transacao","saldo, operacoes","Use context manager e reverta todas as operações se o saldo ficar negativo.",[[[100,[-20,10]],{saldo:90,status:"confirmada"}],[[10,[-20,5]],{saldo:10,status:"revertida"}]]),
      A("contratos-tipados","Contratos tipados","normalizar_payload","payload","Normalize campos tipados, aplique padrões e relate campos inválidos.",[[[{id:"2",ativo:1,tags:["Py","Web"]}],{dados:{id:2,ativo:true,tags:["py","web"]},erros:[]}],[[{id:"x"}],{dados:null,erros:["id"]}]])
    ]},
    { slug:"arquitetura-dependencias", title:"Arquitetura e dependências", copy:[235,236], concepts:"camadas, injeção de dependência, coesão e separação de responsabilidades", example:"def executar(repositorio, regra):\n    dados = repositorio.listar()\n    return regra(dados)", add:[
      A("servico-injetado","Serviço com dependência injetada","executar_servico","registros, modo","Separe repositório, regra de negócio e apresentação para resumir registros.",[[[[{ativo:true,valor:10},{ativo:false,valor:20}],"resumo"],{quantidade:1,total:10}],[[[],"resumo"],{quantidade:0,total:0}]]),
      A("casos-de-uso","Casos de uso","processar_comandos","estado, comandos","Implemente comandos adicionar, remover e listar sem misturar validação e domínio.",[[[["A"],[{acao:"adicionar",item:"B"},{acao:"remover",item:"A"}]],{itens:["B"],erros:[]}],[[[],[{acao:"remover",item:"X"}]],{itens:[],erros:[0]}]]),
      A("adaptador-dados","Adaptador de dados","adaptar_registros","origem, registros","Converta formatos legado e novo para um modelo de domínio único.",[[["legado",[{codigo:1,nome_produto:"A"}]],[{id:1,nome:"A"}]],[["novo",[{id:2,nome:"B"}]],[{id:2,nome:"B"}]],[["x",[]],[]]])
    ]},
    { slug:"algoritmos-desempenho", title:"Algoritmos e desempenho", copy:[237,238], concepts:"complexidade, índices, processamento linear e estruturas adequadas", example:"vistos = set()\nfor item in itens:\n    if item in vistos:\n        return True\n    vistos.add(item)", add:[
      A("primeiro-duplicado","Primeiro duplicado","primeiro_duplicado","valores","Encontre em tempo linear o primeiro valor que aparece novamente.",[[[[1,2,3,2,1]],2],[[[1,2,3]],null],[[[]],null]]),
      A("duas-somas","Duas somas","encontrar_par","valores, alvo","Retorne os índices do primeiro par que soma o alvo em tempo linear.",[[[[2,7,11,15],9],[0,1]],[[[3,2,4],6],[1,2]],[[[1],2],[]]]),
      A("janela-maxima","Maior soma em janela","maior_janela","valores, tamanho","Use janela deslizante para retornar maior soma e índice inicial.",[[[[1,4,2,10,2],2],{soma:12,inicio:2}],[[[5],1],{soma:5,inicio:0}],[[[1,2],3],null]])
    ]},
    { slug:"assincrono-producao", title:"Assíncrono, testes e produção", copy:[239,240], concepts:"async, await, concorrência, observabilidade e código testável", example:"resultados = await asyncio.gather(*(processar(item) for item in itens))", add:[
      A("coletor-assincrono","Coletor assíncrono","coletar","valores","Processe itens concorrentemente, preserve a ordem e capture erros por item.",[[[[1,-1,2]],[{ok:true,valor:2},{ok:false,erro:"negativo"},{ok:true,valor:4}]],[[[]],[]]],{async:true}),
      A("retry-assincrono","Retry assíncrono","executar_com_retry","falhas_antes_sucesso, tentativas","Simule tentativas assíncronas e informe sucesso e quantidade executada.",[[[2,3],{sucesso:true,tentativas:3}],[[3,2],{sucesso:false,tentativas:2}],[[0,1],{sucesso:true,tentativas:1}]],{async:true}),
      A("metricas-lote","Métricas de processamento","processar_com_metricas","itens","Valide um lote e retorne resultados, erros, duração lógica e taxa de sucesso.",[[[[2,"x",4]],{resultados:[4,8],erros:[1],processados:3,taxa_sucesso:66.67}],[[[]],{resultados:[],erros:[],processados:0,taxa_sucesso:0}]])
    ]}
  ], A("boss-profissional-v2","Pipeline profissional","pipeline_profissional","eventos, configuracao","Combine validação, arquitetura, eficiência, concorrência simulada e métricas em um relatório final.",[[[[{id:1,tipo:"compra",valor:30},{id:2,tipo:"erro",valor:0},{id:1,tipo:"compra",valor:30}],{limite:100}],{receita:30,compras:1,erros:1,duplicados:1,acima_limite:false}],[[[],{}],{receita:0,compras:0,erros:0,duplicados:0,acima_limite:false}],[[[{id:3,tipo:"compra",valor:150}],{limite:100}],{receita:150,compras:1,erros:0,duplicados:0,acima_limite:true}]]))
];

const esc = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => esc(JSON.stringify(value));
const sql = [
  "UPDATE missions SET status='deprecated' WHERE skill_id IN (SELECT id FROM skills WHERE learning_path_id=5);",
  "UPDATE skills SET status='deprecated' WHERE learning_path_id=5;",
  "UPDATE learning_paths SET version=2,description='24 materiais de estudo e 126 batalhas em 150 etapas, do básico ao profissional.' WHERE id=5;",
];
let lessonId = 5001;
let skillId = 5001;
let missionId = 6001;
let previousZoneBoss = null;
const allMissions = [];

function addMission({ task, zone, zoneId, skill, localOrder, globalOrder, type="enemy", sourceId=null }) {
  const id = missionId++;
  const slug = `py2-${sourceId ? `${task.slug}-treino` : task.slug}`;
  const xp = type === "boss" ? 320 : type === "elite" ? 175 : 120 + (zoneId - 25) * 15;
  const difficulty = zoneId === 25 ? "beginner" : zoneId === 26 ? "easy" : zoneId < 29 ? "medium" : "hard";
  if (sourceId) {
    sql.push(`INSERT INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug)
      SELECT ${id},${skill},${esc(slug)},title,'Batalha prática após o material de estudo.',objective,starter_code,function_name,parameters_json,'python','python-pyodide-1','${difficulty}',2,'published',${xp},${globalOrder},NULL FROM missions WHERE id=${sourceId};`);
    sql.push(`INSERT INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) SELECT ${id},name,input_json,expected_json,is_private,sort_order FROM mission_tests WHERE mission_id=${sourceId};`);
    if (sourceId === 238) sql.push(`UPDATE missions SET starter_code='async def processar_lote(valores):\n    # Escreva sua solução\n    pass' WHERE id=${id};`);
  } else {
    const prefix = task.async ? "async " : "";
    const starter = `${prefix}def ${task.fn}(${task.args}):\n    # Escreva sua solução\n    pass`;
    sql.push(`INSERT INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug) VALUES (${id},${skill},${esc(slug)},${esc(task.title)},'Batalha prática após o material de estudo.',${esc(task.objective)},${esc(starter)},${esc(task.fn)},'{}','python','python-pyodide-1','${difficulty}',2,'published',${xp},${globalOrder},NULL);`);
    task.tests.forEach(([input, expected], index) => sql.push(`INSERT INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) VALUES (${id},${esc(`Cenário ${index + 1}`)},${json(input)},${json(expected)},1,${index + 1});`));
  }
  const label = type === "boss" ? "Guardião" : type === "elite" ? "Elite" : "Bug";
  sql.push(`INSERT INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order) VALUES (${id},${zoneId},${esc(zone.slug)},${esc(`${label} de ${task.title}`)},'${type}',${globalOrder},${esc(`Use o material ${zone.modules[Math.min(3, Math.floor((localOrder - 2) / 6))]?.title ?? zone.title} e divida o problema em funções pequenas.`)},${esc(`A corrupção transformou ${task.title.toLowerCase()} em um desafio de produção.`)},'Aplique o conteúdo estudado e passe por todos os cenários do backend.',${type === "boss" ? esc("O chefe reúne todos os conteúdos da zona em um único problema.") : "''"},${type === "boss" ? esc("Zona restaurada. O próximo material foi liberado.") : "''"},${localOrder});`);
  allMissions.push({ id, slug });
  return { id, slug };
}

zones.forEach((zone, zoneIndex) => {
  const zoneId = 25 + zoneIndex;
  let previousBlockLast = previousZoneBoss;
  zone.modules.forEach((module, blockIndex) => {
    const resource = resources[module.slug];
    const currentSkill = skillId++;
    const currentLesson = lessonId++;
    const lessonOrder = blockIndex * 6 + 1;
    const lessonGlobalOrder = zoneIndex * 25 + lessonOrder;
    sql.push(`INSERT INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES (${currentSkill},5,${esc(`py2-${module.slug}`)},${esc(module.title)},${esc(module.concepts)},0,${lessonGlobalOrder},'published');`);
    const tasks = [
      { sourceId: module.copy[0], task: { slug: oldSlug(module.copy[0]), title: `${module.title} I` } },
      { sourceId: module.copy[1], task: { slug: oldSlug(module.copy[1]), title: `${module.title} II` } },
      ...module.add.map((task) => ({ sourceId: null, task })),
    ];
    const created = tasks.map(({ task, sourceId }, taskIndex) => addMission({ task, sourceId, zone, zoneId, skill: currentSkill, localOrder: lessonOrder + taskIndex + 1, globalOrder: lessonGlobalOrder + taskIndex + 1, type: taskIndex === 4 ? "elite" : "enemy" }));
    const body = {
      introduction: `Estude ${module.concepts} antes de iniciar as cinco batalhas deste bloco.`,
      sections: [
        { title: "Conceitos centrais", text: `${module.title} conecta ${module.concepts}. Entenda o fluxo dos dados, mantenha contratos claros e trate entradas vazias ou inválidas.` },
        { title: "Estratégia de resolução", text: "Leia a assinatura, identifique entradas e saída, quebre o problema em passos menores e teste limites antes de atacar." },
        { title: "Aplicação profissional", text: "As últimas batalhas combinam múltiplas regras, validação e transformação de dados para aproximar o exercício de código real." },
      ],
      exampleCode: module.example,
      keyPoints: [module.concepts, "Contratos de entrada e saída", "Casos extremos e legibilidade", "Decomposição e testes"],
      practiceObjectives: tasks.map(({ task }, index) => `${index + 1}. ${task.title}`),
      pdfUrl: zone.pdf,
      videoUrl: resource[0],
      videoLabel: `Vídeo: ${module.title}`,
      references: [
        { label: resource[2], url: `${docs}${resource[1]}` },
        { label: "Tutorial oficial do Python (PT-BR)", url: `${docs}tutorial/` },
      ],
    };
    sql.push(`INSERT INTO lessons (id,skill_id,slug,title,body_json,zone_id,prerequisite_mission_id,first_mission_id,sort_order,status) VALUES (${currentLesson},${currentSkill},${esc(`estudo-${module.slug}`)},${esc(module.title)},${json(body)},${zoneId},${previousBlockLast?.id ?? "NULL"},${created[0].id},${lessonOrder},'published');`);
    sql.push(`INSERT INTO mission_lesson_prerequisites (mission_id,lesson_id) VALUES (${created[0].id},${currentLesson});`);
    for (let index = 1; index < created.length; index++) sql.push(`INSERT INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${created[index].id},${created[index - 1].id});`);
    for (let index = 0; index < created.length - 1; index++) sql.push(`UPDATE missions SET next_mission_slug=${esc(created[index + 1].slug)} WHERE id=${created[index].id};`);
    previousBlockLast = created.at(-1);
  });
  const bossSkill = skillId++;
  const bossOrder = zoneIndex * 25 + 25;
  sql.push(`INSERT INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES (${bossSkill},5,${esc(`py2-${zone.boss.slug}`)},${esc(zone.boss.title)},'Integração completa da zona',320,${bossOrder},'published');`);
  const boss = addMission({ task: zone.boss, zone, zoneId, skill: bossSkill, localOrder: 25, globalOrder: bossOrder, type:"boss" });
  sql.push(`INSERT INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${boss.id},${previousBlockLast.id});`);
  sql.push(`UPDATE missions SET next_mission_slug=${esc(boss.slug)} WHERE id=${previousBlockLast.id};`);
  sql.push(`UPDATE campaign_zones SET boss_mission_id=${boss.id} WHERE id=${zoneId};`);
  previousZoneBoss = boss;
});

sql.push("PRAGMA optimize;");
writeFileSync(join(process.cwd(), "drizzle", "0015_python_course_v2.sql"), `-- Generated by scripts/generate-python-course-v2.mjs\n${sql.join("\n--> statement-breakpoint\n")}\n`);
console.log(`Generated 24 study materials and ${allMissions.length} Python battles (${24 + allMissions.length} stages).`);

function oldSlug(id) {
  const slugs = ["py-primeira-funcao","py-variaveis-tipos","py-operadores","py-strings","py-booleanos","py-condicionais","py-repeticoes","py-fundamentos-boss","py-listas","py-fatiamento","py-conjuntos","py-dicionarios","py-dados-aninhados","py-compreensoes","py-matrizes","py-colecoes-boss","py-parametros-padrao","py-args","py-kwargs","py-escopo","py-lambda","py-alta-ordem","py-recursao","py-funcoes-boss","py-excecoes","py-excecao-customizada","py-json","py-regex","py-datas","py-counter","py-estatistica","py-confiabilidade-boss","py-classes","py-propriedades","py-heranca","py-composicao","py-dataclasses","py-iteradores","py-geradores","py-objetos-boss","py-decoradores","py-context-manager","py-type-hints","py-arquitetura","py-complexidade","py-assincrono","py-testabilidade","py-profissional-boss"];
  return slugs[id - 193];
}
