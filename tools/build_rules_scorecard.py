#!/usr/bin/env python3
"""Build the Moonshot Hitster rules and score sheet PDF."""

from __future__ import annotations

import math
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Moonshot_Hitster_spelregels_en_scoreblad.pdf"
BACKGROUND = ROOT / "print" / "assets" / "moonshot_card_background.png"

SITE_URL = "https://moonshot-hitster.matthias-versc989465.chatgpt.site/"
GITHUB_URL = "https://proximussmeevents.github.io/moonshot-hitster/"
SPOTIFY_URL = "https://open.spotify.com/playlist/4NMdgZIwG41bxhcUj5oiKN"

PURPLE = HexColor("#7A45F5")
VIOLET = HexColor("#A970FF")
CYAN = HexColor("#70DDFF")
PINK = HexColor("#F3A7FF")
INK = HexColor("#160C2C")
MUTED = HexColor("#6D617D")
PAPER = HexColor("#FAF8FF")
LINE = HexColor("#D9CFE9")
PALE = HexColor("#F0EAFB")


def register_fonts() -> None:
    regular = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
    bold = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
    pdfmetrics.registerFont(TTFont("Moonshot", str(regular)))
    pdfmetrics.registerFont(TTFont("Moonshot-Bold", str(bold)))


def round_rect(c: canvas.Canvas, x: float, y: float, w: float, h: float,
               radius: float, fill: Color, stroke: Color | None = None,
               alpha: float = 1.0) -> None:
    c.saveState()
    if hasattr(c, "setFillAlpha"):
        c.setFillAlpha(alpha)
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(0.8)
    else:
        c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)
    c.restoreState()


def wrapped_lines(text: str, font: str, size: float, width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float,
                 font: str = "Moonshot", size: float = 10, leading: float = 13,
                 color: Color = INK) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrapped_lines(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_star(c: canvas.Canvas, cx: float, cy: float, radius: float,
              fill: Color, stroke: Color | None = None) -> None:
    points: list[tuple[float, float]] = []
    for i in range(10):
        angle = math.radians(90 + i * 36)
        r = radius if i % 2 == 0 else radius * 0.43
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    path = c.beginPath()
    path.moveTo(*points[0])
    for point in points[1:]:
        path.lineTo(*point)
    path.close()
    c.saveState()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(0.8)
    c.drawPath(path, fill=1, stroke=1 if stroke else 0)
    c.restoreState()


def draw_qr(c: canvas.Canvas, url: str, x: float, y: float, size: float) -> None:
    round_rect(c, x - 5, y - 5, size + 10, size + 10, 7, white)
    widget = QrCodeWidget(url)
    bounds = widget.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def draw_brand(c: canvas.Canvas, dark: bool = True) -> None:
    color = white if dark else INK
    c.setStrokeColor(Color(1, 1, 1, 0.35) if dark else LINE)
    c.setLineWidth(0.8)
    c.circle(53, 798, 15, fill=0, stroke=1)
    c.setFont("Moonshot-Bold", 17)
    c.setFillColor(PINK if dark else PURPLE)
    c.drawCentredString(53, 792.5, "∞")
    c.setFillColor(color)
    c.setFont("Moonshot-Bold", 12)
    c.drawString(76, 800, "SME")
    c.setFont("Moonshot-Bold", 7)
    c.setFillColor(CYAN if dark else PURPLE)
    c.drawString(76, 789, "MOONSHOT 2026")


def draw_page_one(c: canvas.Canvas) -> None:
    width, height = A4
    c.drawImage(str(BACKGROUND), 0, 0, width, height, preserveAspectRatio=False, mask="auto")
    c.saveState()
    if hasattr(c, "setFillAlpha"):
        c.setFillAlpha(0.42)
    c.setFillColor(black)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.restoreState()
    draw_brand(c, dark=True)

    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 8.5)
    c.drawString(38, 755, "SPELREGELS • SCORE • LINKS")
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 28)
    c.drawString(38, 719, "BOUW DE TIJDSLIJN")
    c.setFillColor(PINK)
    c.setFont("Moonshot-Bold", 14)
    c.drawString(39, 696, "10 nummers. 30 punten. Maximaal 6 sterren.")

    round_rect(c, 36, 593, 523, 81, 15, HexColor("#170B33"), HexColor("#8E6CCF"), 0.90)
    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 9)
    c.drawString(52, 651, "DE MISSIE")
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 14)
    c.drawString(52, 629, "Plaats 10 nummers correct in chronologische volgorde.")
    draw_wrapped(c, "Scan een kaart, luister zonder het antwoord te bekijken en leg ze van oud naar nieuw. "
                    "Controleer daarna het jaartal in de app.", 52, 610, 482,
                 size=9.2, leading=12, color=HexColor("#DDD4EC"))

    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 12)
    c.drawString(38, 566, "ZO SPEEL JE")
    rules = [
        ("1", "Scan een kaart en start het nummer."),
        ("2", "Raad vóór de onthulling artiest en titel."),
        ("3", "Leg de kaart op de juiste plaats in jullie tijdslijn."),
        ("4", "Onthul het antwoord. Juist geplaatst? Noteer de kaart op het scoreblad."),
    ]
    y = 542
    for number, text in rules:
        c.setFillColor(PURPLE)
        c.circle(48, y + 2, 10, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Moonshot-Bold", 8)
        c.drawCentredString(48, y - 1, number)
        draw_wrapped(c, text, 66, y, 480, size=9.2, leading=11, color=white)
        y -= 29

    round_rect(c, 36, 332, 252, 116, 14, HexColor("#1E1040"), HexColor("#805ABF"), 0.93)
    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 9)
    c.drawString(51, 422, "PUNTEN PER CORRECT GEPLAATST NUMMER")
    score_items = [("+2", "tijdlijn / jaartal"), ("+1", "titel én artiest juist")]
    sy = 398
    for value, label in score_items:
        c.setFillColor(PINK)
        c.setFont("Moonshot-Bold", 12)
        c.drawString(53, sy, value)
        c.setFillColor(white)
        c.setFont("Moonshot", 9.5)
        c.drawString(83, sy, label)
        sy -= 26
    c.setFont("Moonshot-Bold", 8)
    c.setFillColor(HexColor("#CFC3E4"))
    c.drawRightString(272, 342, "MAX. 3 PER KAART • 30 TOTAAL")

    round_rect(c, 300, 332, 259, 116, 14, HexColor("#1E1040"), HexColor("#805ABF"), 0.93)
    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 9)
    c.drawString(315, 422, "PUNTEN → STERREN")
    mappings = [("0–9", 0), ("10–13", 1), ("14–17", 2), ("18–21", 3), ("22–24", 4), ("25–27", 5), ("28–30", 6)]
    for idx, (points, stars) in enumerate(mappings):
        col = 0 if idx < 4 else 1
        row = idx if idx < 4 else idx - 4
        x = 316 + col * 120
        yy = 398 - row * 17
        c.setFillColor(white)
        c.setFont("Moonshot-Bold", 8.3)
        c.drawString(x, yy, points)
        c.setFillColor(PINK)
        c.drawString(x + 39, yy, f"{stars} {'ster' if stars == 1 else 'sterren'}")

    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 12)
    c.drawString(38, 313, "SCAN & SPEEL")
    c.setFillColor(HexColor("#D8CEE8"))
    c.setFont("Moonshot", 8.7)
    c.drawRightString(558, 313, "De QR-codes en URL's zijn aanklikbaar in de digitale PDF.")

    links = [
        ("APP", SITE_URL, "Scan en onthul"),
        ("GITHUB", GITHUB_URL, "Back-up van de app"),
        ("SPOTIFY", SPOTIFY_URL, "Volledige playlist"),
    ]
    card_w = 163
    for idx, (label, url, subtitle) in enumerate(links):
        x = 36 + idx * 180
        round_rect(c, x, 65, card_w, 228, 14, HexColor("#160C31"), HexColor("#7149A7"), 0.94)
        c.setFillColor(CYAN if idx < 2 else HexColor("#69E48D"))
        c.setFont("Moonshot-Bold", 9)
        c.drawString(x + 13, 273, label)
        c.setFillColor(white)
        c.setFont("Moonshot-Bold", 8.5)
        c.drawString(x + 13, 256, subtitle)
        draw_qr(c, url, x + 33, 139, 98)
        display = url.replace("https://", "")
        if len(display) > 25:
            display = display[:24] + "…"
        c.setFillColor(HexColor("#D6C9E8"))
        c.setFont("Moonshot", 6.7)
        c.drawCentredString(x + card_w / 2, 116, display)
        c.setFillColor(PINK)
        c.setFont("Moonshot-Bold", 7.2)
        c.drawCentredString(x + card_w / 2, 87, "OPEN LINK")
        c.linkURL(url, (x, 65, x + card_w, 293), relative=0, thickness=0)

    c.setFillColor(HexColor("#B8AACB"))
    c.setFont("Moonshot", 6.7)
    c.drawString(38, 44, "TIP: kies in de app 'Ga verder zonder koppeling' om direct naar Spotify te gaan.")
    c.drawRightString(558, 44, "MOONSHOT HITSTER • SPELREGELS")


def draw_page_two(c: canvas.Canvas) -> None:
    width, height = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.drawImage(str(BACKGROUND), 0, 704, width, 138, preserveAspectRatio=False, mask="auto")
    c.saveState()
    if hasattr(c, "setFillAlpha"):
        c.setFillAlpha(0.48)
    c.setFillColor(black)
    c.rect(0, 704, width, 138, fill=1, stroke=0)
    c.restoreState()
    draw_brand(c, dark=True)

    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 8.5)
    c.drawString(37, 755, "MISSIECONTROLE")
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 25)
    c.drawString(37, 721, "SCOREBLAD")

    c.setFillColor(INK)
    c.setFont("Moonshot-Bold", 9)
    c.drawString(37, 677, "TEAMNAAM")
    c.drawString(354, 677, "DATUM")
    c.setStrokeColor(HexColor("#9588A8"))
    c.setLineWidth(0.8)
    c.line(37, 659, 328, 659)
    c.line(354, 659, 558, 659)

    c.setFillColor(MUTED)
    c.setFont("Moonshot", 8)
    c.drawString(37, 639, "Noteer alleen kaarten die correct in de tijdslijn liggen. Raad artiest en titel vóór de onthulling.")

    x0 = 37
    y_top = 618
    col_widths = [30, 155, 165, 65, 108]
    headers = ["#", "TIJDLIJN / JAARTAL", "TITEL ÉN ARTIEST", "PUNTEN", "KAART / NOTITIE"]
    row_h = 40
    head_h = 35
    table_w = sum(col_widths)

    round_rect(c, x0, y_top - head_h, table_w, head_h, 8, INK)
    xpos = x0
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 6.8)
    for label, cw in zip(headers, col_widths):
        c.drawCentredString(xpos + cw / 2, y_top - 22, label)
        xpos += cw

    y = y_top - head_h
    for row in range(1, 11):
        fill = white if row % 2 else PALE
        c.setFillColor(fill)
        c.setStrokeColor(LINE)
        c.rect(x0, y - row_h, table_w, row_h, fill=1, stroke=1)
        xpos = x0
        for cw in col_widths[:-1]:
            xpos += cw
            c.line(xpos, y - row_h, xpos, y)
        c.setFillColor(INK)
        c.setFont("Moonshot-Bold", 9)
        c.drawCentredString(x0 + col_widths[0] / 2, y - 25, str(row))
        # Two printable checkboxes: timeline score and the combined title/artist bonus.
        box_centres = [
            x0 + col_widths[0] + col_widths[1] / 2,
            x0 + sum(col_widths[:2]) + col_widths[2] / 2,
        ]
        for centre in box_centres:
            c.setFillColor(white)
            c.setStrokeColor(PURPLE)
            c.roundRect(centre - 7, y - 28, 14, 14, 3, fill=1, stroke=1)
        c.setFillColor(MUTED)
        c.setFont("Moonshot", 6.7)
        c.drawCentredString(box_centres[0], y - 36, "+2")
        c.drawCentredString(box_centres[1], y - 36, "+1")
        c.setFillColor(INK)
        c.setFont("Moonshot-Bold", 8)
        points_x = x0 + sum(col_widths[:3]) + col_widths[3] / 2
        c.drawCentredString(points_x, y - 25, "     / 3")
        y -= row_h

    total_y = y - 69
    round_rect(c, 37, total_y, 254, 58, 12, INK)
    c.setFillColor(CYAN)
    c.setFont("Moonshot-Bold", 8)
    c.drawString(52, total_y + 38, "TOTAALSCORE")
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 19)
    c.drawString(52, total_y + 14, "                 / 30")

    round_rect(c, 307, total_y, 251, 58, 12, PURPLE)
    c.setFillColor(white)
    c.setFont("Moonshot-Bold", 8)
    c.drawString(322, total_y + 38, "BEHAALDE STERREN")
    for i in range(6):
        draw_star(c, 337 + i * 36, total_y + 18, 10, white, white)

    c.setFillColor(INK)
    c.setFont("Moonshot-Bold", 8)
    c.drawString(38, total_y - 20, "OMZETTING")
    c.setFont("Moonshot", 7.5)
    c.setFillColor(MUTED)
    c.drawString(99, total_y - 20, "0–9 = 0  •  10–13 = 1  •  14–17 = 2  •  18–21 = 3  •  22–24 = 4  •  25–27 = 5  •  28–30 = 6 sterren")

    c.setStrokeColor(LINE)
    c.line(37, 55, 558, 55)
    c.setFillColor(MUTED)
    c.setFont("Moonshot", 6.8)
    c.drawString(37, 41, "Tijdslijn: maximaal 20 punten. Artiest én titel samen juist: maximaal 10 bonuspunten. Antwoord vóór de onthulling.")
    c.drawRightString(558, 26, "MOONSHOT HITSTER • SCOREBLAD")


def build() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("Moonshot Hitster - Spelregels en scoreblad")
    c.setAuthor("SME Moonshot 2026")
    c.setSubject("Spelregels, links, puntensysteem en scoreblad voor Moonshot Hitster")
    draw_page_one(c)
    c.showPage()
    draw_page_two(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
