import mongoose, { Schema, Model } from 'mongoose'

export interface IDevice {
  id: string
  name: string
  brandId: string
  type: 'phone' | 'tablet' | 'laptop'
  imageUrl?: string
  order?: number
  typeOrder?: number
}

const DeviceSchema = new Schema<IDevice>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brandId: { type: String, required: true },
  type: { type: String, enum: ['phone', 'tablet', 'laptop'], required: true },
  imageUrl: { type: String },
  order: { type: Number, default: 0 },
  typeOrder: { type: Number, default: 0 },
}, { timestamps: true })

export const Device: Model<IDevice> = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema)
