from __future__ import annotations

import sys
import time

try:
    import win32print
    import win32ui
except ImportError:
    print("FOUT: pywin32 ontbreekt. Installeer eerst met: pip install pywin32")
    sys.exit(1)


PRODUCT_NAME = "Voorbeeld Product"
PRICE = "€9,99"
SKU = "SKU-001"

PRINTER_NAME = "DYMO LabelWriter 450"
PREFERRED_METHOD = "GDI"  # "GDI" (aanbevolen) of "RAW"
ROTATION_DEGREES = 90  # kwartslag: 90 of 270


def build_label_xml(product_name: str, price: str, sku: str) -> str:
    return f'''<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips" xmlns="http://www.dymo.com/zeus/Community/DieCutLabel.xsd">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Address</Id>
  <PaperName>30321 Address</PaperName>
  <DrawCommands />
  <ObjectInfo>
    <TextObject>
      <Name>TEXT</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
      <BackColor Alpha="0" Red="255" Green="255" Blue="255" />
      <Rotation>Rotation0</Rotation>
      <IsVariable>True</IsVariable>
      <HorizontalAlignment>Left</HorizontalAlignment>
      <VerticalAlignment>Top</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <StyledText>
        <Element>
          <String>{product_name}</String>
          <Attributes>
            <Font Family="Arial" Size="14" Bold="True" Italic="False" Underline="False" Strikeout="False" />
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          </Attributes>
        </Element>
        <Element>
          <String>\nPrijs: {price}</String>
          <Attributes>
            <Font Family="Arial" Size="11" Bold="False" Italic="False" Underline="False" Strikeout="False" />
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          </Attributes>
        </Element>
        <Element>
          <String>\nSKU: {sku}</String>
          <Attributes>
            <Font Family="Arial" Size="10" Bold="False" Italic="False" Underline="False" Strikeout="False" />
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <Bounds X="190" Y="120" Width="2250" Height="1000" />
  </ObjectInfo>
</DieCutLabel>
'''


def _list_printers() -> list[str]:
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    return [item[2] for item in win32print.EnumPrinters(flags)]


def send_to_dymo(xml_content: str) -> bool:
    printer_handle = None
    payload = xml_content.encode("utf-8")

    try:
        print(f"INFO: probeer RAW print naar '{PRINTER_NAME}'...", flush=True)
        printer_handle = win32print.OpenPrinter(PRINTER_NAME)

        datatype_candidates = ["RAW", None]
        last_error = None
        for datatype in datatype_candidates:
            try:
                doc_info = ("DYMO Direct Print Test", None, datatype)
                job_id = win32print.StartDocPrinter(printer_handle, 1, doc_info)
                try:
                    win32print.StartPagePrinter(printer_handle)
                    bytes_written = win32print.WritePrinter(printer_handle, payload)
                    win32print.EndPagePrinter(printer_handle)
                finally:
                    win32print.EndDocPrinter(printer_handle)

                time.sleep(0.2)
                used_datatype = "RAW" if datatype == "RAW" else "None"
                print(
                    f"OK: RAW verzonden naar '{PRINTER_NAME}' (DataType={used_datatype}, bytes={bytes_written}, job={job_id})."
                )
                return True
            except win32print.error as exc:
                last_error = exc

        if last_error:
            raise last_error

    except win32print.error as exc:
        error_code = exc.winerror if hasattr(exc, "winerror") else (exc.args[0] if exc.args else None)
        if error_code == 1801:
            print(f"FOUT: printer '{PRINTER_NAME}' niet gevonden. Controleer naam en Windows-printerinstallatie.")
            printers = _list_printers()
            if printers:
                print("INFO: gevonden printers:")
                for printer_name in printers:
                    print(f"  - {printer_name}")
        elif error_code == 5:
            print("FOUT: toegang geweigerd (Access is denied). Sluit andere printtaken en controleer rechten.")
        elif error_code in (32, 170):
            print("FOUT: USB-poort/printer is bezet. Probeer opnieuw nadat lopende printtaken klaar zijn.")
        else:
            print(f"FOUT: Windows printfout (code={error_code}): {exc}")
        return False
    except Exception as exc:
        print(f"FOUT: onverwachte fout: {exc}")
        return False
    finally:
        if printer_handle is not None:
            win32print.ClosePrinter(printer_handle)


def print_via_windows_driver(product_name: str, price: str, sku: str) -> bool:
    dc = None
    try:
        print(f"INFO: probeer GDI-driver print naar '{PRINTER_NAME}'...", flush=True)
        dc = win32ui.CreateDC()
        dc.CreatePrinterDC(PRINTER_NAME)

        dc.StartDoc("DYMO Direct Print Test (GDI)")
        dc.StartPage()

        if ROTATION_DEGREES == 270:
            escapement = 2700
        else:
            escapement = 900

        font_title = win32ui.CreateFont(
            {"name": "Arial", "height": 72, "weight": 700, "escapement": escapement, "orientation": escapement}
        )
        font_text = win32ui.CreateFont(
            {"name": "Arial", "height": 52, "weight": 400, "escapement": escapement, "orientation": escapement}
        )

        dc.SelectObject(font_title)
        dc.TextOut(120, 720, product_name)

        dc.SelectObject(font_text)
        dc.TextOut(240, 720, f"Prijs: {price}")
        dc.TextOut(330, 720, f"SKU: {sku}")

        dc.EndPage()
        dc.EndDoc()

        time.sleep(0.2)
        print(f"OK: GDI-printtaak verzonden naar '{PRINTER_NAME}'.")
        return True
    except win32print.error as exc:
        error_code = exc.winerror if hasattr(exc, "winerror") else (exc.args[0] if exc.args else None)
        if error_code == 1801:
            print(f"FOUT: printer '{PRINTER_NAME}' niet gevonden.")
        elif error_code == 5:
            print("FOUT: toegang geweigerd (Access is denied).")
        else:
            print(f"FOUT: printfout via GDI (code={error_code}): {exc}")
        return False
    except Exception as exc:
        print(f"FOUT: onverwachte GDI-fout: {exc}")
        return False
    finally:
        if dc is not None:
            try:
                dc.DeleteDC()
            except Exception:
                pass


if __name__ == "__main__":
    print(f"INFO: start direct print test (methode={PREFERRED_METHOD})", flush=True)
    xml = build_label_xml(PRODUCT_NAME, PRICE, SKU)

    if PREFERRED_METHOD.upper() == "RAW":
        success = send_to_dymo(xml)
    else:
        success = print_via_windows_driver(PRODUCT_NAME, PRICE, SKU)

    if not success and PREFERRED_METHOD.upper() != "RAW":
        print("INFO: GDI mislukt, probeer RAW fallback...", flush=True)
        send_to_dymo(xml)
