export const runtime = "nodejs"

import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ProductType } from "@/lib/models/ProductType"

function parseId(searchParams) {
  return String(searchParams?.get("id") || "").trim()
}

export async function GET() {
  await connectDB()
  const types = await ProductType.find({}).sort({ name: 1 }).lean()
  return NextResponse.json({ types })
}

export async function POST(request) {
  await connectDB()
  const payload = await request.json()
  const type = payload?.type || payload

  const name = String(type?.name || "").trim()
  const id = String(type?.id || "").trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  if (!name) {
    return NextResponse.json({ error: "Ongeldige categorie." }, { status: 400 })
  }

  const update = {
    id,
    name,
    hideInWizard: Boolean(type?.hideInWizard),
  }

  const saved = await ProductType.findOneAndUpdate(
    { id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return NextResponse.json({ type: saved })
}

export async function DELETE(request) {
  await connectDB()
  const url = new URL(request.url)
  const id = parseId(url.searchParams)
  if (!id) {
    return NextResponse.json({ error: "Geen id." }, { status: 400 })
  }
  await ProductType.deleteOne({ id })
  return NextResponse.json({ ok: true })
}
