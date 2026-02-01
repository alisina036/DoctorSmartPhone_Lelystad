import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Device } from '@/lib/models/Device'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    const type = searchParams.get('type')

    const filter: any = {}
    if (brandId) filter.brandId = brandId
    if (type) filter.type = type

    const devices = await Device.find(filter).sort({ order: 1, name: 1 }).lean()
    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const data = await request.json()
    const device = await Device.create(data)
    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}
