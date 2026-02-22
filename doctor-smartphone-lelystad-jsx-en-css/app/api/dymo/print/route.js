import { NextResponse } from 'next/server'

const PROXY_URL = 'http://127.0.0.1:3000/api/admin/dymo/python-native-proxy'

export async function POST(request) {
  try {
    const body = await request.json()
    const productData = body?.productData || {}
    const productName = String(productData?.name ?? body?.productName ?? '').trim()
    const priceValue = productData?.price ?? body?.price
    const sku = String(productData?.sku ?? productData?.barcode ?? body?.sku ?? '').trim()

    if (!productName || priceValue == null || !sku) {
      return NextResponse.json(
        {
          success: false,
          error: 'productName, price en sku zijn verplicht',
          errorCode: null,
        },
        { status: 400 }
      )
    }

    const price = typeof priceValue === 'number' ? priceValue.toFixed(2).replace('.', ',') : String(priceValue)

    const proxyResponse = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, price, sku }),
      cache: 'no-store',
    })

    const data = await proxyResponse.json().catch(() => ({}))

    return NextResponse.json(data, { status: proxyResponse.status })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Fout bij printen',
        errorCode: null,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Gebruik /api/admin/dymo/python-native-proxy voor status checks',
    },
    { status: 410 }
  )
}
