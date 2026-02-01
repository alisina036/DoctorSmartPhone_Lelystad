export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { InventoryProduct, StockMutation } from '@/lib/models/Inventory'

// GET - Haal alle producten op met filters
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    
    const categoryType = searchParams.get('categoryType')
    const deviceModelId = searchParams.get('deviceModelId')
    const barcode = searchParams.get('barcode')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    
    let query = {}
    
    if (categoryType) query.categoryType = categoryType
    if (deviceModelId) query.deviceModelId = deviceModelId
    if (barcode) query.barcode = barcode
    
    // Voor search met device name moeten we een aggregatie gebruiken
    let products
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' }
      
      products = await InventoryProduct.aggregate([
        {
          $lookup: {
            from: 'devices',
            localField: 'deviceModelId',
            foreignField: '_id',
            as: 'deviceModelId'
          }
        },
        {
          $unwind: {
            path: '$deviceModelId',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            ...query,
            $or: [
              { name: searchRegex },
              { barcode: searchRegex },
              { sku: searchRegex },
              { 'deviceModelId.name': searchRegex }
            ]
          }
        },
        { $sort: { createdAt: -1 } }
      ])
    } else {
      if (lowStock) {
        query.$expr = { $lte: ['$stock', '$minStock'] }
      }
      
      products = await InventoryProduct.find(query)
        .populate('deviceModelId')
        .sort({ createdAt: -1 })
        .lean()
    }
    
    return NextResponse.json(JSON.parse(JSON.stringify(products)))
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Maak nieuw product aan
export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    console.log('Received product data:', data)
    
    // Check of barcode al bestaat
    if (data.barcode) {
      const exists = await InventoryProduct.exists({ barcode: data.barcode })
      if (exists) {
        return NextResponse.json({ error: 'Deze barcode bestaat al in het systeem' }, { status: 400 })
      }
    }
    
    // Generate unique SKU als die niet is opgegeven
    if (!data.sku) {
      let sku
      let skuExists = true
      let attempt = 0
      const maxAttempts = 100
      
      while (skuExists && attempt < maxAttempts) {
        const count = await InventoryProduct.countDocuments()
        sku = `PRD${String(count + 1 + attempt).padStart(6, '0')}`
        
        // Check of deze SKU al bestaat
        skuExists = await InventoryProduct.exists({ sku })
        attempt++
      }
      
      if (skuExists) {
        // Als we na 100 pogingen nog geen unieke SKU hebben, gebruik timestamp
        sku = `PRD${Date.now().toString().slice(-6)}`
      }
      
      data.sku = sku
    } else {
      // Als er wel een SKU is opgegeven, check of die al bestaat
      const skuExists = await InventoryProduct.exists({ sku: data.sku })
      if (skuExists) {
        return NextResponse.json({ error: 'Deze SKU bestaat al in het systeem' }, { status: 400 })
      }
    }
    
    // Valideer verplichte velden
    if (!data.name) {
      return NextResponse.json({ error: 'Productnaam is verplicht' }, { status: 400 })
    }
    if (!data.categoryType) {
      return NextResponse.json({ error: 'Categorie is verplicht' }, { status: 400 })
    }
    if (data.salePrice === undefined || data.salePrice === null) {
      return NextResponse.json({ error: 'Verkoopprijs is verplicht' }, { status: 400 })
    }
    
    const product = await InventoryProduct.create(data)
    
    // Maak initiële stockmutatie aan als er stock is
    if (data.stock > 0) {
      await StockMutation.create({
        productId: product._id,
        type: 'inkoop',
        quantity: data.stock,
        previousStock: 0,
        newStock: data.stock,
        notes: 'Initiële voorraad'
      })
    }
    
    const populatedProduct = await InventoryProduct.findById(product._id)
      .populate('deviceModelId')
    
    return NextResponse.json(populatedProduct)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ 
      error: error.message || 'Er is een fout opgetreden bij het aanmaken van het product',
      details: error.toString()
    }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(request) {
  try {
    await connectDB()
    const data = await request.json()
    const { id, ...updateData } = data
    
    // Check of barcode al bestaat bij ander product
    if (updateData.barcode) {
      const exists = await InventoryProduct.exists({
        barcode: updateData.barcode,
        _id: { $ne: id }
      })
      if (exists) {
        return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 })
      }
    }
    
    const product = await InventoryProduct.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )
      .populate('deviceModelId')
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Verwijder product
export async function DELETE(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await InventoryProduct.findByIdAndDelete(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
