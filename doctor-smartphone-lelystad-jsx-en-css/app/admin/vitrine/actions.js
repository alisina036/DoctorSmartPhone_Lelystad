"use server"

import connectDB from "@/lib/mongodb"
import { VitrineItem } from "@/lib/models/VitrineItem"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session"
import { unlink } from "fs/promises"
import path from "path"
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary"

const VITRINE_IMAGE_BASE = "/images/vitrine/"
const normalizeFoto = (value) => {
  const v = String(value ?? "").trim()
  if (!v) return ""
  if (v.startsWith("http://") || v.startsWith("https://")) return v
  if (v.startsWith("/")) return v
  return `${VITRINE_IMAGE_BASE}${v}`
}

export async function createVitrineItem(item) {
  await connectDB()

  if (process.env.NODE_ENV !== "production") {
    try {
      const keys = item && typeof item === "object" ? Object.keys(item) : []
      console.log("[vitrine] create keys:", keys)
      console.log("[vitrine] create opslag:", item?.opslag, "alt storage:", item?.storage)
    } catch (e) {
      // ignore
    }
  }

  const opslagValue = String((item?.opslag ?? item?.storage ?? "") ?? "").trim()

  const cleanedImei = String(item?.imei ?? "").trim()

  const payload = {
    id: String(item?.id ?? `vit-${Date.now()}`),
    type: String(item?.type ?? ""),
    merk: String(item?.merk ?? ""),
    model: String(item?.model ?? ""),
    opslag: opslagValue,
    prijs: Number(item?.prijs ?? 0),
    kleur: String(item?.kleur ?? ""),
    batterijConditie: Math.max(0, Math.min(100, Number(item?.batterijConditie ?? 0))),
    status: String(item?.status ?? ""),
    imei: cleanedImei || undefined,
    voorraadStatus: String(item?.voorraadStatus ?? "beschikbaar") || "beschikbaar",
    fotos: Array.isArray(item?.fotos) ? item.fotos.map(normalizeFoto).filter(Boolean) : [],
    beschrijving: String(item?.beschrijving ?? ""),
  }

  const created = await VitrineItem.create(payload)
  revalidatePath("/vitrine")
  revalidatePath("/admin/vitrine")
  return JSON.parse(JSON.stringify(created))
}

export async function listVitrineItems() {
  await connectDB()
  const items = await VitrineItem.find().sort({ createdAt: -1 }).lean()
  return JSON.parse(JSON.stringify(items))
}

export async function deleteVitrineItem(id) {
  await connectDB()
  const doc = await VitrineItem.findOne({ id: String(id) }).lean()
  await VitrineItem.deleteOne({ id: String(id) })

  // Also remove photo files from public/images/vitrine when they are not referenced by other items.
  const fotos = Array.isArray(doc?.fotos) ? doc.fotos : []
  for (const foto of fotos) {
    const publicPath = String(foto || "").trim()
    if (!publicPath) continue

    const stillUsed = await VitrineItem.exists({ id: { $ne: String(id) }, fotos: publicPath })
    if (stillUsed) continue

    if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
      try {
        await deleteCloudinaryImageByUrl(publicPath)
      } catch (e) {
        // Ignore cloudinary delete errors
      }
      continue
    }

    if (publicPath.startsWith("/images/vitrine/")) {
      const filename = path.basename(publicPath)
      const filePath = path.join(process.cwd(), "public", "images", "vitrine", filename)
      try {
        await unlink(filePath)
      } catch (e) {
        // Ignore if missing or cannot delete
      }
    }
  }

  revalidatePath("/vitrine")
  revalidatePath("/admin/vitrine")
  return { ok: true }
}

export async function updateVitrineItem(item) {
  await connectDB()

  if (process.env.NODE_ENV !== "production") {
    try {
      const keys = item && typeof item === "object" ? Object.keys(item) : []
      console.log("[vitrine] update keys:", keys)
      console.log("[vitrine] update opslag:", item?.opslag, "alt storage:", item?.storage)
    } catch (e) {
      // ignore
    }
  }

  const id = String(item?.id ?? "").trim()
  if (!id) {
    throw new Error("Ongeldige vitrine item id")
  }

  const opslagValue = String((item?.opslag ?? item?.storage ?? "") ?? "").trim()

  const cleanedImei = String(item?.imei ?? "").trim()

  const payload = {
    type: String(item?.type ?? ""),
    merk: String(item?.merk ?? ""),
    model: String(item?.model ?? ""),
    opslag: opslagValue,
    prijs: Number(item?.prijs ?? 0),
    kleur: String(item?.kleur ?? ""),
    batterijConditie: Math.max(0, Math.min(100, Number(item?.batterijConditie ?? 0))),
    status: String(item?.status ?? ""),
    imei: cleanedImei || undefined,
    voorraadStatus: String(item?.voorraadStatus ?? "beschikbaar") || "beschikbaar",
    fotos: Array.isArray(item?.fotos) ? item.fotos.map(normalizeFoto).filter(Boolean) : [],
    beschrijving: String(item?.beschrijving ?? ""),
  }

  const updated = await VitrineItem.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true }
  ).lean()

  if (!updated) {
    throw new Error("Vitrine item niet gevonden")
  }

  revalidatePath("/vitrine")
  revalidatePath("/admin/vitrine")
  return JSON.parse(JSON.stringify(updated))
}

export async function updateVitrineStatusByImei(imei, voorraadStatus = "verkocht") {
  await connectDB()

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminSessionCookieName())?.value
  if (!verifyAdminSessionToken(sessionToken)) {
    throw new Error("Niet geautoriseerd")
  }

  const cleaned = String(imei || "").trim()
  if (!cleaned) {
    throw new Error("IMEI ontbreekt")
  }

  const digitsOnly = cleaned.replace(/\D+/g, "")
  const regex = digitsOnly
    ? new RegExp(digitsOnly.split("").map((d) => `${d}\\D*`).join(""), "i")
    : null

  const nextStatus = String(voorraadStatus || "verkocht")

  const or = [{ imei: cleaned }]
  if (digitsOnly && digitsOnly !== cleaned) or.push({ imei: digitsOnly })
  if (regex) or.push({ imei: { $regex: regex } })
  const imeiFilter = { $or: or }

  const updated = await VitrineItem.findOneAndUpdate(
    imeiFilter,
    { $set: { voorraadStatus: nextStatus } },
    { new: true }
  ).lean()

  if (!updated) {
    throw new Error("Toestel met dit IMEI niet gevonden")
  }

  revalidatePath("/vitrine")
  revalidatePath("/admin/vitrine")
  return JSON.parse(JSON.stringify(updated))
}
