import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Brand } from '@/lib/models/Brand'

export async function GET() {
  try {
    await connectDB()
    const brands = await Brand.find().sort({ order: 1, name: 1 }).lean()
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const data = await request.json()
    const brand = await Brand.create(data)
    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
