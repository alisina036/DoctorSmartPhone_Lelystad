/**
 * DYMO LabelWriter 550 Integratie Service
 * Verbinding met DYMO Web Service op poort 41951
 */

const DYMO_SERVICE_URL = 'http://localhost:41951/DYMO/DymoAddIn/Service.asmx'
const DYMO_PRINT_SERVER_URL = 'http://localhost:41951/api/v1'

export class DymoService {
  static async checkDymoStatus() {
    try {
      const response = await fetch(`${DYMO_PRINT_SERVER_URL}/printers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`DYMO Service niet bereikbaar: ${response.status}`)
      }

      const data = await response.json()
      return {
        connected: true,
        printers: data || [],
        message: 'DYMO verbonden'
      }
    } catch (error) {
      console.error('DYMO Status Check Fout:', error)
      return {
        connected: false,
        printers: [],
        message: `DYMO niet beschikbaar: ${error.message}`
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
        message: `${quantity} label(s) naar DYMO 550 verzonden`,
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

    // DYMO Label XML Template (4x6 label standaard)
    // Dit is een basis template - je moet deze aanpassen op basis van je DYMO label design
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="Twips">
  <PreviewUsed>false</PreviewUsed>
  <Date>2026-02-01</Date>
  <Time>12:00:00</Time>
  <PatternName></PatternName>
  <ContentSource>Memory</ContentSource>
  <PrinterName>DYMO LabelWriter 550</PrinterName>
  <Orientation>Landscape</Orientation>
  <ShowBarcodeFor_XObjects>false</ShowBarcodeFor_XObjects>
  <ZoomPercentage>100</ZoomPercentage>
  <CreatedDocVersion>8.0</CreatedDocVersion>
  <ViewMode>person</ViewMode>
  <Id>Sample1</Id>
  <PaperName>4x6</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="5760" Height="8640" Rx="270" Ry="270"/>
  </DrawCommands>
  <ObjectInfo>
    <TextObject>
      <Name>ProductName</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID></GroupID>
      <IsOutlined>false</IsOutlined>
      <Text>${this.escapeXml(name.substring(0, 40))}</Text>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>200</x>
        <y>200</y>
        <width>5360</width>
        <height>1000</height>
        <bold>true</bold>
        <italic>false</italic>
        <underline>false</underline>
        <strikethrough>false</strikethrough>
        <fontname>Arial</fontname>
        <fontsize>14</fontsize>
        <rotation>Rotation0</rotation>
        <alignment>Center</alignment>
        <lineSpacing>0</lineSpacing>
        <trimTrailingSpaces>true</trimTrailingSpaces>
        <wordWrap>true</wordWrap>
      </ItemData>
    </TextObject>
    <TextObject>
      <Name>Price</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID></GroupID>
      <IsOutlined>false</IsOutlined>
      <Text>€ ${this.formatPrice(price)}</Text>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>200</x>
        <y>1300</y>
        <width>5360</width>
        <height>600</height>
        <bold>true</bold>
        <italic>false</italic>
        <underline>false</underline>
        <strikethrough>false</strikethrough>
        <fontname>Arial</fontname>
        <fontsize>16</fontsize>
        <rotation>Rotation0</rotation>
        <alignment>Center</alignment>
        <lineSpacing>0</lineSpacing>
        <trimTrailingSpaces>true</trimTrailingSpaces>
        <wordWrap>false</wordWrap>
      </ItemData>
    </TextObject>
    <BarcodeObject>
      <Name>Barcode</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID></GroupID>
      <IsOutlined>false</IsOutlined>
      <Text>${barcode}</Text>
      <BarcodeType>Code128</BarcodeType>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>300</x>
        <y>2100</y>
        <width>5160</width>
        <height>900</height>
        <showText>true</showText>
      </ItemData>
    </BarcodeObject>
    <TextObject>
      <Name>SKU</Name>
      <ForeColor Alpha="255" Red="128" Green="128" Blue="128"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>false</IsMirrored>
      <IsVariable>false</IsVariable>
      <GroupID></GroupID>
      <IsOutlined>false</IsOutlined>
      <Text>SKU: ${sku || barcode}</Text>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>200</x>
        <y>3100</y>
        <width>5360</width>
        <height>400</height>
        <bold>false</bold>
        <italic>false</italic>
        <underline>false</underline>
        <strikethrough>false</strikethrough>
        <fontname>Arial</fontname>
        <fontsize>8</fontsize>
        <rotation>Rotation0</rotation>
        <alignment>Center</alignment>
        <lineSpacing>0</lineSpacing>
        <trimTrailingSpaces>true</trimTrailingSpaces>
        <wordWrap>false</wordWrap>
      </ItemData>
    </TextObject>
  </ObjectInfo>
</DieCutLabel>`

    return xml
  }

  static async sendToDymoPrintServer(labelXml) {
    try {
      // Create label in DYMO
      const response = await fetch(`${DYMO_PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          printerId: 'dymo-labelwriter-550',
          labelXml: labelXml,
          quantity: 1
        })
      })

      if (!response.ok) {
        throw new Error(`DYMO Print Server antwoord: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
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

      const response = await fetch(DYMO_SERVICE_URL, {
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
