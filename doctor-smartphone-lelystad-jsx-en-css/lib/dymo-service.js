/**
 * DYMO LabelWriter 450 Integratie Service
 * Verbinding met DYMO Web Service op poort 41951
 */

const DYMO_HOST = 'localhost'
const DYMO_PORTS = [41951, 41952]
const DYMO_PATHS = {
  printers: '/dcd/api/get-printers',
  print: '/dcd/api/print-label'
}
const DYMO_CHECK_TIMEOUT = 2000
const DYMO_SERVICE_URL = 'https://localhost:41951'
const DYMO_PRINTERS_URL = `${DYMO_SERVICE_URL}${DYMO_PATHS.printers}`
const DYMO_CLASSIC_SERVICE_URL = 'http://localhost:41951/DYMO/DymoAddIn/Service.asmx'

const buildServiceCandidates = () => {
  return [DYMO_SERVICE_URL]
}

const normalizePrinters = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.printers)) return data.printers
  if (Array.isArray(data.Printers)) return data.Printers
  return []
}

const pickPrinterName = (printers) => {
  const normalized = printers
    .map((printer) => {
      if (typeof printer === 'string') return { name: printer, isConnected: true }
      if (!printer || typeof printer !== 'object') return null
      return {
        name: printer.name || printer.Name,
        isConnected: typeof printer.isConnected === 'boolean' ? printer.isConnected : printer.IsConnected
      }
    })
    .filter((printer) => printer && printer.name)

  if (!normalized.length) return null

  const firstConnected = normalized.find((printer) => printer.isConnected !== false)
  return firstConnected ? firstConnected.name : null
}

const classifyDymoError = (error, url) => {
  const isTypeError = error && error.name === 'TypeError'
  if (isTypeError && typeof url === 'string' && url.startsWith('http://')) {
    return { type: 'security', message: 'HTTPS beveiliging blokkeert toegang tot de DYMO service.' }
  }
  return { type: 'unreachable', message: 'DYMO service niet bereikbaar of printer niet aangesloten.' }
}

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DYMO_CHECK_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export class DymoService {
  static async checkDymoStatus() {
    const printersUrl = DYMO_PRINTERS_URL

    try {
      const response = await fetchWithTimeout(printersUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      })

      if (!response.ok) {
        if (response.status === 404) {
          const notFound = { type: 'not-found', status: response.status, url: printersUrl }
          return {
            connected: false,
            printers: [],
            printerName: null,
            message: 'DYMO niet beschikbaar',
            errorType: notFound.type
          }
        }
        throw new Error(`DYMO Service niet bereikbaar: ${response.status}`)
      }

      const data = await response.json().catch(() => null)
      console.log('DYMO printers response:', data)
      const printers = normalizePrinters(data)

      return {
        connected: true,
        printers,
        printerName: pickPrinterName(printers),
        url: DYMO_SERVICE_URL,
        message: 'DYMO verbonden'
      }
    } catch (error) {
      const failure = { ...classifyDymoError(error, printersUrl), error }
      console.error('DYMO Status Check Fout:', failure?.error || failure)
      return {
        connected: false,
        printers: [],
        printerName: null,
        message: failure?.message || 'DYMO niet beschikbaar',
        errorType: failure?.type || 'unreachable'
      }
    }
  }

  static async printLabel(productData, quantity = 1) {
    try {
      // Valideer product data
      if (!productData.name || !productData.price || !productData.barcode) {
        throw new Error('Ontbrekende productgegevens (naam, prijs of barcode)')
      }

      // Geneer XML label
      const labelXml = this.generateLabelXml(productData)

      // Print via DYMO Print Server
      for (let i = 0; i < quantity; i++) {
        await this.sendToDymoPrintServer(labelXml)
      }

      return {
        success: true,
        message: `${quantity} label(s) naar DYMO 450 verzonden`,
        quantity: quantity
      }
    } catch (error) {
      console.error('DYMO Print Error:', error)
      return {
        success: false,
        message: `Fout bij printen: ${error.message}`,
        error: error.message
      }
    }
  }

  static generateLabelXml(productData) {
    const { name, price, barcode, sku } = productData

    // DYMO Label XML Template (LabelWriter 450 compatible)
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="Twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Address</Id>
  <IsOutlined>false</IsOutlined>
  <PaperName>11354 Multi-Purpose</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="3150" Height="1800" Rx="270" Ry="270"/>
  </DrawCommands>
  <ObjectInfo>
    <TextObject>
      <Name>ProductName</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID>-1</GroupID>
      <IsOutlined>false</IsOutlined>
      <HorizontalAlignment>Left</HorizontalAlignment>
      <VerticalAlignment>Top</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>true</UseFullFontHeight>
      <Verticalized>false</Verticalized>
      <StyledText>
        <Element>
          <String>${this.escapeXml(name.substring(0, 40))}</String>
          <Attributes>
            <Font Family="Arial" Size="10" Bold="false" Italic="false" Underline="false" Strikeout="false"/>
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
          </Attributes>
        </Element>
      </StyledText>
      <ShowBarcodeFor2DSymbol>false</ShowBarcodeFor2DSymbol>
      <ObjectLayout>
        <DYMOPoint>
          <X>100</X>
          <Y>100</Y>
        </DYMOPoint>
        <Size>
          <Width>2900</Width>
          <Height>350</Height>
        </Size>
      </ObjectLayout>
    </TextObject>
    <TextObject>
      <Name>Price</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID>-1</GroupID>
      <IsOutlined>false</IsOutlined>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>true</UseFullFontHeight>
      <Verticalized>false</Verticalized>
      <StyledText>
        <Element>
          <String>€ ${this.formatPrice(price)}</String>
          <Attributes>
            <Font Family="Arial" Size="14" Bold="true" Italic="false" Underline="false" Strikeout="false"/>
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
          </Attributes>
        </Element>
      </StyledText>
      <ShowBarcodeFor2DSymbol>false</ShowBarcodeFor2DSymbol>
      <ObjectLayout>
        <DYMOPoint>
          <X>100</X>
          <Y>500</Y>
        </DYMOPoint>
        <Size>
          <Width>2900</Width>
          <Height>400</Height>
        </Size>
      </ObjectLayout>
    </TextObject>
    <BarcodeObject>
      <Name>Barcode</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID>-1</GroupID>
      <IsOutlined>false</IsOutlined>
      <Text>${barcode}</Text>
      <Type>Code128Auto</Type>
      <Size>Small</Size>
      <TextPosition>Bottom</TextPosition>
      <TextFont Family="Arial" Size="8" Bold="false" Italic="false" Underline="false" Strikeout="false"/>
      <CheckSumFont Family="Arial" Size="8" Bold="false" Italic="false" Underline="false" Strikeout="false"/>
      <TextEmbedding>None</TextEmbedding>
      <ECLevel>0</ECLevel>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <QuietZonesPadding Left="0" Right="0" Top="0" Bottom="0"/>
      <ObjectLayout>
        <DYMOPoint>
          <X>200</X>
          <Y>950</Y>
        </DYMOPoint>
        <Size>
          <Width>2700</Width>
          <Height>550</Height>
        </Size>
      </ObjectLayout>
    </BarcodeObject>
    <TextObject>
      <Name>SKU</Name>
      <ForeColor Alpha="255" Red="128" Green="128" Blue="128"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID>-1</GroupID>
      <IsOutlined>false</IsOutlined>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Bottom</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>true</UseFullFontHeight>
      <Verticalized>false</Verticalized>
      <StyledText>
        <Element>
          <String>SKU: ${this.escapeXml(sku || barcode)}</String>
          <Attributes>
            <Font Family="Arial" Size="7" Bold="false" Italic="false" Underline="false" Strikeout="false"/>
            <ForeColor Alpha="255" Red="128" Green="128" Blue="128"/>
          </Attributes>
        </Element>
      </StyledText>
      <ShowBarcodeFor2DSymbol>false</ShowBarcodeFor2DSymbol>
      <ObjectLayout>
        <DYMOPoint>
          <X>100</X>
          <Y>1500</Y>
        </DYMOPoint>
        <Size>
          <Width>2900</Width>
          <Height>220</Height>
        </Size>
      </ObjectLayout>
    </TextObject>
  </ObjectInfo>
</DieCutLabel>`

    return xml
  }

  static async sendToDymoPrintServer(labelXml) {
    try {
      const status = await this.checkDymoStatus()
      if (!status.connected) {
        throw new Error(status.message || 'DYMO service niet bereikbaar')
      }

      const printerName = status.printerName || (status.printers?.[0]?.name || status.printers?.[0])
      if (!printerName) {
        throw new Error('Geen DYMO printer gevonden')
      }

      const response = await fetch(`${status.url}${DYMO_PATHS.print}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          printerName: printerName,
          labelXml: labelXml,
          printParams: '',
          labelSetXml: ''
        })
      })

      if (!response.ok) {
        throw new Error(`DYMO Print Server antwoord: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      const classification = classifyDymoError(error, DYMO_PATHS.print)
      if (classification.type === 'security') {
        console.error('❌ HTTPS beveiligingsblokkade: browser blokkeert toegang tot DYMO (mixed content of certificaat).')
      } else {
        console.error('❌ DYMO printer niet aangesloten of service draait niet op poort 41951/41952.')
      }

      // Fallback: probeer de klassieke DYMO SDK via SOAP
      return await this.sendViaClassicDymoSdk(labelXml)
    }
  }

  static async sendViaClassicDymoSdk(labelXml) {
    // Fallback method voor DYMO SDK 8.x (klassieke interface)
    try {
      const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CreateLabelRequest xmlns="http://www.dymo.com/DymoAddIn/Service/1.0">
      <labelXml>${this.escapeXml(labelXml)}</labelXml>
    </CreateLabelRequest>
  </soap:Body>
</soap:Envelope>`

      const response = await fetch(DYMO_CLASSIC_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': '"http://www.dymo.com/DymoAddIn/Service/1.0"'
        },
        mode: 'no-cors',
        body: soapRequest
      })

      return { success: true, method: 'classic_sdk' }
    } catch (error) {
      throw new Error(`DYMO SDK niet beschikbaar: ${error.message}`)
    }
  }

  static escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  static formatPrice(price) {
    const num = parseFloat(price)
    if (isNaN(num)) return '0,00'
    return num.toFixed(2).replace('.', ',')
  }

  // Barcode validatie
  static validateBarcode(barcode) {
    if (!barcode || barcode.length < 3) {
      return { valid: false, error: 'Barcode moet minstens 3 karakters lang zijn' }
    }
    // Code 128 accepteert vrijwel alle ASCII karakters
    if (!/^[!-~]+$/.test(barcode)) {
      return { valid: false, error: 'Barcode bevat ongeldige karakters' }
    }
    return { valid: true }
  }

  // Genereer test label voor debugging
  static async printTestLabel() {
    return this.printLabel({
      name: 'Test Product',
      price: 19.99,
      barcode: '1234567890123',
      sku: 'TEST-001'
    }, 1)
  }
}

export default DymoService
