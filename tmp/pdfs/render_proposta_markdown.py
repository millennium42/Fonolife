from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "output" / "pdf" / "proposta-tecnica-software-clinico-comercial-2026-07-30.md"
TARGET = ROOT / "output" / "pdf" / "proposta-tecnica-software-clinico-comercial-modelo-fonoclinica-2026-07-30.pdf"


def parse_source(text: str):
    title = ""
    meta = ""
    sections = []
    current = None
    paragraph_lines = []

    def flush_paragraph():
        nonlocal paragraph_lines, current
        if current is not None and paragraph_lines:
            paragraph = " ".join(line.strip() for line in paragraph_lines if line.strip())
            if paragraph:
                current["paragraphs"].append(paragraph)
        paragraph_lines = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if line.startswith("# "):
            title = line[2:].strip()
            continue
        if line.startswith("**Data:**"):
            meta = line.replace("**", "").strip()
            continue
        if line.startswith("## "):
            flush_paragraph()
            if current is not None:
                sections.append(current)
            current = {"title": line[3:].strip(), "paragraphs": []}
            continue
        if not line.strip():
            flush_paragraph()
            continue
        paragraph_lines.append(line)

    flush_paragraph()
    if current is not None:
        sections.append(current)

    return title, meta, sections


def draw_polygon(canvas, points, fill_color):
    path = canvas.beginPath()
    path.moveTo(points[0][0], points[0][1])
    for x, y in points[1:]:
        path.lineTo(x, y)
    path.close()
    canvas.setFillColor(fill_color)
    canvas.setStrokeColor(fill_color)
    canvas.drawPath(path, fill=1, stroke=0)


def draw_cover(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)

    draw_polygon(
        canvas,
        [(width * 0.80, height), (width, height), (width, 0), (width * 0.86, 0), (width * 0.69, height * 0.52)],
        colors.HexColor("#2ea6d6"),
    )
    draw_polygon(
        canvas,
        [(width * 0.82, height), (width * 0.96, height * 0.74), (width * 0.86, height * 0.55), (width * 0.74, height * 0.76)],
        colors.HexColor("#168fc1"),
    )
    draw_polygon(
        canvas,
        [(width * 0.82, height * 0.43), (width * 0.98, height * 0.43), (width * 0.90, height * 0.27)],
        colors.HexColor("#1c97cc"),
    )
    draw_polygon(
        canvas,
        [(width * 0.76, height * 0.18), (width * 0.90, 0), (width * 0.68, 0)],
        colors.HexColor("#2199ce"),
    )

    canvas.restoreState()


def draw_content_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.setFillColor(colors.HexColor("#76a9de"))
    canvas.drawCentredString(width / 2, height - 18 * mm, "PROPOSTA TECNICA DE SOFTWARE")
    canvas.setStrokeColor(colors.HexColor("#d0d7df"))
    canvas.setLineWidth(0.8)
    canvas.line(doc.leftMargin, 16 * mm, width - doc.rightMargin, 16 * mm)
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=34,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17324d"),
            spaceAfter=10,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#3f5872"),
        ),
        "section_title": ParagraphStyle(
            "SectionTitle",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#76a9de"),
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11.5,
            leading=16,
            textColor=colors.HexColor("#111111"),
            alignment=TA_JUSTIFY,
        ),
        "value": ParagraphStyle(
            "Value",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#111111"),
            alignment=TA_LEFT,
        ),
    }


def build_section_box(section, styles, width):
    rows = [[Paragraph(section["title"], styles["section_title"])]]
    paragraph_style = styles["value"] if section["title"].upper() == "INVESTIMENTO" else styles["body"]
    for paragraph in section["paragraphs"]:
        rows.append([Paragraph(paragraph, paragraph_style)])

    table = Table(rows, colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1.2, colors.black),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 8 * mm)])


def build_story(title, meta, sections):
    styles = build_styles()
    cover_box = Table(
        [[Paragraph(title, styles["cover_title"])], [Paragraph(meta, styles["cover_meta"])]],
        colWidths=[108 * mm],
    )
    cover_box.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    cover_box.hAlign = "LEFT"
    story = [
        Spacer(1, 118 * mm),
        cover_box,
        PageBreak(),
    ]

    box_width = A4[0] - (22 * mm * 2)
    for section in sections:
        story.append(build_section_box(section, styles, box_width))

    return story


def main():
    title, meta, sections = parse_source(SOURCE.read_text(encoding="utf-8"))
    doc = SimpleDocTemplate(
        str(TARGET),
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=28 * mm,
        bottomMargin=22 * mm,
    )
    doc.build(
        build_story(title, meta, sections),
        onFirstPage=draw_cover,
        onLaterPages=draw_content_page,
    )


if __name__ == "__main__":
    main()
