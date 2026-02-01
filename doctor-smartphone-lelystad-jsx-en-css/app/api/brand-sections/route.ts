// Brand sections API route
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BrandSection } from '@/lib/models/BrandSection'

export async function GET() {
  try {
    await connectDB()
    const collator = new Intl.Collator('nl', { sensitivity: 'base' })
    const sections = await BrandSection.find().lean()
    sections.sort((a:any,b:any)=>((a.order ?? 0)-(b.order ?? 0)) || collator.compare(a.name,b.name))
    return NextResponse.json(sections)
  } catch (e) {
    console.error('GET /api/brand-sections error:', e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const body = await req.json()
    const name = (body?.name as string)?.trim()
    if (!name) return NextResponse.json({ ok: false, error: 'Name required' }, { status: 400 })
    const id = (body?.id as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await BrandSection.findOne({ id })
    if (existing) {
      await BrandSection.updateOne({ id }, { name })
    } else {
      await BrandSection.create({ id, name, order: 0 })
    }
    const collator = new Intl.Collator('nl', { sensitivity: 'base' })
    const sections = await BrandSection.find().lean()
    sections.sort((a:any,b:any)=>((a.order ?? 0)-(b.order ?? 0)) || collator.compare(a.name,b.name))
    return NextResponse.json(sections)
  } catch (e) {
    console.error('POST /api/brand-sections error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
