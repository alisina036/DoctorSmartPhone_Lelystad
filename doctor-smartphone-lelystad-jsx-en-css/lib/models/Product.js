import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    stock_count: { type: Number, required: true, default: 0 },
    barcode: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

const MODEL_NAME = "Product"
if (process.env.NODE_ENV !== "production" && mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME]
}

export const Product = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, ProductSchema)
