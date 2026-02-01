import mongoose, { Schema, Model } from 'mongoose'

export interface IRepairType {
  id: string
  name: string
  imageUrl?: string
  warrantyMonths?: number
  warrantyText?: string
  order?: number
}

const RepairTypeSchema = new Schema<IRepairType>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  warrantyMonths: { type: Number },
  warrantyText: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const RepairType: Model<IRepairType> = mongoose.models.RepairType || mongoose.model<IRepairType>('RepairType', RepairTypeSchema)
