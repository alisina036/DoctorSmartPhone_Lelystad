'use client'

/**
 * DYMO 550 Print Functie
 * POST requests naar DYMO Web Service op localhost:41951
 * 
 * Gebruik:
 * import { printDymoLabel } from '@/lib/dymo-print'
 * await printDymoLabel('Product Naam', 29.99, '24082133930')
 */

export const DYMO_SERVICE_URL = 'https://localhost:41951/dymo/lblwriter/print'
export let DEBUG_MODE = true // Set to false voor production

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
  <PaperName>11354</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="3150" Height="1800" Rx="270" Ry="270"/>
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
      <Text>${escapeXml(productName.substring(0, 30))}</Text>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>100</x>
        <y>50</y>
        <width>2950</width>
        <height>400</height>
        <bold>true</bold>
        <italic>false</italic>
        <underline>false</underline>
        <strikethrough>false</strikethrough>
        <fontname>Arial</fontname>
        <fontsize>10</fontsize>
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
      <Text>€ ${formattedPrice}</Text>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>100</x>
        <y>450</y>
        <width>2950</width>
        <height>300</height>
        <bold>true</bold>
        <italic>false</italic>
        <underline>false</underline>
        <strikethrough>false</strikethrough>
        <fontname>Arial</fontname>
        <fontsize>12</fontsize>
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
      <Text>${sku}</Text>
      <BarcodeType>Code128</BarcodeType>
      <ItemData>
        <Charset>UTF-8</Charset>
        <x>200</x>
        <y>850</y>
        <width>2750</width>
        <height>500</height>
        <showText>true</showText>
      </ItemData>
    </BarcodeObject>
  </ObjectInfo>
</DieCutLabel>`

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
 * Stuurt XML naar DYMO 550 printer via Web Service
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
  console.log('  Service URL:', DYMO_SERVICE_URL)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    console.log('%c📡 POST Request verzenden...', 'color: orange; font-weight: bold;')
    
    const response = await fetch(DYMO_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json'
      },
      body: labelXml,
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
    console.error('    • DYMO 550 printer niet aangesloten')
    console.error('    • DYMO Web Service draait niet op poort 41951')
    console.error('    • CORS policy blokkering (check browser console)')
    console.error('    • Firewall blokkeert poort 41951')
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
  try {
    const response = await fetch(DYMO_SERVICE_URL, {
      method: 'OPTIONS',
      mode: 'cors'
    }).catch(() => null)
    
    if (response) {
      console.log('✅ DYMO Service antwoordt op poort 41951')
      return { connected: true }
    }
  } catch (error) {
    // Error is expected voor OPTIONS request
  }
  
  console.warn('⚠️  DYMO Service niet bereikt op localhost:41951')
  return { connected: false }
}

// Globaal beschikbaar in browser voor console access
if (typeof window !== 'undefined') {
  window.DYMO = {
    printDymoLabel,
    testDymoPrint,
    checkDymoStatus,
    DEBUG_MODE,
    SERVICE_URL: DYMO_SERVICE_URL
  }
  console.log('💾 DYMO functions beschikbaar via: window.DYMO.printDymoLabel()')
}
