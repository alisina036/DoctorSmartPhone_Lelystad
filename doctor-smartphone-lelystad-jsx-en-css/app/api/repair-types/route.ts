import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RepairType } from '@/lib/models/RepairType'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const types = await RepairType.find().sort({ order: 1, name: 1 }).lean()
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching repair types:', error)
    return NextResponse.json({ error: 'Failed to fetch repair types' }, { status: 500 })
  }
}
