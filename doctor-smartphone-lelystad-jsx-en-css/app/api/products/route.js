export const runtime = "nodejs"

import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"

function parseId(searchParams) {
  return String(searchParams?.get("id") || "").trim()
}

export async function GET() {
  await connectDB()
  const products = await Product.find({}).sort({ name: 1 }).lean()
  return NextResponse.json({ products })
}

export async function POST(request) {
  await connectDB()
  const payload = await request.json()
  const product = payload?.product || payload

  if (!product?.id || !product?.name || !product?.category || !product?.barcode) {
    return NextResponse.json({ error: "Ongeldig product." }, { status: 400 })
  }

  const update = {
    ...product,
    name: String(product.name || "").trim(),
    category: String(product.category || "").trim(),
    barcode: String(product.barcode || "").trim(),
    price: Number(product.price || 0),
    stock_count: Number(product.stock_count || 0),
  }

  const saved = await Product.findOneAndUpdate(
    { id: product.id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return NextResponse.json({ product: saved })
}

export async function DELETE(request) {
  await connectDB()
  const url = new URL(request.url)
  const id = parseId(url.searchParams)
  if (!id) {
    return NextResponse.json({ error: "Geen id." }, { status: 400 })
  }
  await Product.deleteOne({ id })
  return NextResponse.json({ ok: true })
}
