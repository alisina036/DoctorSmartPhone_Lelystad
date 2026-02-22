import { NextResponse } from 'next/server'

const PROXY_URL = 'http://127.0.0.1:3000/api/admin/dymo/python-native-proxy'

export async function POST(request) {
  try {
    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    if (!items.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geen items om te printen',
        },
        { status: 400 }
      )
    }

    const results = []

    for (const item of items) {
      const productData = item?.productData || {}
      const quantity = Math.max(1, Number(item?.quantity || 1))
      const productName = String(productData?.name ?? '').trim()
      const priceValue = productData?.price
      const sku = String(productData?.sku ?? productData?.barcode ?? '').trim()

      if (!productName || priceValue == null || !sku) {
        results.push({
          productName: productName || 'Onbekend',
          success: false,
          quantity,
          error: 'productName, price en sku zijn verplicht',
        })
        continue
      }

      const price = typeof priceValue === 'number' ? priceValue.toFixed(2).replace('.', ',') : String(priceValue)

      let itemSuccess = true
      let itemError = null

      for (let i = 0; i < quantity; i += 1) {
        const proxyResponse = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, price, sku }),
          cache: 'no-store',
        })

        const proxyData = await proxyResponse.json().catch(() => ({}))

        if (!(proxyResponse.ok && proxyData?.success)) {
          itemSuccess = false
          itemError = proxyData?.error || `Print mislukt (HTTP ${proxyResponse.status})`
          break
        }
      }

      results.push({
        productName,
        success: itemSuccess,
        quantity,
        error: itemError,
      })
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: failureCount === 0,
      processed: results.length,
      successCount,
      failureCount,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Fout bij batch printen',
      },
      { status: 500 }
    )
  }
}
