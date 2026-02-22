'use client'

const PROXY_URL = '/api/admin/dymo/python-native-proxy'

const toPriceString = (price) => {
  if (typeof price === 'number') {
    return price.toFixed(2).replace('.', ',')
  }
  return String(price ?? '').trim()
}

export async function printLabel(product) {
  if (!product?.name || product?.price == null || !product?.sku) {
    return {
      success: false,
      message: 'Invalid product: vereist { name, price, sku }',
      errorCode: null,
    }
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: String(product.name).trim(),
        price: toPriceString(product.price),
        sku: String(product.sku).trim(),
      }),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok && data?.success) {
      return {
        success: true,
        message: `Label geprint: ${product.name}`,
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
      message: 'Python backend niet bereikbaar. Start de server op poort 5001.',
      errorCode: null,
    }
  }
}

export async function testPrint() {
  return printLabel({
    name: 'Test Product',
    price: 19.99,
    sku: 'TEST-001',
  })
}

export async function checkDymoStatus() {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'GET',
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    const available = Boolean(response.ok && data?.status === 'ok')

    return {
      available,
      url: 'http://127.0.0.1:5001',
      printers: available ? ['DYMO LabelWriter 450'] : [],
      printerName: available ? 'DYMO LabelWriter 450' : null,
      errorType: available ? null : 'offline',
    }
  } catch {
    return {
      available: false,
      url: 'http://127.0.0.1:5001',
      printers: [],
      printerName: null,
      errorType: 'offline',
    }
  }
}
