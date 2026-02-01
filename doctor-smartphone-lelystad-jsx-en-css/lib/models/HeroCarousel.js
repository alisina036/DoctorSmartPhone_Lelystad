import mongoose from "mongoose"

const HeroCarouselSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    title: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const HeroCarousel = mongoose.models.HeroCarousel || mongoose.model("HeroCarousel", HeroCarouselSchema)
