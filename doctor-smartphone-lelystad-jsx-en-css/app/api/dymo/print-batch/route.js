import { NextRequest, NextResponse } from 'next/server'
import DymoService from '@/lib/dymo-service'

/**
 * POST /api/dymo/print-batch
 * Print meerdere product labels tegelijk via DYMO LabelWriter 450
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { items = [] } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Geen items om te printen' },
        { status: 400 }
      )
    }

    // Valideer alle items
    const validationErrors = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.productData) {
        validationErrors.push(`Item ${i + 1}: Productgegevens ontbreken`)
        continue
      }

      const barcodeValidation = DymoService.validateBarcode(item.productData.barcode)
      if (!barcodeValidation.valid) {
        validationErrors.push(`Item ${i + 1} (${item.productData.name}): ${barcodeValidation.error}`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; ') },
        { status: 400 }
      )
    }

    // Print alle items
    const results = []
    let totalPrinted = 0

    for (const item of items) {
      try {
        const result = await DymoService.printLabel(
          item.productData,
          item.quantity || 1
        )
        
        if (result.success) {
          totalPrinted += (item.quantity || 1)
          results.push({
            productName: item.productData.name,
            success: true,
            quantity: item.quantity || 1
          })
        } else {
          results.push({
            productName: item.productData.name,
            success: false,
            error: result.message
          })
        }
      } catch (error) {
        results.push({
          productName: item.productData.name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failureCount === 0,
      totalPrinted,
      processed: items.length,
      successCount,
      failureCount,
      results,
      message: `${successCount} van ${items.length} prints voltooid${failureCount > 0 ? `, ${failureCount} mislukt` : ''}`
    })

  } catch (error) {
    console.error('DYMO Batch Print Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fout bij batch printen' },
      { status: 500 }
    )
  }
}
