import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / "scripts" / "core-courses-outline.json").read_text(encoding="utf-8"))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Kicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=colors.HexColor("#15A6B8"), alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="Cover", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=30, leading=35, textColor=colors.HexColor("#16233A"), alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=19, leading=24, textColor=colors.HexColor("#38206E"), spaceAfter=8))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=colors.HexColor("#087E8B"), spaceBefore=5, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.7, leading=14.5, textColor=colors.HexColor("#334155"), spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.3, leading=11.5, textColor=colors.HexColor("#64748B")))
code_style = ParagraphStyle("Code", fontName="Courier", fontSize=7.5, leading=10.5, textColor=colors.HexColor("#102A43"), backColor=colors.HexColor("#EDF2F7"), borderPadding=8, spaceAfter=7)


def page(course_name):
    def draw(canvas, doc):
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(colors.HexColor("#08111F"))
        canvas.rect(0, height - 15 * mm, width, 15 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#61E6E1"))
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(18 * mm, height - 9.5 * mm, f"DEVDEX  |  {course_name.upper()} - DO BASICO AO PROFISSIONAL")
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(width - 18 * mm, 10 * mm, f"Pagina {doc.page}")
        canvas.restoreState()
    return draw


def build(course):
    target = OUT / Path(course["pdf"]).name
    public = ROOT / "public" / "materials" / course["key"] / target.name
    public.parent.mkdir(parents=True, exist_ok=True)
    story = [Spacer(1, 28 * mm), Paragraph("GUIA COMPLETO DE ESTUDO", styles["Kicker"]), Paragraph(course["name"], styles["Cover"]), Paragraph("6 zonas - 24 materiais - 126 batalhas - 150 etapas", styles["Bodyx"]), Spacer(1, 9 * mm)]
    rows = [[f"ZONA {index + 1:02d}", " / ".join(module[1] for module in zone["modules"])] for index, zone in enumerate(course["zones"])]
    table = Table(rows, colWidths=[27 * mm, 127 * mm])
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F7FB")), ("GRID", (0, 0), (-1, -1), .4, colors.HexColor("#CAD5E2")), ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#6D3BD1")), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("FONTNAME", (1, 0), (1, -1), "Helvetica"), ("FONTSIZE", (0, 0), (-1, -1), 8), ("LEADING", (0, 0), (-1, -1), 11), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("PADDING", (0, 0), (-1, -1), 7)]))
    story.extend([table, PageBreak()])

    for zone_index, zone in enumerate(course["zones"]):
        for module_index, module in enumerate(zone["modules"]):
            if module_index in (0, 2):
                story.extend([Paragraph(f"ZONA {zone_index + 1:02d}", styles["Kicker"]), Paragraph("Fundamentos e pratica progressiva", styles["H1x"])])
            slug, title, concepts, example, resource = module
            story.extend([
                Paragraph(f"BLOCO {module_index + 1:02d} - {title}", styles["H2x"]),
                Paragraph(concepts, styles["Bodyx"]),
                Paragraph("Exemplo guiado", styles["H2x"]),
                Preformatted(example, code_style),
                Paragraph("Metodo de estudo", styles["H2x"]),
                Paragraph("Leia o objetivo, reproduza o exemplo com suas palavras e altere um detalhe por vez. Depois feche o guia e resolva novamente sem copiar. As cinco batalhas avancam de reconhecimento para aplicacao, reforco e integracao.", styles["Bodyx"]),
                Paragraph(f"Referencia: {resource}", styles["Smallx"]),
                Spacer(1, 4 * mm),
            ])
            if module_index in (1, 3):
                story.append(PageBreak())

    story.extend([
        Paragraph("Preparacao profissional", styles["H1x"]),
        Paragraph("Antes de cada chefe, revise os quatro blocos da zona. Explique o que cada parte da solucao faz, teste entradas comuns e limites, e confirme que o resultado respeita o contrato pedido. No nivel profissional, clareza, previsibilidade, acessibilidade e manutencao valem tanto quanto obter a resposta correta.", styles["Bodyx"]),
        Paragraph("Checklist final", styles["H2x"]),
        Paragraph("- Consigo resolver sem copiar o exemplo.<br/>- Sei justificar as escolhas tecnicas.<br/>- Testei casos comuns, vazios e limites.<br/>- Minha solucao esta legivel e organizada.<br/>- Consultei a fonte oficial quando tive duvida.", styles["Bodyx"]),
        Paragraph("Fonte curricular", styles["H2x"]),
        Paragraph(f"{course['referenceLabel']}: {course['referenceRoot']}", styles["Smallx"]),
    ])
    document = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=23 * mm, bottomMargin=18 * mm, title=f"DevDex - {course['name']}", author="DevDex")
    draw = page(course["name"])
    document.build(story, onFirstPage=draw, onLaterPages=draw)
    public.write_bytes(target.read_bytes())


for item in DATA["courses"]:
    build(item)
print(f"Generated {len(DATA['courses'])} complete study guides.")
