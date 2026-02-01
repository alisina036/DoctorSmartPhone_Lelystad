export const dynamic = "force-dynamic"

import { unstable_noStore as noStore } from "next/cache"
import connectDB from "@/lib/mongodb"
import { VitrineItem } from "@/lib/models/VitrineItem"
import VitrinePage from "@/components/vitrine/vitrine-page"

export const metadata = {
  title: "Vitrine",
}

export default async function Page() {
  noStore()

  let items = []
  try {
    await connectDB()
    items = await VitrineItem.find({
      $or: [
        { voorraadStatus: "beschikbaar" },
        { voorraadStatus: { $exists: false } },
        { voorraadStatus: "" },
      ],
    }).sort({ createdAt: -1 }).lean()
    items = items.map((item) => {
      const { imei, ...rest } = item || {}
      return rest
    })
    items = JSON.parse(JSON.stringify(items))
  } catch (e) {
    console.error("Database verbinding mislukt in /vitrine:", e)
    items = []
  }

  return <VitrinePage items={items} />
}
