const PROXY_URL = '/api/admin/dymo/python-native-proxy'

const normalizePrice = (price) => {
  if (typeof price === 'number') return price.toFixed(2).replace('.', ',')
  return String(price ?? '').trim()
}

export class DymoService {
  static async checkDymoStatus() {
    try {
      const response = await fetch(PROXY_URL, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json().catch(() => ({}))
      const connected = Boolean(response.ok && data?.status === 'ok')

      return {
        connected,
        printers: connected ? ['DYMO LabelWriter 450'] : [],
        printerName: connected ? 'DYMO LabelWriter 450' : null,
        url: 'http://127.0.0.1:5001',
        message: connected ? 'Python GDI server verbonden' : 'Python GDI server offline',
        errorType: connected ? null : 'offline',
      }
    } catch {
      return {
        connected: false,
        printers: [],
        printerName: null,
        url: 'http://127.0.0.1:5001',
        message: 'Python GDI server offline',
        errorType: 'offline',
      }
    }
  }

  static async printLabel(productData, quantity = 1) {
    try {
      if (!productData?.name || productData?.price == null || (!productData?.sku && !productData?.barcode)) {
        throw new Error('Ontbrekende productgegevens (naam, prijs of sku/barcode)')
      }

      const skuValue = String(productData.sku || productData.barcode).trim()
      const productName = String(productData.name).trim()
      const price = normalizePrice(productData.price)

      for (let index = 0; index < quantity; index += 1) {
        const response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, price, sku: skuValue }),
          cache: 'no-store',
        })

        const data = await response.json().catch(() => ({}))

        if (!(response.ok && data?.success)) {
          throw new Error(data?.error || `Print mislukt (HTTP ${response.status})`)
        }
      }

      return {
        success: true,
        message: `${quantity} label(s) naar DYMO 450 verzonden`,
        quantity,
      }
    } catch (error) {
      return {
        success: false,
        message: `Fout bij printen: ${error.message}`,
        error: error.message,
      }
    }
  }

  static validateBarcode(barcode) {
    if (!barcode || barcode.length < 3) {
      return { valid: false, error: 'Barcode moet minstens 3 karakters lang zijn' }
    }

    if (!/^[!-~]+$/.test(barcode)) {
      return { valid: false, error: 'Barcode bevat ongeldige karakters' }
    }

    return { valid: true }
  }

  static async printTestLabel() {
    return this.printLabel(
      {
        name: 'Test Product',
        price: 19.99,
        barcode: '1234567890123',
        sku: 'TEST-001',
      },
      1
    )
  }
}

export default DymoService
