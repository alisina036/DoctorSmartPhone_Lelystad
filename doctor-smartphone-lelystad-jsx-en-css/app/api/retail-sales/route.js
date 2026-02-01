export const runtime = "nodejs"

import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"

export async function POST(request) {
  await connectDB()
  const payload = await request.json()
  const productId = String(payload?.productId || "").trim()
  const quantity = Number(payload?.quantity || 0)

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Ongeldige verkoop." }, { status: 400 })
  }

  const updated = await Product.findOneAndUpdate(
    { id: productId, stock_count: { $gte: quantity } },
    { $inc: { stock_count: -quantity } },
    { new: true }
  ).lean()

  if (!updated) {
    const existing = await Product.findOne({ id: productId }).lean()
    if (!existing) {
      return NextResponse.json({ error: "Product niet gevonden." }, { status: 404 })
    }
    return NextResponse.json({ error: "Onvoldoende voorraad." }, { status: 400 })
  }

  return NextResponse.json({ product: updated })
}
