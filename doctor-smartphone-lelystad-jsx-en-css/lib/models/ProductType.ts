import mongoose, { Schema, Model } from 'mongoose'

export interface IProductType {
	id: string
	name: string
	hideInWizard?: boolean
}

const ProductTypeSchema = new Schema<IProductType>({
	id: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	hideInWizard: { type: Boolean, default: false },
}, { timestamps: true })

export const ProductType: Model<IProductType> = mongoose.models.ProductType || mongoose.model<IProductType>('ProductType', ProductTypeSchema)
