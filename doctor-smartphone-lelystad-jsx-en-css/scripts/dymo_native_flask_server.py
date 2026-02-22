from __future__ import annotations

import sys
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
	import win32print
	import win32ui
except ImportError:
	print("FOUT: pywin32 ontbreekt. Installeer eerst met: pip install pywin32")
	sys.exit(1)


PRINTER_NAME = "DYMO LabelWriter 450"
ROTATION_DEGREES = 90


def _list_printers() -> list[str]:
	flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
	return [item[2] for item in win32print.EnumPrinters(flags)]


def print_via_windows_driver(product_name: str, price: str, sku: str) -> tuple[bool, int | None, str]:
	dc = None
	try:
		print(f"INFO: probeer GDI-driver print naar '{PRINTER_NAME}'...", flush=True)
		dc = win32ui.CreateDC()
		dc.CreatePrinterDC(PRINTER_NAME)

		dc.StartDoc("DYMO Website Print (GDI)")
		dc.StartPage()

		escapement = 2700 if ROTATION_DEGREES == 270 else 900

		font_title = win32ui.CreateFont(
			{
				"name": "Arial",
				"height": 72,
				"weight": 700,
				"escapement": escapement,
				"orientation": escapement,
			}
		)
		font_text = win32ui.CreateFont(
			{
				"name": "Arial",
				"height": 52,
				"weight": 400,
				"escapement": escapement,
				"orientation": escapement,
			}
		)

		dc.SelectObject(font_title)
		dc.TextOut(120, 720, str(product_name))

		dc.SelectObject(font_text)
		dc.TextOut(240, 720, f"Prijs: {price}")
		dc.TextOut(330, 720, f"SKU: {sku}")

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
		if dc is not None:
			try:
				dc.DeleteDC()
			except Exception:
				pass


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])


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
	app.run(host='127.0.0.1', port=5001)
