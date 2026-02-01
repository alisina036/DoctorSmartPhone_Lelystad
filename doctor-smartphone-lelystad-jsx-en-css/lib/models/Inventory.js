import mongoose from 'mongoose'

// Legacy schemas - alleen voor oude data support
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['accessoire', 'onderdeel'], required: true },
  description: String,
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const SubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: String,
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Producten (accessoires en onderdelen) - NIEUW SCHEMA zonder categoryId
const InventoryProductSchema = new mongoose.Schema({
  // Basisinformatie
  name: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true }, // Unieke product code
  barcode: { type: String, unique: true, sparse: true, index: true }, // Unieke barcode
  
  // Categorisatie - eenvoudig type veld (NIEUW - vervangt categoryId/subCategoryId)
  categoryType: { type: String, enum: ['accessoire', 'onderdeel'], required: true },
  
  // Voor onderdelen: koppeling aan specifiek toestelmodel
  deviceModelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }, // Alleen voor onderdelen
  
  // Product details
  description: String,
  color: String,
  size: String,
  brand: String,
  
  // Prijzen
  purchasePrice: { type: Number, default: 0 }, // Inkoopprijs
  salePrice: { type: Number, required: true }, // Verkoopprijs
  
  // Voorraad
  stock: { type: Number, default: 0, required: true },
  minStock: { type: Number, default: 5 }, // Minimale voorraad voor waarschuwing
  maxStock: { type: Number, default: 100 },
  location: String, // Opslaglocatie in winkel
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  notes: String,
  images: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Voorraad mutaties (tracking)
const StockMutationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryProduct', required: true },
  type: { type: String, enum: ['inkoop', 'verkoop', 'correctie', 'retour'], required: true },
  quantity: { type: Number, required: true }, // Positief = toevoeging, negatief = vermindering
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: String,
  userId: String,
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }, // Als type=verkoop
  createdAt: { type: Date, default: Date.now }
})

// Verkopen (kassasysteem)
const SaleSchema = new mongoose.Schema({
  saleNumber: { type: String, unique: true, required: true }, // VK-20260131-001
  
  // Items
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryProduct', required: true },
    name: String,
    barcode: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  
  // Totalen
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  // Betaling
  paymentMethod: { type: String, enum: ['PIN', 'Cash', 'iDeal', 'Bankoverschrijving'], required: true },
  paymentStatus: { type: String, enum: ['betaald', 'openstaand', 'geannuleerd'], default: 'betaald' },
  
  // Klantinfo (optioneel)
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  
  // Metadata
  userId: String, // Medewerker die verkoop deed
  notes: String,
  createdAt: { type: Date, default: Date.now }
})

// Voorraad waarschuwingen
const StockAlertSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryProduct', required: true },
  alertType: { type: String, enum: ['low_stock', 'out_of_stock'], required: true },
  currentStock: { type: Number, required: true },
  minStock: { type: Number, required: true },
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
})

// Indexes voor snelle queries
CategorySchema.index({ type: 1, order: 1 })
SubCategorySchema.index({ categoryId: 1, order: 1 })
InventoryProductSchema.index({ categoryType: 1 })
InventoryProductSchema.index({ deviceModelId: 1 })
InventoryProductSchema.index({ stock: 1 })
StockMutationSchema.index({ productId: 1, createdAt: -1 })
SaleSchema.index({ saleNumber: 1 })
SaleSchema.index({ createdAt: -1 })
StockAlertSchema.index({ isResolved: 1, createdAt: -1 })

// Verwijder oude cached models om conflicten te voorkomen
if (mongoose.models.InventoryProduct) {
  delete mongoose.models.InventoryProduct
}

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema)
export const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', SubCategorySchema)
export const InventoryProduct = mongoose.models.InventoryProduct || mongoose.model('InventoryProduct', InventoryProductSchema)
export const StockMutation = mongoose.models.StockMutation || mongoose.model('StockMutation', StockMutationSchema)
export const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema)
export const StockAlert = mongoose.models.StockAlert || mongoose.model('StockAlert', StockAlertSchema)
