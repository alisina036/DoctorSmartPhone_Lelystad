import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import connectDB from "@/lib/mongodb"
import { HeroCarousel } from "@/lib/models/HeroCarousel"
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary"

// GET - Haal alle carousel items op
export async function GET() {
  try {
    await connectDB()
    const items = await HeroCarousel.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching hero carousel items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

// POST - Voeg nieuw carousel item toe
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    
    const newItem = await HeroCarousel.create({
      imageUrl: body.imageUrl,
      title: body.title || "",
      order: body.order || 0,
      isActive: body.isActive !== false,
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("Error creating hero carousel item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}

// PUT - Update carousel item
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { _id, ...updates } = body

    const updated = await HeroCarousel.findByIdAndUpdate(
      _id,
      updates,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating hero carousel item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

// DELETE - Verwijder carousel item
export async function DELETE(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const deleted = await HeroCarousel.findByIdAndDelete(id)

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const imageUrl = String(deleted?.imageUrl || "").trim()
    if (imageUrl) {
      const stillUsed = await HeroCarousel.exists({ _id: { $ne: deleted._id }, imageUrl })
      if (!stillUsed) {
        try {
          await deleteCloudinaryImageByUrl(imageUrl)
        } catch (e) {
          // Ignore cloudinary delete errors
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hero carousel item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
