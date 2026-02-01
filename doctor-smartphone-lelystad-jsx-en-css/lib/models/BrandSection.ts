import mongoose, { Schema, Model } from 'mongoose'

export interface IBrandSection {
  id: string
  name: string
  order?: number
}

const BrandSectionSchema = new Schema<IBrandSection>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const BrandSection: Model<IBrandSection> = mongoose.models.BrandSection || mongoose.model<IBrandSection>('BrandSection', BrandSectionSchema)
