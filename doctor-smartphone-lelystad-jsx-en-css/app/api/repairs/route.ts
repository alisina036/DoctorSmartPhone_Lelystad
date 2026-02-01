import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Repair } from '@/lib/models/Repair'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    const filter: any = {}
    if (deviceId) filter.deviceId = deviceId

    const repairs = await Repair.find(filter).sort({ order: 1, name: 1 }).lean()
    return NextResponse.json(repairs)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const data = await request.json()
    const repair = await Repair.create(data)
    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 })
  }
}
