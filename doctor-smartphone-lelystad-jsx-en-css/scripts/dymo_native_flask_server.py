from __future__ import annotations

import os
import re
import sys
import tempfile
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    import win32print
    import win32ui
    import barcode
    from barcode.writer import ImageWriter
    from PIL import Image, ImageWin
except ImportError:
    print("FOUT: dependencies ontbreken. Installeer: pip install pywin32 python-barcode pillow")
    sys.exit(1)


PRINTER_NAME = "DYMO LabelWriter 450"
ROTATION_DEGREES = 0


def _list_printers() -> list[str]:
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    return [item[2] for item in win32print.EnumPrinters(flags)]


def _format_price(value: str) -> str:
    text = str(value).strip().replace("€", "").replace(" ", "")
    if not text:
        return "€ 0,00"

    normalized = text.replace(",", ".")
    try:
        amount = float(normalized)
    except ValueError:
        return f"€ {text}"

    return f"€ {amount:.2f}".replace(".", ",")


def _barcode_resample() -> int:
    try:
        return Image.Resampling.LANCZOS
    except AttributeError:
        return Image.LANCZOS


def _generate_barcode_image(sku: str) -> str:
    safe_sku = "".join(ch for ch in str(sku).strip() if ch.isprintable())
    if not safe_sku:
        safe_sku = "UNKNOWN-SKU"
    code128 = barcode.get("code128", safe_sku, writer=ImageWriter())

    temp_file = tempfile.NamedTemporaryFile(prefix="dymo_barcode_", suffix=".png", delete=False)
    temp_file.close()
    output_base = os.path.splitext(temp_file.name)[0]

    writer_options = {
        "module_width": 0.30,
        "module_height": 28.0,
        "quiet_zone": 2.0,
        "write_text": False,
        "dpi": 300,
    }

    return code128.save(output_base, options=writer_options)


def _create_font(height: int, weight: int, escapement: int) -> Any:
    return win32ui.CreateFont(
        {
            "name": "Arial",
            "height": max(1, int(height)),
            "weight": weight,
            "escapement": escapement,
            "orientation": escapement,
        }
    )


def _truncate_text_to_width(dc: Any, text: str, max_width: int) -> str:
    if not text:
        return ""

    if dc.GetTextExtent(text)[0] <= max_width:
        return text

    ellipsis = "..."
    shortened = text

    while shortened:
        candidate = shortened.rstrip() + ellipsis
        if dc.GetTextExtent(candidate)[0] <= max_width:
            return candidate
        shortened = shortened[:-1]

    return ellipsis


def _wrap_text_to_width(dc: Any, text: str, max_width: int, max_lines: int = 2) -> list[str]:
    text = str(text or "").strip()
    if not text:
        return [""]

    words = text.split()
    if not words:
        return [_truncate_text_to_width(dc, text, max_width)]

    lines: list[str] = []
    current = words[0]

    for word in words[1:]:
        candidate = f"{current} {word}".strip()
        if dc.GetTextExtent(candidate)[0] <= max_width:
            current = candidate
        else:
            lines.append(_truncate_text_to_width(dc, current, max_width))
            current = word
            if len(lines) == max_lines - 1:
                break

    remaining_words = words[len(" ".join(lines + [current]).split()):]
    if remaining_words:
        current = f"{current} {' '.join(remaining_words)}".strip()

    lines.append(_truncate_text_to_width(dc, current, max_width))
    return lines[:max_lines]


def _fit_text_layout(
    dc: Any,
    text: str,
    max_width: int,
    start_height: int,
    min_height: int,
    weight: int,
    escapement: int,
) -> tuple[Any, str, int, int]:
    fallback_font = None

    for font_height in range(max(start_height, min_height), min_height - 1, -2):
        font = _create_font(font_height, weight, escapement)
        dc.SelectObject(font)
        fitted_text = _truncate_text_to_width(dc, text, max_width)
        width, height = dc.GetTextExtent(fitted_text or " ")
        fallback_font = font

        if width <= max_width:
            return font, fitted_text, width, height

    dc.SelectObject(fallback_font)
    fitted_text = _truncate_text_to_width(dc, text, max_width)
    width, height = dc.GetTextExtent(fitted_text or " ")
    return fallback_font, fitted_text, width, height


def _fit_multiline_text_layout(
    dc: Any,
    text: str,
    max_width: int,
    max_height: int,
    start_height: int,
    min_height: int,
    weight: int,
    escapement: int,
    max_lines: int = 2,
) -> tuple[Any, list[str], int, int, int]:
    fallback_font = None
    fallback_lines = [str(text or "").strip()]
    fallback_line_height = min_height

    for font_height in range(max(start_height, min_height), min_height - 1, -2):
        font = _create_font(font_height, weight, escapement)
        dc.SelectObject(font)
        lines = _wrap_text_to_width(dc, text, max_width, max_lines=max_lines)
        line_metrics = [dc.GetTextExtent(line or " ") for line in lines]
        total_height = sum(metric[1] for metric in line_metrics)
        widest_line = max((metric[0] for metric in line_metrics), default=0)
        line_height = max((metric[1] for metric in line_metrics), default=font_height)

        fallback_font = font
        fallback_lines = lines
        fallback_line_height = line_height

        if widest_line <= max_width and total_height <= max_height:
            return font, lines, widest_line, total_height, line_height

    return fallback_font, fallback_lines, max((dc.GetTextExtent(line or " ")[0] for line in fallback_lines), default=0), min(max_height, fallback_line_height * len(fallback_lines)), fallback_line_height


def _resize_image_to_fit(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    if max_width <= 0 or max_height <= 0:
        return image

    scale = min(max_width / image.width, max_height / image.height)
    scale = max(scale, 0.05)

    target_width = max(1, int(image.width * scale))
    target_height = max(1, int(image.height * scale))

    return image.resize((target_width, target_height), _barcode_resample())


def print_via_windows_driver(product_name: str, price: str, sku: str) -> tuple[bool, int | None, str]:
    dc = None
    barcode_path = None
    barcode_image = None

    try:
        print(f"INFO: probeer GDI-driver print naar '{PRINTER_NAME}'...", flush=True)
        dc = win32ui.CreateDC()
        dc.CreatePrinterDC(PRINTER_NAME)

        dc.StartDoc("DYMO Website Print (GDI Landscape)")
        dc.StartPage()

        escapement = 0 if ROTATION_DEGREES == 0 else (2700 if ROTATION_DEGREES == 270 else 900)

        page_width = dc.GetDeviceCaps(8)
        page_height = dc.GetDeviceCaps(10)
        physical_width = dc.GetDeviceCaps(110)
        physical_height = dc.GetDeviceCaps(111)
        offset_x = dc.GetDeviceCaps(112)
        offset_y = dc.GetDeviceCaps(113)

        print(
            f"INFO: layout-v2 page={page_width}x{page_height} physical={physical_width}x{physical_height} offset={offset_x},{offset_y}",
            flush=True,
        )

        left_margin = max(8, int(page_width * 0.04))
        right_margin = max(8, int(page_width * 0.04))
        top_margin = max(10, int(page_height * 0.018))
        bottom_margin = max(10, int(page_height * 0.018))
        gap_small = max(6, int(page_height * 0.012))
        gap_medium = max(8, int(page_height * 0.018))

        content_left = left_margin
        content_right = page_width - right_margin
        content_width = content_right - content_left
        content_height = page_height - top_margin - bottom_margin

        title_section_height = max(70, int(content_height * 0.15))
        sku_section_height = max(42, int(content_height * 0.08))
        price_section_height = max(110, int(content_height * 0.18))
        barcode_section_height = max(
            120,
            content_height - title_section_height - sku_section_height - price_section_height - (gap_medium * 2 + gap_small),
        )

        title_text = str(product_name).strip()
        sku_text = str(sku).strip()
        price_text = _format_price(price)

        font_title, title_lines, title_width, title_total_height, title_line_height = _fit_multiline_text_layout(
            dc,
            title_text,
            content_width,
            title_section_height,
            start_height=max(18, int(title_section_height * 0.34)),
            min_height=12,
            weight=700,
            escapement=escapement,
            max_lines=2,
        )

        font_sku, sku_text, sku_width, sku_height = _fit_text_layout(
            dc,
            sku_text,
            content_width,
            start_height=max(14, int(sku_section_height * 0.45)),
            min_height=10,
            weight=400,
            escapement=escapement,
        )

        font_price, price_text, price_width, price_height = _fit_text_layout(
            dc,
            price_text,
            content_width,
            start_height=max(24, int(price_section_height * 0.42)),
            min_height=16,
            weight=900,
            escapement=escapement,
        )

        title_y = top_margin + max(0, (title_section_height - title_total_height) // 2)
        dc.SelectObject(font_title)
        current_title_y = title_y
        for line in title_lines:
            line_width, line_height = dc.GetTextExtent(line or " ")
            title_x = content_left + max(0, (content_width - line_width) // 2)
            dc.TextOut(title_x, current_title_y, line)
            current_title_y += line_height

        barcode_path = _generate_barcode_image(sku_text)
        barcode_image = Image.open(barcode_path).convert("RGB")

        barcode_top = top_margin + title_section_height + gap_medium
        target_barcode_width = max(40, int(content_width * 0.94))
        target_barcode_height = max(90, barcode_section_height)

        barcode_image = _resize_image_to_fit(
            barcode_image,
            target_barcode_width,
            target_barcode_height,
        )

        barcode_left = content_left + max(0, (content_width - barcode_image.width) // 2)
        barcode_right = barcode_left + barcode_image.width
        barcode_draw_top = barcode_top + max(0, (barcode_section_height - barcode_image.height) // 2)
        barcode_bottom = barcode_draw_top + barcode_image.height

        dib = ImageWin.Dib(barcode_image)
        dib.draw(dc.GetHandleOutput(), (barcode_left, barcode_draw_top, barcode_right, barcode_bottom))

        dc.SelectObject(font_sku)
        sku_x = content_left + max(0, (content_width - sku_width) // 2)
        sku_y = barcode_top + barcode_section_height + gap_small
        dc.TextOut(sku_x, sku_y, sku_text)

        dc.SelectObject(font_price)
        price_x = content_left + max(0, (content_width - price_width) // 2)
        price_section_top = sku_y + sku_height + gap_medium
        price_y = price_section_top + max(0, (price_section_height - price_height) // 2)

        maximum_price_y = page_height - bottom_margin - price_height
        if price_y > maximum_price_y:
            price_y = maximum_price_y

        dc.TextOut(price_x, price_y, price_text)

        dc.EndPage()
        dc.EndDoc()

        print(f"OK: GDI-printtaak verzonden naar '{PRINTER_NAME}'.", flush=True)
        return True, None, "GDI-printtaak verzonden"

    except win32print.error as exc:
        error_code = exc.winerror if hasattr(exc, "winerror") else (exc.args[0] if exc.args else None)
        if error_code == 1801:
            print(f"FOUT: printer '{PRINTER_NAME}' niet gevonden.", flush=True)
            printers = _list_printers()
            if printers:
                print("INFO: gevonden printers:", flush=True)
                for printer_name in printers:
                    print(f"  - {printer_name}", flush=True)
            return False, error_code, f"Printer '{PRINTER_NAME}' niet gevonden"
        if error_code == 5:
            print("FOUT: toegang geweigerd (Access is denied).", flush=True)
            return False, error_code, "Toegang geweigerd (Access is denied)"

        print(f"FOUT: printfout via GDI (code={error_code}): {exc}", flush=True)
        return False, error_code, str(exc)

    except Exception as exc:
        print(f"FOUT: onverwachte GDI-fout: {exc}", flush=True)
        return False, None, str(exc)

    finally:
        if barcode_image is not None:
            try:
                barcode_image.close()
            except Exception:
                pass

        if barcode_path:
            try:
                if os.path.exists(barcode_path):
                    os.remove(barcode_path)
            except Exception:
                pass

        if dc is not None:
            try:
                dc.DeleteDC()
            except Exception:
                pass


app = Flask(__name__)

extra_origins = [origin.strip() for origin in os.getenv("DYMO_ALLOWED_ORIGINS", "").split(",") if origin.strip()]
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    re.compile(r"^https://[a-zA-Z0-9-]+\.netlify\.app$"),
    *extra_origins,
]

CORS(app, origins=allowed_origins)


@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok"})


@app.route("/print", methods=["POST"])
def print_label() -> Any:
    payload = request.get_json(silent=True) or {}

    product_name = str(payload.get("productName", "")).strip()
    price = str(payload.get("price", "")).strip()
    sku = str(payload.get("sku", "")).strip()

    if not product_name:
        return jsonify({"success": False, "error": "productName ontbreekt", "errorCode": None}), 400
    if not price:
        return jsonify({"success": False, "error": "price ontbreekt", "errorCode": None}), 400
    if not sku:
        return jsonify({"success": False, "error": "sku ontbreekt", "errorCode": None}), 400

    ok, error_code, message = print_via_windows_driver(product_name, price, sku)

    if ok:
        return jsonify({"success": True})

    return jsonify({"success": False, "error": message, "errorCode": error_code}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
