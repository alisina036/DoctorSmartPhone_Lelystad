import mongoose from "mongoose"

const InvoiceLineSchema = new mongoose.Schema(
  {
    description: { type: String, default: "", trim: true },
    details: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
)

const InvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    number: { type: Number, required: true, index: true },
    invoiceDate: { type: Date, required: true },
    type: { type: String, default: "reparatie" },
    vatMode: { type: String, default: "btw21" },
    paymentMethod: { type: String, default: "PIN" },
    paymentStatus: { type: String, default: "Betaald" },
    customerName: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    customerPostalCode: { type: String, default: "" },
    customerCity: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    imeiList: { type: [String], default: [""] },
    iban: { type: String, default: "" },
    lines: { type: [InvoiceLineSchema], default: [] },
  },
  { timestamps: true }
)

export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)
