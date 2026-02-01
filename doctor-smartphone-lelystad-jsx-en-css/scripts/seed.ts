import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI niet gevonden in .env.local')
  process.exit(1)
}

// Simple inline schemas for seeding
const BrandSchema = new mongoose.Schema({
  id: String,
  name: String,
  imageUrl: String,
})

const DeviceSchema = new mongoose.Schema({
  id: String,
  name: String,
  brandId: String,
  type: String,
  imageUrl: String,
})

const RepairSchema = new mongoose.Schema({
  id: String,
  deviceId: String,
  name: String,
  price: Number,
})

const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema)
const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema)
const Repair = mongoose.models.Repair || mongoose.model('Repair', RepairSchema)

const brands = [
  { id: 'apple', name: 'Apple', imageUrl: '/placeholder.svg' },
  { id: 'samsung', name: 'Samsung', imageUrl: '/placeholder.svg' },
  { id: 'huawei', name: 'Huawei', imageUrl: '/placeholder.svg' },
  { id: 'xiaomi', name: 'Xiaomi', imageUrl: '/placeholder.svg' },
  { id: 'oneplus', name: 'OnePlus', imageUrl: '/placeholder.svg' },
  { id: 'google', name: 'Google', imageUrl: '/placeholder.svg' },
  { id: 'motorola', name: 'Motorola', imageUrl: '/placeholder.svg' },
  { id: 'sony', name: 'Sony', imageUrl: '/placeholder.svg' },
  { id: 'nokia', name: 'Nokia', imageUrl: '/placeholder.svg' },
  { id: 'lenovo', name: 'Lenovo', imageUrl: '/placeholder.svg' },
  { id: 'hp', name: 'HP', imageUrl: '/placeholder.svg' },
  { id: 'dell', name: 'Dell', imageUrl: '/placeholder.svg' },
  { id: 'asus', name: 'ASUS', imageUrl: '/placeholder.svg' },
]

const devices = [
  // Apple
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', brandId: 'apple', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', brandId: 'apple', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'iphone-15', name: 'iPhone 15', brandId: 'apple', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'iphone-14', name: 'iPhone 14', brandId: 'apple', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'iphone-13', name: 'iPhone 13', brandId: 'apple', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', brandId: 'apple', type: 'tablet', imageUrl: '/placeholder.svg' },
  { id: 'ipad-air', name: 'iPad Air', brandId: 'apple', type: 'tablet', imageUrl: '/placeholder.svg' },
  { id: 'macbook-air-m2', name: 'MacBook Air (M2)', brandId: 'apple', type: 'laptop', imageUrl: '/placeholder.svg' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', brandId: 'apple', type: 'laptop', imageUrl: '/placeholder.svg' },
  // Samsung
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', brandId: 'samsung', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'galaxy-s23', name: 'Galaxy S23', brandId: 'samsung', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'galaxy-a54', name: 'Galaxy A54', brandId: 'samsung', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'galaxy-tab-s9', name: 'Galaxy Tab S9', brandId: 'samsung', type: 'tablet', imageUrl: '/placeholder.svg' },
  { id: 'galaxy-book3', name: 'Galaxy Book3', brandId: 'samsung', type: 'laptop', imageUrl: '/placeholder.svg' },
  // Google
  { id: 'pixel-8-pro', name: 'Pixel 8 Pro', brandId: 'google', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'pixel-8', name: 'Pixel 8', brandId: 'google', type: 'phone', imageUrl: '/placeholder.svg' },
  // Xiaomi
  { id: 'xiaomi-13', name: 'Xiaomi 13', brandId: 'xiaomi', type: 'phone', imageUrl: '/placeholder.svg' },
  { id: 'redmi-note-12', name: 'Redmi Note 12', brandId: 'xiaomi', type: 'phone', imageUrl: '/placeholder.svg' },
  // OnePlus
  { id: 'oneplus-11', name: 'OnePlus 11', brandId: 'oneplus', type: 'phone', imageUrl: '/placeholder.svg' },
  // Laptops
  { id: 'dell-xps-13', name: 'XPS 13', brandId: 'dell', type: 'laptop', imageUrl: '/placeholder.svg' },
  { id: 'hp-spectre-x360', name: 'Spectre x360', brandId: 'hp', type: 'laptop', imageUrl: '/placeholder.svg' },
  { id: 'lenovo-thinkpad-x1', name: 'ThinkPad X1', brandId: 'lenovo', type: 'laptop', imageUrl: '/placeholder.svg' },
]

const repairs = [
  // iPhone 15 Pro Max
  { id: 'r-iph15pm-screen', deviceId: 'iphone-15-pro-max', name: 'Scherm vervangen', price: 299 },
  { id: 'r-iph15pm-battery', deviceId: 'iphone-15-pro-max', name: 'Batterij vervangen', price: 109 },
  { id: 'r-iph15pm-camera', deviceId: 'iphone-15-pro-max', name: 'Camera vervangen', price: 149 },
  { id: 'r-iph15pm-port', deviceId: 'iphone-15-pro-max', name: 'Oplaadpoort vervangen', price: 89 },
  // iPhone 15 Pro
  { id: 'r-iph15p-screen', deviceId: 'iphone-15-pro', name: 'Scherm vervangen', price: 279 },
  { id: 'r-iph15p-battery', deviceId: 'iphone-15-pro', name: 'Batterij vervangen', price: 99 },
  // iPhone 15
  { id: 'r-iph15-screen', deviceId: 'iphone-15', name: 'Scherm vervangen', price: 249 },
  { id: 'r-iph15-battery', deviceId: 'iphone-15', name: 'Batterij vervangen', price: 99 },
  { id: 'r-iph15-camera', deviceId: 'iphone-15', name: 'Camera vervangen', price: 129 },
  // iPhone 14
  { id: 'r-iph14-screen', deviceId: 'iphone-14', name: 'Scherm vervangen', price: 219 },
  { id: 'r-iph14-battery', deviceId: 'iphone-14', name: 'Batterij vervangen', price: 89 },
  // iPad
  { id: 'r-ipadpro11-screen', deviceId: 'ipad-pro-11', name: 'Scherm vervangen', price: 299 },
  { id: 'r-ipadpro11-battery', deviceId: 'ipad-pro-11', name: 'Batterij vervangen', price: 149 },
  // MacBook
  { id: 'r-macairm2-screen', deviceId: 'macbook-air-m2', name: 'Scherm vervangen', price: 399 },
  { id: 'r-macairm2-keyboard', deviceId: 'macbook-air-m2', name: 'Toetsenbord vervangen', price: 249 },
  { id: 'r-macairm2-battery', deviceId: 'macbook-air-m2', name: 'Batterij vervangen', price: 199 },
  // Samsung
  { id: 'r-s24u-screen', deviceId: 'galaxy-s24-ultra', name: 'Scherm vervangen', price: 279 },
  { id: 'r-s24u-battery', deviceId: 'galaxy-s24-ultra', name: 'Batterij vervangen', price: 99 },
  { id: 'r-s23-screen', deviceId: 'galaxy-s23', name: 'Scherm vervangen', price: 229 },
  { id: 'r-s23-battery', deviceId: 'galaxy-s23', name: 'Batterij vervangen', price: 89 },
  // Google Pixel
  { id: 'r-pix8p-screen', deviceId: 'pixel-8-pro', name: 'Scherm vervangen', price: 259 },
  { id: 'r-pix8-screen', deviceId: 'pixel-8', name: 'Scherm vervangen', price: 239 },
  { id: 'r-pix8-battery', deviceId: 'pixel-8', name: 'Batterij vervangen', price: 89 },
  // Laptops
  { id: 'r-xps13-screen', deviceId: 'dell-xps-13', name: 'Scherm vervangen', price: 329 },
  { id: 'r-xps13-battery', deviceId: 'dell-xps-13', name: 'Batterij vervangen', price: 139 },
  { id: 'r-spectre-screen', deviceId: 'hp-spectre-x360', name: 'Scherm vervangen', price: 349 },
  { id: 'r-thinkpadx1-battery', deviceId: 'lenovo-thinkpad-x1', name: 'Batterij vervangen', price: 149 },
]

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Verbonden met MongoDB')

    // Clear existing data
    await Brand.deleteMany({})
    await Device.deleteMany({})
    await Repair.deleteMany({})
    console.log('🗑️  Oude data verwijderd')

    // Insert new data
    await Brand.insertMany(brands)
    console.log(`✅ ${brands.length} merken toegevoegd`)

    await Device.insertMany(devices)
    console.log(`✅ ${devices.length} toestellen toegevoegd`)

    await Repair.insertMany(repairs)
    console.log(`✅ ${repairs.length} reparaties toegevoegd`)

    console.log('🎉 Database succesvol gevuld!')
  } catch (error) {
    console.error('❌ Fout bij seeding:', error)
  } finally {
    await mongoose.connection.close()
    console.log('👋 Verbinding gesloten')
  }
}

seed()
