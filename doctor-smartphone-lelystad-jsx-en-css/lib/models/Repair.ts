import mongoose, { Schema, Model } from 'mongoose'

export interface IRepair {
  id: string
  deviceId: string
  name: string
  price: number
  order?: number
  screenQualities?: Array<{
    name: string
    price: number
    enabled: boolean
  }>
}

const RepairSchema = new Schema<IRepair>({
  id: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  order: { type: Number, default: 0 },
  screenQualities: [
    new Schema(
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, default: 0 },
        enabled: { type: Boolean, required: true, default: false },
      },
      { _id: false }
    )
  ],
}, { timestamps: true })

export const Repair: Model<IRepair> = mongoose.models.Repair || mongoose.model<IRepair>('Repair', RepairSchema)
