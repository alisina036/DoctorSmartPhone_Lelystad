import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { VitrineItem } from "@/lib/models/VitrineItem"
import { cookies } from "next/headers"
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get("status") || "beschikbaar").toLowerCase()
    const includeImei = searchParams.get("includeImei") === "1"

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminSessionCookieName())?.value
    const isAdmin = verifyAdminSessionToken(sessionToken)

    const filter: any = {}
    if (status) {
      filter.$or = [
        { voorraadStatus: status },
        { voorraadStatus: { $exists: false } },
        { voorraadStatus: "" },
      ]
    }

    const items = await VitrineItem.find(filter).sort({ createdAt: -1 }).lean()

    const sanitized = items.map((item: any) => {
      const plain = { ...item }
      if (!includeImei || !isAdmin) {
        delete plain.imei
      }
      return plain
    })

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error("Error fetching vitrine items:", error)
    return NextResponse.json({ error: "Failed to fetch vitrine items" }, { status: 500 })
  }
}
