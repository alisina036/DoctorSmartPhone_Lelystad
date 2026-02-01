import mongoose, { Schema, Model } from 'mongoose'

export interface IBrand {
  id: string
  name: string
  imageUrl?: string
  order?: number
  sectionId?: string
}

const BrandSchema = new Schema<IBrand>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  imageUrl: { type: String },
  order: { type: Number, default: 0 },
  sectionId: { type: String },
}, { timestamps: true })

export const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema)
