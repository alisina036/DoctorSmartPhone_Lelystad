import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
)

const MODEL_NAME = "User"
if (process.env.NODE_ENV !== "production" && mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME]
}

export const User = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, UserSchema)
