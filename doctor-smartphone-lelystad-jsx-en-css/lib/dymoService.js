'use client'

/**
 * DYMO 550 Label Print Service
 * 
 * Functionaliteit:
 * - Print labels naar DYMO 550 via localhost:41951
 * - Als verbinding faalt: toon XML in modal (thuis testen)
 * - Volledige debug logging in console
 * 
 * Gebruik:
 * import { printLabel } from '@/lib/dymoService'
 * await printLabel({ name: 'iPhone 16 Plus Case', price: 29.99, sku: '123456' })
 */

const DYMO_SERVICE_URL = 'https://localhost:41951/dymo/lblwriter/print'
const DYMO_CHECK_TIMEOUT = 2000 // 2 seconden timeout

/**
 * Generate XML voor DYMO 11354 label (54mm x 101mm)
 * @param {Object} product - { name, price, sku }
 * @returns {string} XML template
 */
function generateDymoXML(product) {
  const { name, price, sku } = product
  const formattedPrice = `€ ${price.toFixed(2).replace('.', ',')}`
  
  // Escape XML characters
  const escapeName = String(name).replace(/[<>&"']/g, (c) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }
    return map[c]
  })
  
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
    <!-- Product Naam -->
    <TextObject>
      <Name>ProductName</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
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
          <String>${escapeName}</String>
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
    
    <!-- Prijs -->
    <TextObject>
      <Name>Price</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
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
          <String>${formattedPrice}</String>
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
    
    <!-- Barcode (Code 128) -->
    <BarcodeObject>
      <Name>Barcode</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
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
          <Y>1000</Y>
        </DYMOPoint>
        <Size>
          <Width>2700</Width>
          <Height>650</Height>
        </Size>
      </ObjectLayout>
    </BarcodeObject>
  </ObjectInfo>
</DieCutLabel>`

  return xml
}

/**
 * Show XML in modal overlay (voor thuis testen)
 */
function showXMLModal(xml, product) {
  // Verwijder oude modal als die bestaat
  const existingModal = document.getElementById('dymo-xml-modal')
  if (existingModal) {
    existingModal.remove()
  }

  // Maak modal
  const modal = document.createElement('div')
  modal.id = 'dymo-xml-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.7);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  `

  modal.innerHTML = `
    <div style="
      background: #ffffff;
      border-radius: 14px;
      max-width: 820px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 24px 60px rgba(2, 6, 23, 0.25);
      animation: slideUp 0.3s ease;
    ">
      <!-- Header -->
      <div style="
        background: #0f172a;
        padding: 20px 24px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">
            🖨️ DYMO Label XML Preview
          </h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.85;">
            Printer niet beschikbaar - XML output voor debugging
          </p>
        </div>
        <button 
          data-action="close-modal"
          style="
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, border-color 0.2s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.borderColor='rgba(255,255,255,0.35)'"
          onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(255,255,255,0.2)'"
        >×</button>
      </div>

      <!-- Product Info -->
      <div style="
        background: #f8fafc;
        padding: 16px 24px;
        border-bottom: 1px solid #e2e8f0;
      ">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Product</div>
            <div style="font-size: 14px; color: #0f172a; font-weight: 600;">${product.name}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Prijs</div>
            <div style="font-size: 14px; color: #0f172a; font-weight: 700;">€ ${product.price.toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">SKU</div>
            <div style="font-size: 14px; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${product.sku}</div>
          </div>
        </div>
      </div>

      <!-- XML Content -->
      <div style="
        padding: 24px;
        overflow-y: auto;
        max-height: calc(90vh - 240px);
      ">
        <div style="
          background: #0b1220;
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
          border: 1px solid #1e293b;
        ">
          <pre style="
            margin: 0;
            color: #e2e8f0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          ">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="
        padding: 16px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="font-size: 12px; color: #64748b;">
          💡 Console.log bevat ook de volledige XML output
        </div>
        <div style="display: flex; gap: 12px;">
          <button 
            data-action="copy-xml"
            style="
              background: #ffffff;
              border: 1px solid #e2e8f0;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              color: #0f172a;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#f1f5f9'"
            onmouseout="this.style.background='white'"
          >📋 Copy XML</button>
          <button 
            data-action="close-modal"
            style="
              background: #3ca0de;
              border: none;
              padding: 8px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              color: white;
              transition: filter 0.2s;
            "
            onmouseover="this.style.filter='brightness(0.95)'"
            onmouseout="this.style.filter='brightness(1)'"
          >Sluiten</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `

  document.body.appendChild(modal)

  const copyButton = modal.querySelector('[data-action="copy-xml"]')
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(xml)
        copyButton.textContent = '✓ Gekopieerd!'
        setTimeout(() => {
          copyButton.textContent = '📋 Copy XML'
        }, 2000)
      } catch (error) {
        copyButton.textContent = '❌ Kopie mislukt'
        setTimeout(() => {
          copyButton.textContent = '📋 Copy XML'
        }, 2000)
      }
    })
  }

  const closeButton = modal.querySelector('[data-action="close-modal"]')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.remove()
    })
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })

  // Close on ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

/**
 * Check of DYMO Web Service beschikbaar is
 */
async function isDymoServiceAvailable() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DYMO_CHECK_TIMEOUT)

    const response = await fetch(DYMO_SERVICE_URL, {
      method: 'OPTIONS',
      signal: controller.signal,
      mode: 'cors'
    })

    clearTimeout(timeoutId)
    return response.ok || response.status === 405 // 405 = Method not allowed maar service draait
  } catch (error) {
    return false
  }
}

/**
 * Print Label naar DYMO 550
 * 
 * Als printer niet beschikbaar: toon XML in modal
 * 
 * @param {Object} product - { name, price, sku }
 * @returns {Promise<Object>} { success, message, xml }
 */
export async function printLabel(product) {
  console.log('%c🖨️  DYMO Print Label Request', 'background: #667eea; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Validatie
  if (!product || !product.name || product.price == null || !product.sku) {
    const error = 'Invalid product: vereist { name, price, sku }'
    console.error('%c❌ Validatie Error', 'color: red; font-weight: bold;', error)
    return { success: false, message: error }
  }

  console.log('%c📦 Product Info:', 'color: #2196F3; font-weight: bold;')
  console.log('  Naam:', product.name)
  console.log('  Prijs: €', product.price.toFixed(2))
  console.log('  SKU:', product.sku)

  // Genereer XML
  const xml = generateDymoXML(product)
  
  console.log('%c📄 XML Template Generated:', 'color: #9C27B0; font-weight: bold;')
  console.log(xml)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Check localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  console.log('%c🌐 Environment Check:', 'color: #FF9800; font-weight: bold;')
  console.log('  Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side')
  console.log('  Is Localhost:', isLocalhost)

  // Check DYMO service
  console.log('%c🔍 Checking DYMO Service...', 'color: #00BCD4; font-weight: bold;')
  const serviceAvailable = await isDymoServiceAvailable()
  console.log('  Service URL:', DYMO_SERVICE_URL)
  console.log('  Available:', serviceAvailable ? '✅ Yes' : '❌ No')

  if (!serviceAvailable) {
    console.warn('%c⚠️  DYMO Service Niet Beschikbaar', 'color: orange; font-weight: bold; font-size: 13px;')
    console.log('  Mogelijke oorzaken:')
    console.log('    • DYMO Connect software niet geïnstalleerd')
    console.log('    • DYMO 550 printer niet aangesloten')
    console.log('    • Web Service draait niet op poort 41951')
    console.log('    • Je bent thuis zonder printer (expected!)')
    console.log('')
    console.log('%c💡 DEBUG MODE: XML wordt getoond in modal', 'background: #FFC107; color: black; padding: 6px 12px; border-radius: 4px; font-weight: bold;')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Toon XML in modal
    if (typeof window !== 'undefined') {
      showXMLModal(xml, product)
    }

    return {
      success: false,
      message: 'Printer niet beschikbaar - XML getoond in modal',
      xml,
      debugMode: true
    }
  }

  // Probeer te printen
  try {
    console.log('%c📡 Sending POST Request...', 'color: #4CAF50; font-weight: bold;')
    
    const response = await fetch(DYMO_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json'
      },
      body: xml,
      mode: 'cors'
    })

    console.log('  Status:', response.status, response.statusText)

    if (response.ok) {
      const result = await response.text()
      console.log('%c✅ SUCCESS - Label verzonden naar printer!', 'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;')
      console.log('  Response:', result)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return {
        success: true,
        message: `Label geprint: ${product.name}`,
        xml,
        response: result
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

  } catch (error) {
    console.error('%c❌ Print Failed', 'background: #f44336; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;', error)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Toon XML in modal bij error
    if (typeof window !== 'undefined') {
      showXMLModal(xml, product)
    }

    return {
      success: false,
      message: `Print error: ${error.message}`,
      xml,
      error: error.message
    }
  }
}

/**
 * Test functie met dummy data
 */
export async function testPrint() {
  return await printLabel({
    name: 'iPhone 16 Plus Case - Test',
    price: 29.99,
    sku: '24082133930'
  })
}

/**
 * Check DYMO service status
 */
export async function checkDymoStatus() {
  console.log('🔍 Checking DYMO Service Status...')
  const available = await isDymoServiceAvailable()
  
  if (available) {
    console.log('✅ DYMO Service is beschikbaar op', DYMO_SERVICE_URL)
  } else {
    console.warn('❌ DYMO Service niet bereikbaar')
  }

  return { available, url: DYMO_SERVICE_URL }
}
