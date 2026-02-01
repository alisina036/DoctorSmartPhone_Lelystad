export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Sale, InventoryProduct, StockMutation, StockAlert } from '@/lib/models/Inventory'
import mongoose from 'mongoose'

// POST - Maak nieuwe verkoop aan
export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      // Genereer sale number
      const today = new Date()
      const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      const todayCount = await Sale.countDocuments({
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999))
        }
      }).session(session)
      
      const saleNumber = `VK${datePrefix}-${String(todayCount + 1).padStart(4, '0')}`
      
      // Valideer en update voorraad voor elk item
      for (const item of data.items) {
        const product = await InventoryProduct.findById(item.productId).session(session)
        
        if (!product) {
          await session.abortTransaction()
          return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
        }
        
        if (product.stock < item.quantity) {
          await session.abortTransaction()
          return NextResponse.json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
          }, { status: 400 })
        }
        
        // Update voorraad
        const previousStock = product.stock
        product.stock -= item.quantity
        product.updatedAt = new Date()
        await product.save({ session })
        
        // Maak stockmutatie aan
        await StockMutation.create([{
          productId: item.productId,
          type: 'verkoop',
          quantity: item.quantity,
          previousStock,
          newStock: product.stock,
          reason: `Verkoop ${saleNumber} - €${item.unitPrice}/stuk`,
          saleId: null // Wordt later gezet
        }], { session })
        
        // Check voor low stock alert
        if (product.stock <= product.minStock) {
          const existingAlert = await StockAlert.findOne({
            productId: item.productId,
            isResolved: false
          }).session(session)
          
          if (!existingAlert) {
            await StockAlert.create([{
              productId: item.productId,
              alertType: product.stock === 0 ? 'out_of_stock' : 'low_stock',
              currentStock: product.stock,
              minStock: product.minStock
            }], { session })
          }
        }
      }
      
      // Maak verkoop aan
      const sale = await Sale.create([{
        saleNumber,
        items: data.items,
        subtotal: data.subtotal || data.totalAmount,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total: data.total || data.totalAmount,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes
      }], { session })
      
      await session.commitTransaction()
      
      const populatedSale = await Sale.findById(sale[0]._id)
        .populate({
          path: 'items.productId',
          populate: { path: 'deviceModelId' }
        })
      
      return NextResponse.json(populatedSale)
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ 
      error: 'Failed to create sale',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Haal verkopen op
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = {}
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    
    if (paymentMethod) query.paymentMethod = paymentMethod
    
    const sales = await Sale.find(query)
      .populate({
        path: 'items.productId',
        populate: { path: 'deviceModelId' }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    
    return NextResponse.json(JSON.parse(JSON.stringify(sales)))
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}
