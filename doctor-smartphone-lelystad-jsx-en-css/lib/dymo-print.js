'use client'

/**
 * DYMO 450 Print Functie
 * POST requests naar DYMO Web Service op localhost:41951/41952
 * 
 * Gebruik:
 * import { printDymoLabel } from '@/lib/dymo-print'
 * await printDymoLabel('Product Naam', 29.99, '24082133930')
 */

export const DYMO_HOST = 'localhost'
export const DYMO_PORTS = [41951, 41952]
export const DYMO_PATHS = {
  printers: '/dcd/api/get-printers',
  print: '/dcd/api/print-label'
}
export let DEBUG_MODE = true // Set to false voor production

const buildServiceCandidates = () => {
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const protocols = isHttpsPage ? ['https'] : ['https', 'http']

  return protocols.flatMap((protocol) =>
    DYMO_PORTS.map((port) => `${protocol}://${DYMO_HOST}:${port}`)
  )
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
    .map((printer) => (typeof printer === 'string' ? printer : printer.name))
    .filter(Boolean)

  if (!normalized.length) return null

  const preferred = normalized.find((name) => /labelwriter/i.test(name))
  return preferred || normalized[0]
}

const classifyDymoError = (error, url) => {
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const isHttpTarget = typeof url === 'string' && url.startsWith('http://')
  const isTypeError = error && error.name === 'TypeError'

  if (isHttpsPage && (isHttpTarget || isTypeError)) {
    return { type: 'security', message: 'HTTPS beveiliging blokkeert toegang tot de DYMO service.' }
  }

  return { type: 'unreachable', message: 'DYMO service niet bereikbaar of printer niet aangesloten.' }
}

const checkDymoService = async () => {
  const candidates = buildServiceCandidates()
  let lastError = null

  for (const baseUrl of candidates) {
    const printersUrl = `${baseUrl}${DYMO_PATHS.printers}`

    try {
      const response = await fetch(printersUrl, { method: 'GET', mode: 'cors' })
      if (!response.ok) {
        if (response.status === 404) {
          lastError = { type: 'not-found', status: response.status, url: printersUrl }
          continue
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json().catch(() => null)
      const printers = normalizePrinters(data)
      const printerName = pickPrinterName(printers)

      return {
        available: true,
        url: baseUrl,
        printers,
        printerName
      }
    } catch (error) {
      lastError = { ...classifyDymoError(error, printersUrl), error }
    }
  }

  return { available: false, error: lastError }
}

/**
 * Genereert XML label template voor DYMO 11354 Multi-purpose label
 * @param {string} productName - Productnaam
 * @param {number} price - Prijs in euros
 * @param {string} sku - Barcode/SKU nummers
 * @returns {string} XML label content
 */
export function generateLabelXml(productName, price, sku) {
  const formattedPrice = price.toFixed(2).replace('.', ',')
  
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<DesktopLabel Version="8.0" Units="Twips" xmlns="http://www.dymo.com/namelight/tpe/v1">
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
          <String>${escapeXml(productName.substring(0, 30))}</String>
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
          <String>€ ${formattedPrice}</String>
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
      <Text>${sku}</Text>
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
  </ObjectInfo>
</DesktopLabel>`

  return xml
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Print DYMO Label
 * Stuurt XML naar DYMO 450 printer via Web Service
 * 
 * @param {string} productName - Product naam (bijv. "iPhone Case")
 * @param {number} price - Prijs in euros (bijv. 29.99)
 * @param {string} sku - Barcode/SKU (bijv. "24082133930")
 * @returns {Promise<Object>} Result object met success en message
 * 
 * @example
 * // Eenvoudig gebruik:
 * await printDymoLabel('iPhone Case', 29.99, '24082133930')
 * 
 * // Met error handling:
 * try {
 *   const result = await printDymoLabel('Product', 19.99, '1234567890')
 *   if (result.success) {
 *     console.log('✓ Label geprint!')
 *   }
 * } catch (error) {
 *   console.error('Print fout:', error)
 * }
 */
export async function printDymoLabel(productName, price, sku) {
  console.log('🖨️  DYMO Print Request gestart...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Validatie
  if (!productName || !price || !sku) {
    const errorMsg = 'Ontbrekende parameters: productName, price, en sku zijn verplicht'
    console.error('❌ Validatie fout:', errorMsg)
    return { success: false, message: errorMsg }
  }

  // XML genereren
  const labelXml = generateLabelXml(productName, price, sku)
  
  if (DEBUG_MODE) {
    console.log('%c📄 XML Label Template:', 'color: blue; font-weight: bold; font-size: 12px;')
    console.log(labelXml)
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue;')
  }

  // Log parameters
  console.log('%c📋 Label Parameters:', 'color: green; font-weight: bold;')
  console.log('  Productnaam:', productName)
  console.log('  Prijs:', `€${price.toFixed(2)}`)
  console.log('  Barcode/SKU:', sku)
  const serviceStatus = await checkDymoService()
  console.log('  Service beschikbaar:', serviceStatus.available ? '✅' : '❌')
  if (serviceStatus.available) {
    console.log('  Service URL:', serviceStatus.url)
    console.log('  Printer:', serviceStatus.printerName || 'Geen printer gevonden')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    if (!serviceStatus.available) {
      const errorType = serviceStatus.error?.type
      if (errorType === 'security') {
        console.error('❌ HTTPS beveiligingsblokkade: browser blokkeert toegang tot DYMO (mixed content of certificaat).')
      } else {
        console.error('❌ DYMO printer niet aangesloten of service draait niet op poort 41951/41952.')
      }

      return {
        success: false,
        message: 'Printer niet beschikbaar. Controleer DYMO Connect en de USB-verbinding.',
        error: serviceStatus.error?.message || 'DYMO service niet bereikbaar'
      }
    }

    console.log('%c📡 POST Request verzenden...', 'color: orange; font-weight: bold;')

    const response = await fetch(`${serviceStatus.url}${DYMO_PATHS.print}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        printerName: serviceStatus.printerName,
        labelXml: labelXml,
        printParams: '',
        labelSetXml: ''
      }),
      mode: 'cors',
      credentials: 'include'
    })

    console.log(`  HTTP Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    let responseData
    try {
      responseData = await response.json()
    } catch (e) {
      responseData = await response.text()
    }

    console.log('%c✅ SUCCESS: Label naar printer verzonden!', 'color: green; font-weight: bold; font-size: 14px;')
    console.log('  Response:', responseData)
    
    return {
      success: true,
      message: `✅ Label geprint! Productnaam: ${productName}, SKU: ${sku}`,
      response: responseData
    }

  } catch (error) {
    const errorMessage = error.message || 'Onbekende fout'
    console.error('%c❌ FOUT: Print mislukt!', 'color: red; font-weight: bold; font-size: 14px;')
    console.error('  Fout:', errorMessage)
    console.error('  Mogelijke oorzaken:')
    console.error('    • DYMO 450 printer niet aangesloten')
    console.error('    • DYMO Web Service draait niet op poort 41951/41952')
    console.error('    • CORS policy blokkering (check browser console)')
    console.error('    • Firewall blokkeert poort 41951/41952')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // XML output in console, zelfs bij fout
    if (DEBUG_MODE) {
      console.log('%c📄 XML die verzonden werd:', 'color: purple;')
      console.log(labelXml)
    }

    return {
      success: false,
      message: `Printer niet gevonden, check console voor XML-output. Fout: ${errorMessage}`,
      error: errorMessage
    }
  }
}

/**
 * Test functie voor DYMO service
 * Print test label met dummy data
 */
export async function testDymoPrint() {
  console.log('%c🧪 DYMO Test Print', 'color: blue; background: yellow; padding: 5px; font-weight: bold;')
  return await printDymoLabel(
    'Test Product',
    19.99,
    '24082133930'
  )
}

/**
 * Check DYMO Service Status
 * Stuurt ping naar DYMO service
 */
export async function checkDymoStatus() {
  console.log('🔍 Checking DYMO Service Status...')
  const status = await checkDymoService()

  if (status.available) {
    console.log('✅ DYMO Service antwoordt op', status.url)
  } else {
    console.warn('⚠️  DYMO Service niet bereikt op localhost:41951/41952')
  }

  return {
    connected: status.available,
    url: status.url,
    printers: status.printers || [],
    printerName: status.printerName || null
  }
}

// Globaal beschikbaar in browser voor console access
if (typeof window !== 'undefined') {
  window.DYMO = {
    printDymoLabel,
    testDymoPrint,
    checkDymoStatus,
    DEBUG_MODE,
    SERVICE_URLS: buildServiceCandidates()
  }
  console.log('💾 DYMO functions beschikbaar via: window.DYMO.printDymoLabel()')
}
