const PROXY_URL = '/api/admin/dymo/python-native-proxy'
const LOCAL_NATIVE_BASE_URLS = ['http://127.0.0.1:5001', 'http://localhost:5001']

const isLocalhost = () => {
  if (typeof window === 'undefined') return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

const isRemoteHttps = () => {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:' && !isLocalhost()
}

const getStatusUrl = () => (isLocalhost() ? PROXY_URL : `${LOCAL_NATIVE_BASE_URLS[0]}/health`)

const getPrintUrl = () => (isLocalhost() ? PROXY_URL : `${LOCAL_NATIVE_BASE_URLS[0]}/print`)

const getConnectivityHint = () => {
  if (isRemoteHttps()) {
    return 'Je gebruikt HTTPS (Netlify). Browser blokkeert vaak toegang naar lokale HTTP-service (127.0.0.1:5001). Gebruik localhost-dev of een HTTPS lokale printservice.'
  }
  return 'Controleer of scripts/dymo_native_flask_server.py draait op 127.0.0.1:5001.'
}

const fetchFromLocalNative = async (path, init = {}) => {
  let lastError = null

  for (const baseUrl of LOCAL_NATIVE_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        cache: 'no-store',
      })
      return response
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Lokale DYMO service niet bereikbaar')
}

const normalizePrice = (price) => {
  if (typeof price === 'number') return price.toFixed(2).replace('.', ',')
  return String(price ?? '').trim()
}

export class DymoService {
  static async checkDymoStatus() {
    try {
      const response = isLocalhost()
        ? await fetch(getStatusUrl(), {
            method: 'GET',
            cache: 'no-store',
          })
        : await fetchFromLocalNative('/health', { method: 'GET' })

      const data = await response.json().catch(() => ({}))
      const connected = Boolean(response.ok && data?.status === 'ok')

      return {
        connected,
        printers: connected ? ['DYMO LabelWriter 450'] : [],
        printerName: connected ? 'DYMO LabelWriter 450' : null,
        url: LOCAL_NATIVE_BASE_URLS[0],
        message: connected ? 'Python GDI server verbonden' : `Python GDI server offline. ${getConnectivityHint()}`,
        errorType: connected ? null : 'offline',
      }
    } catch (error) {
      return {
        connected: false,
        printers: [],
        printerName: null,
        url: LOCAL_NATIVE_BASE_URLS[0],
        message: `Python GDI server offline. ${getConnectivityHint()}`,
        errorType: isRemoteHttps() ? 'secure-context-blocked' : 'offline',
        details: error?.message || null,
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
        const response = isLocalhost()
          ? await fetch(getPrintUrl(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, price, sku: skuValue }),
              cache: 'no-store',
            })
          : await fetchFromLocalNative('/print', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, price, sku: skuValue }),
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
      const rawMessage = String(error?.message || 'Onbekende fout')
      const likelyNetworkBlock = /Failed to fetch|NetworkError|Load failed/i.test(rawMessage)
      const hint = likelyNetworkBlock ? ` ${getConnectivityHint()}` : ''

      return {
        success: false,
        message: `Fout bij printen: ${rawMessage}${hint}`,
        error: rawMessage,
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
