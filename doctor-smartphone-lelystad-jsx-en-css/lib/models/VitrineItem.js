import mongoose from "mongoose"

const VitrineItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    merk: { type: String, required: true },
    model: { type: String, required: true },
    opslag: { type: String, default: "", trim: true },
    prijs: { type: Number, required: true },
    kleur: { type: String, required: true },
    batterijConditie: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, required: true, enum: ["Nieuw Sealed", "Nieuw Open", "Tweedehands"] },
    imei: { type: String, trim: true },
    voorraadStatus: { type: String, default: "beschikbaar", enum: ["beschikbaar", "verkocht"] },
    fotos: { type: [String], default: [] },
    beschrijving: { type: String, default: "" },
  },
  { timestamps: true }
)

const MODEL_NAME = "VitrineItem"
if (process.env.NODE_ENV !== "production" && mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME]
}

export const VitrineItem = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, VitrineItemSchema)
