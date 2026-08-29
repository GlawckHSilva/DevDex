from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
PUBLIC = ROOT / "public" / "materials" / "python"
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

ZONES = [
    ("zona-1-fundamentos.pdf", "Zona 1 - Terminal dos Fundamentos", [
        ("Sintaxe, valores e funções", "Funções, variáveis, tipos numéricos e retorno", "def calcular_total(preco, quantidade):\n    subtotal = preco * quantidade\n    return subtotal"),
        ("Texto, operadores e lógica", "Operadores, strings, normalização e expressões booleanas", "nome = texto.strip().title()\nativo = idade >= 18 and not bloqueado"),
        ("Decisões e repetições", "Comparações, if, elif, for, range e acumulação", "total = 0\nfor valor in valores:\n    if valor > 0:\n        total += valor"),
        ("Funções para resolver problemas", "Decomposição, casos extremos e contratos", "def media_segura(valores):\n    return sum(valores) / len(valores) if valores else 0"),
    ]),
    ("zona-2-colecoes.pdf", "Zona 2 - Floresta das Coleções", [
        ("Listas, tuplas e sequências", "Índices, slices, cópias e transformações", "ultimos = valores[-3:]\nprimeiro, *meio, ultimo = valores"),
        ("Conjuntos e dicionários", "Unicidade, operações de conjunto, chaves e contagens", "frequencias = {}\nfor item in itens:\n    frequencias[item] = frequencias.get(item, 0) + 1"),
        ("Compreensões e dados aninhados", "Filtros, estruturas aninhadas e matrizes", "pares = [x * x for x in valores if x % 2 == 0]"),
        ("Ordenação, busca e agrupamento", "Sorted, chaves compostas, agrupamento e rankings", "ordenados = sorted(itens, key=lambda x: (-x['pontos'], x['nome']))"),
    ]),
    ("zona-3-funcoes.pdf", "Zona 3 - Forja das Funções", [
        ("Assinaturas flexíveis", "Parâmetros padrão, argumentos nomeados e *args", "def totalizar(*valores, taxa=0):\n    return sum(valores) * (1 + taxa)"),
        ("Pureza, escopo e closures", "Escopo local, imutabilidade, closures e lambdas", "def criar_multiplicador(fator):\n    return lambda valor: valor * fator"),
        ("Alta ordem e pipelines", "Funções como valores, map, filter e composição", "validos = filter(validar, dados)\nresultado = map(transformar, validos)"),
        ("Recursão e decomposição", "Caso base, divisão do problema e funções pequenas", "def soma_aninhada(valor):\n    if isinstance(valor, list):\n        return sum(soma_aninhada(x) for x in valor)\n    return valor"),
    ]),
    ("zona-4-confiabilidade.pdf", "Zona 4 - Arquivo da Confiabilidade", [
        ("Erros e contratos", "Try, except, erros de domínio e mensagens úteis", "try:\n    valor = int(texto)\nexcept (TypeError, ValueError):\n    return None"),
        ("JSON, regex e datas", "Serialização, padrões e validação de formatos", "dados = json.loads(texto)\nvalido = re.fullmatch(padrao, valor)"),
        ("Biblioteca padrão e estatística", "Datetime, Counter, statistics e relatórios", "from collections import Counter\nmais_comum = Counter(itens).most_common(1)"),
        ("Qualidade, testes e depuração", "Casos extremos, invariantes e diagnóstico", "if not dados:\n    return resultado_vazio\n# preserve o contrato"),
    ]),
    ("zona-5-objetos.pdf", "Zona 5 - Cidadela dos Objetos", [
        ("Classes e encapsulamento", "Instâncias, estado, métodos, propriedades e invariantes", "class Conta:\n    def __init__(self, saldo=0):\n        self._saldo = saldo"),
        ("Herança e polimorfismo", "Classes base, especialização e interfaces comuns", "class Forma:\n    def area(self):\n        raise NotImplementedError"),
        ("Composição e dataclasses", "Objetos colaboradores, agregados e imutabilidade", "@dataclass\nclass Item:\n    nome: str\n    preco: float"),
        ("Iteradores e geradores", "Protocolo iterador, yield e memória", "def lotes(itens, tamanho):\n    for inicio in range(0, len(itens), tamanho):\n        yield itens[inicio:inicio+tamanho]"),
    ]),
    ("zona-6-profissional.pdf", "Zona 6 - Núcleo Profissional", [
        ("Decoradores, contextos e tipos", "Wrappers, context managers e type hints", "def auditar(funcao):\n    def wrapper(*args, **kwargs):\n        return funcao(*args, **kwargs)\n    return wrapper"),
        ("Arquitetura e dependências", "Camadas, injeção de dependência e coesão", "def executar(repositorio, regra):\n    dados = repositorio.listar()\n    return regra(dados)"),
        ("Algoritmos e desempenho", "Complexidade, índices e estruturas adequadas", "vistos = set()\nfor item in itens:\n    if item in vistos:\n        return True\n    vistos.add(item)"),
        ("Assíncrono, testes e produção", "Async, await, concorrência e observabilidade", "resultados = await asyncio.gather(*(processar(x) for x in itens))"),
    ]),
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=colors.HexColor("#16A6B6"), alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=28, leading=34, textColor=colors.HexColor("#13233A"), alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=25, textColor=colors.HexColor("#30205F"), spaceAfter=12))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=colors.HexColor("#087E8B"), spaceBefore=10, spaceAfter=7))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.3, leading=16, textColor=colors.HexColor("#334155"), spaceAfter=9))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=colors.HexColor("#64748B")))

def page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(colors.HexColor("#08111F"))
    canvas.rect(0, h - 15*mm, w, 15*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#61E6E1"))
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(18*mm, h - 9.5*mm, "DEVDEX  |  PYTHON - CODIGO DA SERPENTE")
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 18*mm, 10*mm, f"Pagina {doc.page}")
    canvas.restoreState()

def build(filename, zone_title, modules):
    target = OUT / filename
    story = []
    story += [Spacer(1, 27*mm), Paragraph("GUIA OFICIAL DE ESTUDO", styles["CoverKicker"]), Paragraph(zone_title, styles["CoverTitle"]), Paragraph("Quatro blocos de estudo. Vinte batalhas práticas. Um chefe de integração.", styles["Bodyx"]), Spacer(1, 10*mm)]
    rows = [[f"{i+1:02d}", title, concepts] for i, (title, concepts, _) in enumerate(modules)]
    table = Table(rows, colWidths=[13*mm, 52*mm, 92*mm], hAlign="CENTER")
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F4F7FB")),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#CAD5E2")),("TEXTCOLOR",(0,0),(0,-1),colors.HexColor("#6D3BD1")),("FONTNAME",(0,0),(1,-1),"Helvetica-Bold"),("FONTNAME",(2,0),(2,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.2),("LEADING",(0,0),(-1,-1),11),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("PADDING",(0,0),(-1,-1),8)]))
    story += [table, PageBreak()]
    for index, (title, concepts, code) in enumerate(modules, 1):
        story += [Paragraph(f"BLOCO {index:02d}", styles["CoverKicker"]), Paragraph(title, styles["H1x"]), Paragraph(concepts, styles["Bodyx"]), Paragraph("Como estudar", styles["H2x"]), Paragraph("Leia a assinatura do problema, identifique entradas e saída e transforme o objetivo em passos pequenos. Antes de atacar, teste casos comuns, entrada vazia, limites e dados inválidos.", styles["Bodyx"]), Paragraph("Exemplo guiado", styles["H2x"]), Preformatted(code, ParagraphStyle("Code", fontName="Courier", fontSize=8.6, leading=13, textColor=colors.HexColor("#102A43"), backColor=colors.HexColor("#EDF2F7"), borderPadding=11, spaceAfter=12)), Paragraph("Batalhas deste bloco", styles["H2x"]), Paragraph("As duas primeiras batalhas fixam o conceito. As duas seguintes combinam regras e transformações. A quinta é uma elite com múltiplos cenários e casos extremos.", styles["Bodyx"]), Paragraph("Checklist", styles["H2x"]), Paragraph("- Entendi o contrato da função.<br/>- Consigo explicar cada etapa sem copiar o exemplo.<br/>- Testei entradas vazias e inválidas.<br/>- O código está legível e não altera dados de entrada sem necessidade.", styles["Bodyx"]), PageBreak()]
    story += [Paragraph("Preparação para o chefe", styles["H1x"]), Paragraph("Revise os quatro blocos e pratique a combinação de validação, transformação, agregação e relatório. O chefe não apresenta uma solução pronta: ele exige decomposição em funções pequenas e um resultado final previsível.", styles["Bodyx"]), Spacer(1, 8*mm), Paragraph("Referências", styles["H2x"]), Paragraph("Python Tutorial: https://docs.python.org/3/tutorial/<br/>Microsoft Learn - Python for Beginners: https://learn.microsoft.com/en-us/shows/intro-to-python-development/", styles["Smallx"])]
    doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=23*mm, bottomMargin=18*mm, title=zone_title, author="DevDex")
    doc.build(story, onFirstPage=page, onLaterPages=page)
    (PUBLIC / filename).write_bytes(target.read_bytes())

for item in ZONES:
    build(*item)
print(f"Generated {len(ZONES)} Python study guides.")
