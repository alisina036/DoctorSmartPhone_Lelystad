export const runtime = "nodejs"

import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Invoice } from "@/lib/models/Invoice"
import { VitrineItem } from "@/lib/models/VitrineItem"

function parseId(searchParams) {
  return String(searchParams?.get("id") || "").trim()
}

export async function GET() {
  await connectDB()
  const invoices = await Invoice.find({}).sort({ createdAt: -1 }).lean()
  const lastNumber = invoices.reduce((max, inv) => (Number(inv.number || 0) > max ? Number(inv.number || 0) : max), 0)
  return NextResponse.json({ invoices, lastNumber })
}

export async function POST(request) {
  await connectDB()
  const payload = await request.json()
  const invoice = payload?.invoice || payload

  if (!invoice?.id || !invoice?.number) {
    return NextResponse.json({ error: "Ongeldige factuur." }, { status: 400 })
  }

  const update = {
    ...invoice,
    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
  }

  const saved = await Invoice.findOneAndUpdate(
    { id: invoice.id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  if (String(invoice?.type || "") === "inkoop") {
    const lines = Array.isArray(invoice?.lines) ? invoice.lines : []
    for (const line of lines) {
      const imei = String(line?.imei || "").trim()
      if (!imei) continue
      const digitsOnly = imei.replace(/\D+/g, "")
      const regex = digitsOnly
        ? new RegExp(digitsOnly.split("").map((d) => `${d}\\D*`).join(""), "i")
        : null
      const or = [{ imei }]
      if (digitsOnly && digitsOnly !== imei) or.push({ imei: digitsOnly })
      if (regex) or.push({ imei: { $regex: regex } })

      const existing = await VitrineItem.findOne({ $or: or }).lean()

      const payload = {
        id: existing?.id || `vit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: existing?.type || "Telefoon",
        merk: existing?.merk || "Onbekend",
        model: String(line?.description || "Toestel").trim(),
        opslag: String(line?.opslag || "").trim(),
        prijs: Number(line?.price || 0),
        kleur: String(line?.kleur || "").trim(),
        batterijConditie: Number(line?.batterijConditie || 0) || 0,
        status: String(line?.status || "Tweedehands"),
        imei,
        voorraadStatus: "beschikbaar",
        fotos: Array.isArray(existing?.fotos) ? existing.fotos : [],
        beschrijving: String(existing?.beschrijving || ""),
      }

      if (existing) {
        await VitrineItem.updateOne({ id: existing.id }, { $set: payload })
      } else {
        await VitrineItem.create(payload)
      }
    }
  }

  if (String(invoice?.type || "") === "verkoop") {
    const imeiRaw = Array.isArray(invoice?.imeiList) ? invoice.imeiList.find((x) => String(x || "").trim()) : ""
    const imei = String(imeiRaw || "").trim()
    if (imei) {
      const digitsOnly = imei.replace(/\D+/g, "")
      const regex = digitsOnly
        ? new RegExp(digitsOnly.split("").map((d) => `${d}\\D*`).join(""), "i")
        : null
      const or = [{ imei }]
      if (digitsOnly && digitsOnly !== imei) or.push({ imei: digitsOnly })
      if (regex) or.push({ imei: { $regex: regex } })
      const filter = { $or: or }
      await VitrineItem.findOneAndUpdate(
        filter,
        { $set: { voorraadStatus: "verkocht" } },
        { new: true }
      ).lean()
    }
  }

  const invoices = await Invoice.find({}).sort({ createdAt: -1 }).lean()
  const lastNumber = invoices.reduce((max, inv) => (Number(inv.number || 0) > max ? Number(inv.number || 0) : max), 0)

  return NextResponse.json({ invoice: saved, lastNumber })
}

export async function DELETE(request) {
  await connectDB()
  const url = new URL(request.url)
  const id = parseId(url.searchParams)
  if (!id) {
    return NextResponse.json({ error: "Geen id." }, { status: 400 })
  }
  await Invoice.deleteOne({ id })
  return NextResponse.json({ ok: true })
}
