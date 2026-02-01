export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Category, SubCategory } from '@/lib/models/Inventory'

// GET - Haal alle categorieën op
export async function GET() {
  try {
    await connectDB()
    
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean()
    const subCategories = await SubCategory.find().populate('categoryId').sort({ order: 1, name: 1 }).lean()
    
    return NextResponse.json({
      categories: JSON.parse(JSON.stringify(categories)),
      subCategories: JSON.parse(JSON.stringify(subCategories))
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - Maak nieuwe categorie of subcategorie aan
export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    if (data.type === 'category') {
      const category = await Category.create({
        name: data.name,
        type: data.categoryType,
        description: data.description,
        order: data.order || 0
      })
      return NextResponse.json(category)
    } else if (data.type === 'subcategory') {
      const subCategory = await SubCategory.create({
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        order: data.order || 0
      })
      return NextResponse.json(subCategory)
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT - Update categorie of subcategorie
export async function PUT(request) {
  try {
    await connectDB()
    const data = await request.json()
    
    if (data.type === 'category') {
      const category = await Category.findByIdAndUpdate(
        data.id,
        {
          name: data.name,
          description: data.description,
          order: data.order,
          updatedAt: new Date()
        },
        { new: true }
      )
      return NextResponse.json(category)
    } else if (data.type === 'subcategory') {
      const subCategory = await SubCategory.findByIdAndUpdate(
        data.id,
        {
          name: data.name,
          categoryId: data.categoryId,
          description: data.description,
          order: data.order,
          updatedAt: new Date()
        },
        { new: true }
      )
      return NextResponse.json(subCategory)
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE - Verwijder categorie of subcategorie
export async function DELETE(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    
    if (type === 'category') {
      // Check eerst of er subcategorieën gekoppeld zijn
      const hasSubCategories = await SubCategory.exists({ categoryId: id })
      if (hasSubCategories) {
        return NextResponse.json({ error: 'Cannot delete category with subcategories' }, { status: 400 })
      }
      await Category.findByIdAndDelete(id)
    } else if (type === 'subcategory') {
      await SubCategory.findByIdAndDelete(id)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
