// Vitrine data (JS only) — later makkelijk te koppelen aan database.

export const vitrineTypes = ["Telefoon", "iPad/Tablet", "Laptop", "Smartwatch", "Accessoire"]

export const vitrineMerken = [
  "Apple",
  "Samsung",
  "Google",
  "OnePlus",
  "Xiaomi",
  "Oppo",
  "Huawei",
  "Nokia",
  "Motorola",
]

export const vitrineOpslag = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]

export const vitrineKleuren = [
  "Zwart",
  "Wit",
  "Blauw",
  "Rood",
  "Groen",
  "Paars",
  "Goud",
  "Zilver",
  "Grijs",
]

export const vitrineStatussen = ["Nieuw Sealed", "Nieuw Open", "Tweedehands"]
export const vitrineVoorraadStatussen = ["beschikbaar", "verkocht"]

const VITRINE_IMAGE_BASE = "/images/vitrine/"

function normalizeVitrineFotoPath(value) {
  const v = String(value ?? "").trim()
  if (!v) return ""

  // External URL (e.g. Cloudinary)
  if (v.startsWith("http://") || v.startsWith("https://")) return v

  // Already a public path
  if (v.startsWith("/")) return v

  // Treat as filename inside public/images/vitrine/
  return `${VITRINE_IMAGE_BASE}${v}`
}

// Start leeg: items worden toegevoegd via het admin panel (/admin/vitrine) of later via database.
export const initialInventory = []

export function formatVitrineItem(input, options = {}) {
  const { generateId = true } = options

  const fotosRaw = Array.isArray(input?.fotos)
    ? input.fotos
    : String(input?.fotos ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)

  const fotosNormalized = fotosRaw.map(normalizeVitrineFotoPath).filter(Boolean)
  const fotos = fotosNormalized.length ? fotosNormalized : ["/placeholder.jpg"]

  const id = input?.id
    ? String(input.id)
    : generateId
      ? `vit-${Date.now()}`
      : undefined

  const imeiValue = String(input?.imei ?? "").trim()

  return {
    id,
    type: String(input?.type ?? ""),
    merk: String(input?.merk ?? ""),
    model: String(input?.model ?? ""),
    opslag: String(input?.opslag ?? "").trim(),
    prijs: Number(input?.prijs ?? 0),
    kleur: String(input?.kleur ?? ""),
    batterijConditie: Math.max(0, Math.min(100, Number(input?.batterijConditie ?? 0))),
    status: String(input?.status ?? ""),
    imei: imeiValue || undefined,
    voorraadStatus: String(input?.voorraadStatus ?? "beschikbaar") || "beschikbaar",
    fotos,
    beschrijving: String(input?.beschrijving ?? ""),
  }
}
