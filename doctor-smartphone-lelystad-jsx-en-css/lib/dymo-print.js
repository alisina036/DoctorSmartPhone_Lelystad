'use client'

export const DYMO_HOST = '127.0.0.1'
export const DYMO_PORTS = [5001]
export const DYMO_PATHS = {
  health: '/health',
  print: '/print',
}
export const DYMO_SERVICE_URL = 'http://127.0.0.1:5001'
export const DYMO_PRINTERS_URL = `${DYMO_SERVICE_URL}${DYMO_PATHS.health}`
export let DEBUG_MODE = true

const PROXY_URL = '/api/admin/dymo/python-native-proxy'

const toPriceString = (price) => {
  if (typeof price === 'number') {
    return price.toFixed(2).replace('.', ',')
  }
  return String(price ?? '').trim()
}

export function generateLabelXml(productName, price, sku) {
  return JSON.stringify({ productName, price, sku })
}

export function escapeXml(str) {
  return String(str)
}

export async function printDymoLabel(productName, price, sku) {
  if (!productName || price == null || !sku) {
    return { success: false, message: 'Ontbrekende parameters: productName, price, sku' }
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: String(productName).trim(),
        price: toPriceString(price),
        sku: String(sku).trim(),
      }),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok && data?.success) {
      return {
        success: true,
        message: `✅ Label geprint! Productnaam: ${productName}, SKU: ${sku}`,
      }
    }

    return {
      success: false,
      message: data?.error || 'Print mislukt',
      errorCode: data?.errorCode ?? null,
    }
  } catch {
    return {
      success: false,
      message: 'Python backend niet bereikbaar. Start server op poort 5001.',
      errorCode: null,
    }
  }
}

export async function testDymoPrint() {
  return printDymoLabel('Test Product', 19.99, '24082133930')
}

export async function checkDymoStatus() {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'GET',
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))

    const connected = Boolean(response.ok && data?.status === 'ok')

    return {
      connected,
      url: DYMO_SERVICE_URL,
      printers: connected ? ['DYMO LabelWriter 450'] : [],
      printerName: connected ? 'DYMO LabelWriter 450' : null,
    }
  } catch {
    return {
      connected: false,
      url: DYMO_SERVICE_URL,
      printers: [],
      printerName: null,
    }
  }
}

if (typeof window !== 'undefined') {
  window.DYMO = {
    printDymoLabel,
    testDymoPrint,
    checkDymoStatus,
    DEBUG_MODE,
    SERVICE_URLS: [DYMO_SERVICE_URL],
  }
}
