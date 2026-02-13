import { NextRequest, NextResponse } from 'next/server'
import DymoService from '@/lib/dymo-service'

/**
 * POST /api/dymo/print
 * Print een product label via DYMO LabelWriter 450
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { productData, quantity = 1 } = body

    if (!productData) {
      return NextResponse.json(
        { error: 'Productgegevens ontbreken' },
        { status: 400 }
      )
    }

    // Valideer barcode
    const barcodeValidation = DymoService.validateBarcode(productData.barcode)
    if (!barcodeValidation.valid) {
      return NextResponse.json(
        { error: barcodeValidation.error },
        { status: 400 }
      )
    }

    // Print label
    const result = await DymoService.printLabel(productData, quantity)

    return NextResponse.json(result)
  } catch (error) {
    console.error('DYMO Print Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fout bij printen' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dymo/status
 * Check DYMO printer status
 */
export async function GET() {
  try {
    const status = await DymoService.checkDymoStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('DYMO Status Error:', error)
    return NextResponse.json(
      { connected: false, message: error.message },
      { status: 500 }
    )
  }
}
