export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { uploadImageBuffer } from "@/lib/cloudinary"
import path from "path"

function safeBaseName(name) {
  const base = path.basename(String(name || "upload"))
  return base.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function isAllowedImageType(mime) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(mime)
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, error: "Geen bestand ontvangen" }, { status: 400 })
    }

    if (!isAllowedImageType(file.type)) {
      return NextResponse.json({ ok: false, error: `Bestandstype niet toegestaan: ${file.type}` }, { status: 400 })
    }

    if (typeof file.size === "number" && file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Bestand is te groot (max 8MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResult = await uploadImageBuffer(buffer, {
      folder: "hero-carousel",
      public_id: `${safeBaseName(file.name).replace(/\.[^/.]+$/, "")}-${Date.now()}`,
      resource_type: "image",
    })

    return NextResponse.json({ ok: true, publicPath: uploadResult?.secure_url })
  } catch (e) {
    console.error("Upload failed:", e)
    return NextResponse.json({ ok: false, error: "Upload mislukt" }, { status: 500 })
  }
}
