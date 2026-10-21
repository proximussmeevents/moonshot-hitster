import json
import math
from pathlib import Path

from PIL import Image
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "print" / "spotify_tracks_with_years.json"
BACKGROUND_SOURCE = ROOT / "print" / "assets" / "moonshot_card_background.png"
BACKGROUND_CROPPED = ROOT / "print" / "assets" / "moonshot_card_background_cropped.png"
OUTPUT = ROOT / "output" / "pdf" / "SME_Moonshot_Hitster_kaartjes.pdf"

CARD_W = 63 * mm
CARD_H = 88 * mm
GAP_X = 2 * mm
GAP_Y = 2 * mm
COLS = 3
ROWS = 3
CARDS_PER_SHEET = COLS * ROWS
PAGE_W, PAGE_H = A4
GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X
GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y
MARGIN_X = (PAGE_W - GRID_W) / 2
MARGIN_Y = (PAGE_H - GRID_H) / 2

ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

def prepare_background():
    image = Image.open(BACKGROUND_SOURCE).convert("RGB")
    target_ratio = CARD_W / CARD_H
    current_ratio = image.width / image.height
    if current_ratio > target_ratio:
        new_w = round(image.height * target_ratio)
        left = (image.width - new_w) // 2
        box = (left, 0, left + new_w, image.height)
    else:
        new_h = round(image.width / target_ratio)
        top = (image.height - new_h) // 2
        box = (0, top, image.width, top + new_h)
    image.crop(box).resize((1008, 1408), Image.Resampling.LANCZOS).save(
        BACKGROUND_CROPPED, quality=95
    )


def card_position(slot, mirror_columns=False):
    row = slot // COLS
    col = slot % COLS
    if mirror_columns:
        col = COLS - 1 - col
    x = MARGIN_X + col * (CARD_W + GAP_X)
    y = PAGE_H - MARGIN_Y - (row + 1) * CARD_H - row * GAP_Y
    return x, y


def draw_card_background(pdf, x, y, darkness=0.0):
    pdf.drawImage(
        str(BACKGROUND_CROPPED), x, y, CARD_W, CARD_H,
        preserveAspectRatio=False, mask="auto"
    )
    if darkness:
        pdf.saveState()
        pdf.setFillColor(Color(0.01, 0.01, 0.05, alpha=darkness))
        pdf.rect(x, y, CARD_W, CARD_H, stroke=0, fill=1)
        pdf.restoreState()


def draw_cut_marks(pdf, x, y):
    mark = 1.4 * mm
    pdf.saveState()
    pdf.setStrokeColor(HexColor("#9A9A9A"))
    pdf.setLineWidth(0.25)
    # Card outline.
    pdf.rect(x, y, CARD_W, CARD_H, stroke=1, fill=0)
    # Corner extensions into the gutters/margins.
    for cx in (x, x + CARD_W):
        pdf.line(cx, y - mark, cx, y)
        pdf.line(cx, y + CARD_H, cx, y + CARD_H + mark)
    for cy in (y, y + CARD_H):
        pdf.line(x - mark, cy, x, cy)
        pdf.line(x + CARD_W, cy, x + CARD_W + mark, cy)
    pdf.restoreState()


def draw_brand(pdf, x, y, number):
    pdf.saveState()
    pdf.setFillColor(white)
    pdf.setFont("Arial-Bold", 8.4)
    pdf.drawString(x + 5 * mm, y + CARD_H - 8 * mm, "SME")
    pdf.setFont("Arial", 7.2)
    pdf.drawString(x + 14.8 * mm, y + CARD_H - 8 * mm, "MOONSHOT 2026")
    pdf.setFillColor(HexColor("#D5C3FF"))
    pdf.setFont("Arial-Bold", 7)
    pdf.drawRightString(x + CARD_W - 5 * mm, y + CARD_H - 8 * mm, f"#{number:02d}")
    pdf.restoreState()


def draw_qr(pdf, value, x, y, size):
    widget = QrCodeWidget(value, barLevel="Q")
    x0, y0, x1, y1 = widget.getBounds()
    qr_w = x1 - x0
    qr_h = y1 - y0
    scale = min(size / qr_w, size / qr_h)
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, pdf, x, y)


def wrap_lines(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else current + " " + word
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fitted_lines(text, font_name, max_size, min_size, max_width, max_lines):
    size = max_size
    while size >= min_size:
        lines = wrap_lines(text, font_name, size, max_width)
        if len(lines) <= max_lines:
            return size, lines
        size -= 0.5
    lines = wrap_lines(text, font_name, min_size, max_width)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and pdfmetrics.stringWidth(last + "...", font_name, min_size) > max_width:
            last = last[:-1]
        lines[-1] = last.rstrip() + "..."
    return min_size, lines


def draw_centered_lines(pdf, lines, font_name, font_size, center_x, first_y, leading, color):
    pdf.setFillColor(color)
    pdf.setFont(font_name, font_size)
    y = first_y
    for line in lines:
        pdf.drawCentredString(center_x, y, line)
        y -= leading
    return y


def draw_front(pdf, track, x, y):
    draw_card_background(pdf, x, y, darkness=0.18)
    draw_brand(pdf, x, y, track["nr"])

    panel_size = 49 * mm
    panel_x = x + (CARD_W - panel_size) / 2
    panel_y = y + 20.5 * mm
    pdf.saveState()
    pdf.setFillColor(Color(1, 1, 1, alpha=0.97))
    pdf.roundRect(panel_x, panel_y, panel_size, panel_size, 3.2 * mm, stroke=0, fill=1)
    pdf.restoreState()

    qr_size = 41 * mm
    qr_x = x + (CARD_W - qr_size) / 2
    qr_y = panel_y + (panel_size - qr_size) / 2
    draw_qr(pdf, track["url"], qr_x, qr_y, qr_size)

    pdf.saveState()
    pdf.setFillColor(white)
    pdf.setFont("Arial-Bold", 8.3)
    pdf.drawCentredString(x + CARD_W / 2, y + 9.3 * mm, "SCAN & PLAY")
    pdf.setFillColor(HexColor("#D5C3FF"))
    pdf.setFont("Arial", 6.4)
    pdf.drawCentredString(x + CARD_W / 2, y + 6.2 * mm, "REACH BEYOND. TOGETHER.")
    pdf.restoreState()
    draw_cut_marks(pdf, x, y)


def draw_back(pdf, track, x, y):
    draw_card_background(pdf, x, y, darkness=0.47)
    draw_brand(pdf, x, y, track["nr"])

    panel_x = x + 5.2 * mm
    panel_y = y + 12 * mm
    panel_w = CARD_W - 10.4 * mm
    panel_h = 61 * mm
    pdf.saveState()
    pdf.setFillColor(Color(0.015, 0.01, 0.07, alpha=0.78))
    pdf.setStrokeColor(Color(0.58, 0.35, 1.0, alpha=0.78))
    pdf.setLineWidth(0.8)
    pdf.roundRect(panel_x, panel_y, panel_w, panel_h, 3.2 * mm, stroke=1, fill=1)
    pdf.restoreState()

    center_x = x + CARD_W / 2
    year = track["year"]
    pdf.saveState()
    pdf.setFillColor(HexColor("#D5C3FF"))
    pdf.setFont("Arial-Bold", 30)
    pdf.drawCentredString(center_x, panel_y + panel_h - 17 * mm, str(year))
    pdf.setStrokeColor(HexColor("#56C9E8"))
    pdf.setLineWidth(1.25)
    pdf.line(panel_x + 8 * mm, panel_y + panel_h - 21 * mm,
             panel_x + panel_w - 8 * mm, panel_y + panel_h - 21 * mm)

    max_text_w = panel_w - 8 * mm
    artist_size, artist_lines = fitted_lines(
        track["artist"].upper(), "Arial-Bold", 13, 8.5, max_text_w, 3
    )
    artist_leading = artist_size * 1.15
    artist_y = panel_y + panel_h - 29.5 * mm
    next_y = draw_centered_lines(
        pdf, artist_lines, "Arial-Bold", artist_size, center_x,
        artist_y, artist_leading, white
    )

    title_size, title_lines = fitted_lines(
        track["title"], "Arial", 11.5, 8.2, max_text_w, 4
    )
    title_leading = title_size * 1.2
    title_y = min(next_y - 3.5 * mm, panel_y + 19 * mm)
    draw_centered_lines(
        pdf, title_lines, "Arial", title_size, center_x,
        title_y, title_leading, HexColor("#E9E3FF")
    )
    pdf.restoreState()
    draw_cut_marks(pdf, x, y)


def draw_page_label(pdf, sheet_no, total_sheets, side):
    pdf.saveState()
    pdf.setFillColor(HexColor("#6D6D6D"))
    pdf.setFont("Arial", 5.8)
    pdf.drawCentredString(PAGE_W / 2, 5.4 * mm, f"{side} - vel {sheet_no}/{total_sheets}")
    pdf.restoreState()


def build_pdf():
    tracks = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    if not tracks:
        raise ValueError("Tracklijst is leeg")
    if [item["nr"] for item in tracks] != list(range(1, len(tracks) + 1)):
        raise ValueError("Track numbers are not sequential")
    if len({item["url"] for item in tracks}) != len(tracks):
        raise ValueError("Track URLs are not unique")

    prepare_background()
    pdfmetrics.registerFont(TTFont("Arial", ARIAL))
    pdfmetrics.registerFont(TTFont("Arial-Bold", ARIAL_BOLD))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    pdf.setTitle("SME Moonshot 2026 - Hitster kaartjes")
    pdf.setAuthor("SME Moonshot 2026")
    pdf.setSubject(f"{len(tracks)} dubbelzijdige muziekquizkaartjes met Spotify QR-codes")

    total_sheets = math.ceil(len(tracks) / CARDS_PER_SHEET)
    for sheet_index in range(total_sheets):
        batch = tracks[sheet_index * CARDS_PER_SHEET:(sheet_index + 1) * CARDS_PER_SHEET]

        # Fronts: ordinary reading order.
        for slot, track in enumerate(batch):
            x, y = card_position(slot, mirror_columns=False)
            draw_front(pdf, track, x, y)
        draw_page_label(pdf, sheet_index + 1, total_sheets, "VOORKANT")
        pdf.showPage()

        # Backs: columns mirrored for duplex printing on the long edge.
        for slot, track in enumerate(batch):
            x, y = card_position(slot, mirror_columns=True)
            draw_back(pdf, track, x, y)
        draw_page_label(pdf, sheet_index + 1, total_sheets, "ACHTERKANT - SPIEGELING VOOR LANGE ZIJDE")
        pdf.showPage()

    pdf.save()
    print(json.dumps({
        "output": str(OUTPUT),
        "cards": len(tracks),
        "sheets": total_sheets,
        "pages": total_sheets * 2,
        "card_mm": [63, 88],
    }, ensure_ascii=False))


if __name__ == "__main__":
    build_pdf()
