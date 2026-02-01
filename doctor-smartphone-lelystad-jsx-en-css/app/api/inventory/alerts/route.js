export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { StockAlert } from '@/lib/models/Inventory'
import { VitrineItem } from '@/lib/models/VitrineItem'

// GET - Haal stock alerts op
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    
    const isResolved = searchParams.get('isResolved')
    
    let query = {}
    
    if (isResolved !== null) {
      query.isResolved = isResolved === 'true'
    }
    
    const stockAlerts = await StockAlert.find(query)
      .populate({
        path: 'productId',
        populate: { path: 'deviceModelId' }
      })
      .sort({ createdAt: -1 })
      .lean()

    const normalizedStock = (stockAlerts || []).map((alert) => {
      const currentStock = alert.currentStock ?? alert.productId?.stock ?? 0
      const minStock = alert.minStock ?? alert.productId?.minStock ?? 0
      const fallbackMessage = currentStock <= 0
        ? `Voorraad van ${alert.productId?.name || 'product'} is op (${currentStock} stuks)`
        : `Voorraad van ${alert.productId?.name || 'product'} is laag (${currentStock} stuks)`

      return {
        ...alert,
        alertKind: 'stock',
        currentStock,
        minStock,
        message: alert.message || fallbackMessage
      }
    })

    let vitrineAlerts = []
    if (isResolved !== 'true') {
      const vitrineItems = await VitrineItem.find({}).sort({ updatedAt: -1 }).lean()
      vitrineAlerts = (vitrineItems || [])
        .map((item) => {
          const missingFields = []
          if (!item.prijs || item.prijs <= 0) missingFields.push('prijs')
          if (!item.fotos || item.fotos.length === 0) missingFields.push("foto's")
          if (!item.beschrijving || item.beschrijving.trim().length === 0) missingFields.push('beschrijving')

          if (missingFields.length === 0) return null

          return {
            _id: `vitrine-${item.id}`,
            alertKind: 'vitrine_missing_info',
            isResolved: false,
            createdAt: item.updatedAt || item.createdAt || new Date(),
            message: `Vitrine item mist: ${missingFields.join(', ')}`,
            missingFields,
            vitrineItem: item
          }
        })
        .filter(Boolean)
    }

    const combined = [...normalizedStock, ...vitrineAlerts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(JSON.parse(JSON.stringify(combined)))
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// PUT - Resolve alert
export async function PUT(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    const alert = await StockAlert.findByIdAndUpdate(
      data.id,
      {
        isResolved: true,
        resolvedAt: new Date()
      },
      { new: true }
    ).populate({
      path: 'productId',
      populate: { path: 'deviceModelId' }
    })
    
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error resolving alert:', error)
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 })
  }
}
