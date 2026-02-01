import connectDB from '@/lib/mongodb'
import { RepairType } from '@/lib/models/RepairType'

const STANDARD_REPAIRS = [
  "Scherm vervangen",
  "Batterij vervangen",
  "Achterkant vervangen",
  "Oplaadpoort reparatie",
  "Camera voor",
  "Camera achter",
  "Waterschade behandeling",
  "Software herstel"
]

async function seedRepairTypes() {
  console.log('Seeding repair types...')
  await connectDB()
  
  for (const name of STANDARD_REPAIRS) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      await RepairType.updateOne(
        { id },
        { 
          $setOnInsert: {
            id,
            name,
            imageUrl: ''
          }
        },
        { upsert: true }
      )
      console.log(`Seeded: ${name}`)
    } catch (error) {
      console.error(`Error seeding ${name}:`, error)
    }
  }
  console.log('Done seeding repair types.')
  process.exit(0)
}

seedRepairTypes()
