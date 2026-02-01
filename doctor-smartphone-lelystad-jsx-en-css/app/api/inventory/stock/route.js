export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { InventoryProduct, StockMutation, StockAlert } from '@/lib/models/Inventory'
import mongoose from 'mongoose'

// POST - Voorraad mutatie (inkoop, verkoop, correctie, retour)
export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      const product = await InventoryProduct.findById(data.productId).session(session)
      
      if (!product) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      
      const previousStock = product.stock
      let newStock = previousStock
      
      // Bereken nieuwe voorraad op basis van mutatietype
      switch (data.type) {
        case 'inkoop':
        case 'retour':
          newStock = previousStock + data.quantity
          break
        case 'verkoop':
        case 'correctie':
          newStock = previousStock - data.quantity
          break
      }
      
      // Check of voorraad niet negatief wordt
      if (newStock < 0) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }
      
      // Update product voorraad
      product.stock = newStock
      product.updatedAt = new Date()
      await product.save({ session })
      
      // Maak stockmutatie aan
      const mutation = await StockMutation.create([{
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock,
        unitCost: data.unitCost,
        notes: data.notes,
        invoiceNumber: data.invoiceNumber
      }], { session })
      
      // Check of er een stock alert moet worden aangemaakt
      if (newStock <= product.minStock) {
        const existingAlert = await StockAlert.findOne({
          productId: data.productId,
          isResolved: false
        }).session(session)
        
        if (!existingAlert) {
          await StockAlert.create([{
            productId: data.productId,
            currentStock: newStock,
            minStock: product.minStock,
            message: `Voorraad van ${product.name} is laag (${newStock} stuks)`
          }], { session })
        }
      }
      
      // Resolve alert als voorraad weer op peil is
      if (newStock > product.minStock) {
        await StockAlert.updateMany(
          { productId: data.productId, isResolved: false },
          { isResolved: true, resolvedAt: new Date() }
        ).session(session)
      }
      
      await session.commitTransaction()
      
      return NextResponse.json({
        product,
        mutation: mutation[0]
      })
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    console.error('Error processing stock mutation:', error)
    return NextResponse.json({ error: 'Failed to process stock mutation' }, { status: 500 })
  }
}

// GET - Haal stock mutations op
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = {}
    
    if (productId) query.productId = productId
    if (type) query.type = type
    
    const mutations = await StockMutation.find(query)
      .populate({
        path: 'productId',
        populate: { path: 'deviceModelId' }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    
    return NextResponse.json(JSON.parse(JSON.stringify(mutations)))
  } catch (error) {
    console.error('Error fetching stock mutations:', error)
    return NextResponse.json({ error: 'Failed to fetch mutations' }, { status: 500 })
  }
}
