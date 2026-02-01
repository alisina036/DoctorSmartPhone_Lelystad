'use server'

import connectDB from '@/lib/mongodb'
import { Brand } from '@/lib/models/Brand'
import { BrandSection } from '@/lib/models/BrandSection'
import { Device } from '@/lib/models/Device'
import { Repair } from '@/lib/models/Repair'
import { RepairType } from '@/lib/models/RepairType'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper: treat both legacy and new labels as the screen repair
const isScreenRepairName = (name: string) => name === 'Beeldscherm en glas' || name === 'Scherm vervangen'

// We will now fetch standard repairs from the database
async function getStandardRepairs() {
  await connectDB()
  const types = await RepairType.find().sort({ name: 1 }).lean()
  return types.map(t => t.name)
}

export async function addBrand(formData: FormData) {
  await connectDB()
  
  const name = formData.get('name') as string
  const imageUrl = formData.get('imageUrl') as string
  const sectionId = formData.get('sectionId') as string
  
  if (!name) return
  
  // Generate ID from name (slugify)
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  try {
    await Brand.create({
      id,
      name,
      imageUrl,
      sectionId: sectionId || undefined
    })
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error adding brand:', error)
  }
}

export async function deleteBrand(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  if (!id) return
  
  try {
    await Brand.deleteOne({ id })
    // Also delete associated devices and repairs? 
    // For safety, maybe just delete the brand for now.
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error deleting brand:', error)
  }
}

export async function updateBrand(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const imageUrl = formData.get('imageUrl') as string
  const sectionId = formData.get('sectionId') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=merken'
  if (!id) return
  try {
    const update: any = {}
    if (typeof name === 'string' && name.trim()) update.name = name.trim()
    // Only update imageUrl if the form actually provided it (e.g., in edit modal).
    // Inline section assignment form doesn't include imageUrl, so we preserve existing.
    if (typeof (formData as any).has === 'function' ? formData.has('imageUrl') : imageUrl !== undefined) {
      update.imageUrl = imageUrl ?? ''
    }
    if (sectionId !== undefined) update.sectionId = sectionId || undefined
    if (Object.keys(update).length) await Brand.updateOne({ id }, update)
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (error) {
    console.error('Error updating brand:', error)
  }
}

// Brand Section CRUD
export async function addBrandSection(formData: FormData) {
  await connectDB()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  try {
    await BrandSection.create({ id, name, order: 0 })
    revalidatePath('/admin')
  } catch (e) { console.error('Error adding brand section:', e) }
}

export async function updateBrandSection(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=merken'
  if (!id || !name) return
  try {
    await BrandSection.updateOne({ id }, { name })
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) { console.error('Error updating brand section:', e) }
}

export async function deleteBrandSection(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=merken'
  if (!id) return
  try {
    await BrandSection.deleteOne({ id })
    // Unset sectionId on brands in this section
    await Brand.updateMany({ sectionId: id }, { $unset: { sectionId: 1 } })
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) { console.error('Error deleting brand section:', e) }
}

export async function addDevice(formData: FormData) {
  await connectDB()
  
  const name = formData.get('name') as string
  const brandId = formData.get('brandId') as string
  const type = formData.get('type') as string
  const imageUrl = formData.get('imageUrl') as string
  
  if (!name || !brandId || !type) return
  
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  try {
    const lastBrand = await Device.find({ brandId }).sort({ order: -1 }).limit(1).lean()
    const lastType = await Device.find({ type }).sort({ typeOrder: -1 }).limit(1).lean()
    const nextBrandOrder = (lastBrand?.[0]?.order ?? -1) + 1
    const nextTypeOrder = (lastType?.[0]?.typeOrder ?? -1) + 1
    // Create Device
    await Device.create({
      id,
      name,
      brandId,
      type,
      imageUrl,
      order: nextBrandOrder,
      typeOrder: nextTypeOrder
    })
    
    // Create Standard Repairs for this device
    const standardRepairs = await getStandardRepairs()
    const repairPromises = standardRepairs.map(repairName => {
      const repairId = `${id}-${repairName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      const base: any = {
        id: repairId,
        deviceId: id,
        name: repairName,
        price: 0
      }
      if (isScreenRepairName(repairName)) {
        base.screenQualities = [
          { name: 'Origineel', price: 0, enabled: true }
        ]
      }
      return Repair.create(base)
    })
    
    await Promise.all(repairPromises)
    
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error adding device:', error)
  }
}

export async function ensureStandardRepairs(deviceId: string) {
  await connectDB()
  
  try {
    const existingRepairs = await Repair.find({ deviceId }).lean()
    const existingNames = new Set(existingRepairs.map(r => r.name))
    
    const standardRepairs = await getStandardRepairs()
    const missingRepairs = standardRepairs.filter(name => !existingNames.has(name))
    
    if (missingRepairs.length === 0) return

    const repairPromises = missingRepairs.map(repairName => {
      const repairId = `${deviceId}-${repairName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      const base: any = {
        id: repairId,
        deviceId,
        name: repairName,
        price: 0
      }
      if (isScreenRepairName(repairName)) {
        base.screenQualities = [
          { name: 'Origineel', price: 0, enabled: true }
        ]
      }
      return Repair.create(base)
    })
    
    await Promise.all(repairPromises)
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error ensuring standard repairs:', error)
  }
}

export async function deleteDevice(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  if (!id) return
  
  try {
    await Device.deleteOne({ id })
    await Repair.deleteMany({ deviceId: id })
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error deleting device:', error)
  }
}

export async function updateDevice(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const imageUrl = formData.get('imageUrl') as string
  const type = formData.get('type') as string
  const brandId = formData.get('brandId') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=toestellen'
  if (!id) return
  try {
    const current = await Device.findOne({ id }).lean()
    if (!current) return
    const update: any = {}
    if (typeof name === 'string' && name.trim()) update.name = name.trim()
    if (imageUrl !== undefined) update.imageUrl = imageUrl
    if (type) update.type = type
    if (brandId) update.brandId = brandId
    if (brandId && current.brandId !== brandId) {
      const lastBrand = await Device.find({ brandId }).sort({ order: -1 }).limit(1).lean()
      update.order = (lastBrand?.[0]?.order ?? -1) + 1
    }
    if (type && current.type !== type) {
      const lastType = await Device.find({ type }).sort({ typeOrder: -1 }).limit(1).lean()
      update.typeOrder = (lastType?.[0]?.typeOrder ?? -1) + 1
    }
    if (Object.keys(update).length) await Device.updateOne({ id }, update)
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (error) {
    console.error('Error updating device:', error)
  }
}

export async function addRepair(formData: FormData) {
  await connectDB()
  
  const name = formData.get('name') as string
  const deviceId = formData.get('deviceId') as string
  const price = parseFloat(formData.get('price') as string) || 0
  
  if (!name || !deviceId) return
  
  const id = `${deviceId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  
  try {
    await Repair.create({
      id,
      deviceId,
      name,
      price
    })
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error adding repair:', error)
  }
}

export async function updateRepairPrice(formData: FormData) {
  await connectDB()
  
  const id = formData.get('id') as string
  const price = parseFloat(formData.get('price') as string)
  const redirectTo = formData.get('redirectTo') as string
  
  if (!id || isNaN(price)) return
  
  try {
    const repair = await Repair.findOne({ id })
    if (!repair) return
    // Always update top-level price (used as default/fallback)
    repair.price = price
    // If it's the screen repair, sync Origineel price as convenience
    if (isScreenRepairName(repair.name)) {
      const list = repair.screenQualities || []
      const idx = list.findIndex((q: any) => q.name === 'Origineel')
      if (idx >= 0) {
        list[idx].price = price
      } else {
        list.push({ name: 'Origineel', price, enabled: true })
      }
      repair.screenQualities = list
    }
    await repair.save()
    revalidatePath('/admin')
    if (redirectTo) {
      redirect(redirectTo)
    }
  } catch (error) {
    console.error('Error updating repair:', error)
  }
}

// Screen qualities management for the specific repair "Beeldscherm en glas"
export async function addScreenQuality(formData: FormData) {
  await connectDB()
  const repairId = formData.get('repairId') as string
  const name = (formData.get('name') as string)?.trim()
  const price = parseFloat((formData.get('price') as string) || '0')
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'
  if (!repairId || !name) return
  try {
    const repair: any = await Repair.findOne({ id: repairId })
    if (!repair) return
    if (!isScreenRepairName(repair.name)) return
    const list: any[] = repair.screenQualities || []
    if (list.some(q => q.name.toLowerCase() === name.toLowerCase())) {
      // if exists, just update price
      list.forEach(q => { if (q.name.toLowerCase() === name.toLowerCase()) q.price = price })
    } else {
      list.push({ name, price, enabled: false })
    }
    repair.screenQualities = list
    await repair.save()
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) {
    console.error('Error adding screen quality:', e)
  }
}

export async function toggleScreenQuality(formData: FormData) {
  await connectDB()
  const repairId = formData.get('repairId') as string
  const name = (formData.get('name') as string)?.trim()
  const enabled = (formData.get('enabled') as string) === 'true'
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'
  if (!repairId || !name) return
  try {
    const repair: any = await Repair.findOne({ id: repairId })
    if (!repair) return
    if (!isScreenRepairName(repair.name)) return
    const list: any[] = repair.screenQualities || []
    list.forEach(q => { if (q.name === name) q.enabled = enabled })
    repair.screenQualities = list
    await repair.save()
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) {
    console.error('Error toggling screen quality:', e)
  }
}

export async function updateScreenQualityPrice(formData: FormData) {
  await connectDB()
  const repairId = formData.get('repairId') as string
  const name = (formData.get('name') as string)?.trim()
  const price = parseFloat((formData.get('price') as string) || '0')
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'
  if (!repairId || !name) return
  try {
    const repair: any = await Repair.findOne({ id: repairId })
    if (!repair) return
    if (!isScreenRepairName(repair.name)) return
    const list: any[] = repair.screenQualities || []
    list.forEach(q => { if (q.name === name) q.price = price })
    repair.screenQualities = list
    // Also sync top-level price if Origineel is updated
    if (name === 'Origineel') {
      repair.price = price
    }
    await repair.save()
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) {
    console.error('Error updating screen quality price:', e)
  }
}

export async function deleteScreenQuality(formData: FormData) {
  await connectDB()
  const repairId = formData.get('repairId') as string
  const name = (formData.get('name') as string)?.trim()
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'
  if (!repairId || !name) return
  if (name === 'Origineel') {
    // Cannot delete Origineel
    if (redirectTo) redirect(redirectTo)
    return
  }
  try {
    const repair: any = await Repair.findOne({ id: repairId })
    if (!repair) return
    if (!isScreenRepairName(repair.name)) return
    const list: any[] = (repair.screenQualities || []).filter(q => q.name !== name)
    repair.screenQualities = list
    await repair.save()
    revalidatePath('/admin')
    redirect(redirectTo)
  } catch (e) {
    console.error('Error deleting screen quality:', e)
  }
}

export async function deleteRepair(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  if (!id) return
  
  try {
    await Repair.deleteOne({ id })
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error deleting repair:', error)
  }
}

// Repair Type Actions

export async function addRepairType(formData: FormData) {
  await connectDB()
  
  const name = formData.get('name') as string
  const imageUrl = formData.get('imageUrl') as string
  const warrantyMonthsRaw = formData.get('warrantyMonths') as string
  const warrantyText = formData.get('warrantyText') as string
  const warrantyMonths = warrantyMonthsRaw ? Number(warrantyMonthsRaw) : undefined
  
  if (!name) return
  
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  try {
    // Create the type
    await RepairType.create({
      id,
      name,
      imageUrl,
      warrantyMonths: Number.isFinite(warrantyMonths) ? warrantyMonths : undefined,
      warrantyText,
    })
    
    // Add this repair to ALL existing devices
    const devices = await Device.find().lean()
    const repairPromises = devices.map(device => {
      const repairId = `${device.id}-${id}`
      // Check if exists first? Or just try create (will fail if duplicate id)
      // Better to use updateOne with upsert or just create and catch error
      return Repair.updateOne(
        { id: repairId },
        { 
          $setOnInsert: {
            id: repairId,
            deviceId: device.id,
            name: name,
            price: 0,
            screenQualities: isScreenRepairName(name) ? [{ name: 'Origineel', price: 0, enabled: true }] : undefined
          }
        },
        { upsert: true }
      )
    })
    
    await Promise.all(repairPromises)
    
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error adding repair type:', error)
  }
}

// Ensure every existing device has all repair types as device repairs
export async function syncRepairsToAllDevices(formData?: FormData) {
  await connectDB()

  const redirectTo = (formData?.get?.('redirectTo') as string) || '/admin?tab=reparaties'

  try {
    const [devices, types] = await Promise.all([
      Device.find().lean(),
      RepairType.find().lean(),
    ])

    const typeNamesById: Record<string, string> = {}
    types.forEach(t => { typeNamesById[t.id] = t.name })

    for (const device of devices) {
      const existing = await Repair.find({ deviceId: device.id }).select('name').lean()
      const existingNames = new Set(existing.map(r => r.name))

      const toCreate = types.filter(t => !existingNames.has(t.name))
      if (!toCreate.length) continue

      const ops = toCreate.map(t => {
        const repairId = `${device.id}-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        const base: any = {
          id: repairId,
          deviceId: device.id,
          name: t.name,
          price: 0,
        }
        if (isScreenRepairName(t.name)) {
          base.screenQualities = [{ name: 'Origineel', price: 0, enabled: true }]
        }
        if (typeof t.order === 'number') {
          base.order = t.order
        }
        return base
      })

      if (ops.length) await Repair.insertMany(ops)
    }

    revalidatePath('/admin')
    if (redirectTo) redirect(redirectTo)
  } catch (error) {
    console.error('Error syncing repairs to all devices:', error)
  }
}

export async function updateRepairType(formData: FormData) {
  await connectDB()
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const imageUrl = formData.get('imageUrl') as string
  const warrantyMonthsRaw = formData.get('warrantyMonths') as string
  const warrantyText = formData.get('warrantyText') as string
  const warrantyMonths = warrantyMonthsRaw ? Number(warrantyMonthsRaw) : undefined
  const oldName = formData.get('oldName') as string
  
  if (!id || !name) return
  
  try {
    await RepairType.updateOne(
      { id },
      {
        name,
        imageUrl,
        warrantyMonths: Number.isFinite(warrantyMonths) ? warrantyMonths : undefined,
        warrantyText,
      }
    )
    
    // If name changed, update all repairs with the old name
    if (oldName && oldName !== name) {
      await Repair.updateMany({ name: oldName }, { name: name })
    }
    
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error updating repair type:', error)
  }
}

export async function deleteRepairType(formData: FormData) {
  await connectDB()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  
  if (!id) return
  
  try {
    // Determine the name to cascade delete by. Prefer provided form value; fallback to DB lookup.
    let nameToDelete = name
    if (!nameToDelete) {
      const t = await RepairType.findOne({ id }).lean()
      if (t?.name) nameToDelete = t.name
    }

    // Delete the type definition
    await RepairType.deleteOne({ id })

    // Cascade: remove all device repairs with this name across all devices
    if (nameToDelete) {
      await Repair.deleteMany({ name: nameToDelete })
    }
    
    revalidatePath('/admin')
  } catch (error) {
    console.error('Error deleting repair type:', error)
  }
}

// Order / Sorting Actions
export async function reorderItem(formData: FormData) {
  await connectDB()

  const entity = formData.get('entity') as string // 'brand' | 'device' | 'repair' | 'repairType' | 'brandSection'
  const id = formData.get('id') as string
  const direction = (formData.get('direction') as 'up' | 'down') || 'up'
  const scopeKey = formData.get('scopeKey') as string | null
  const scopeValue = formData.get('scopeValue') as string | null
  const orderField = (formData.get('orderField') as string) || 'order'
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'

  if (!entity || !id) return

  const collator = new Intl.Collator('nl', { sensitivity: 'base' })

  // Normalize if duplicate orders so rank adjustments work predictably
  const normalizeSequential = async (items: any[], model: any, extraFilter: any = {}, field: string = 'order') => {
    const ops = items.map((doc, i) => ({ updateOne: { filter: { ...extraFilter, id: doc.id }, update: { $set: { [field]: i } } } }))
    if (ops.length) await model.bulkWrite(ops)
  }

  try {
    if (entity === 'brand') {
      const scopeFilter: any = {}
      if (scopeKey === 'sectionId' && scopeValue) {
        if (scopeValue === '__none__') {
          scopeFilter.$or = [{ sectionId: { $exists: false } }, { sectionId: null }, { sectionId: '' }]
        } else {
          scopeFilter.sectionId = scopeValue
        }
      }

      const all = await Brand.find(scopeFilter).lean()
      all.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
      const orders = all.map(x => x.order ?? 0)
      if (new Set(orders).size !== orders.length) await normalizeSequential(all, Brand, scopeFilter, 'order')
      const list = await Brand.find(scopeFilter).sort({ order: 1, name: 1 }).lean()
      const i = list.findIndex(x => x.id === id)
      if (i < 0) throw new Error('Brand not found')
      const prev = i > 0 ? list[i-1] : null
      const prevPrev = i > 1 ? list[i-2] : null
      const next = i < list.length-1 ? list[i+1] : null
      const nextNext = i < list.length-2 ? list[i+2] : null
      let newOrder = list[i].order ?? i
      if (direction === 'up' && prev) {
        const lower = prevPrev ? (prevPrev.order ?? (i-2)) : (prev.order ?? (i-1)) - 1
        newOrder = ((prev.order ?? (i-1)) + lower) / 2
      } else if (direction === 'down' && next) {
        const upper = nextNext ? (nextNext.order ?? (i+2)) : (next.order ?? (i+1)) + 1
        newOrder = ((next.order ?? (i+1)) + upper) / 2
      }
      await Brand.updateOne({ id }, { $set: { order: newOrder } })
    } else if (entity === 'device') {
      const current = await Device.findOne({ id }).lean()
      if (!current) throw new Error('Device not found')
      const scopeField = scopeKey || 'brandId'
      const scopeVal = scopeValue || (current as any)[scopeField]
      const scope: any = { [scopeField]: scopeVal }
      const field = orderField || 'order'
      const all = await Device.find(scope).lean()
      all.sort((a, b) => ((a[field] ?? 0) - (b[field] ?? 0)) || collator.compare(a.name, b.name))
      const orders = all.map(x => x[field] ?? 0)
      if (new Set(orders).size !== orders.length) await normalizeSequential(all, Device, scope, field)
      const list = await Device.find(scope).sort({ [field]: 1, name: 1 }).lean()
      const i = list.findIndex(x => x.id === id)
      if (i < 0) throw new Error('Device not found in scope')
      const prev = i > 0 ? list[i-1] : null
      const prevPrev = i > 1 ? list[i-2] : null
      const next = i < list.length-1 ? list[i+1] : null
      const nextNext = i < list.length-2 ? list[i+2] : null
      let newOrder = list[i][field] ?? i
      if (direction === 'up' && prev) {
        const lower = prevPrev ? (prevPrev[field] ?? (i-2)) : (prev[field] ?? (i-1)) - 1
        newOrder = ((prev[field] ?? (i-1)) + lower) / 2
      } else if (direction === 'down' && next) {
        const upper = nextNext ? (nextNext[field] ?? (i+2)) : (next[field] ?? (i+1)) + 1
        newOrder = ((next[field] ?? (i+1)) + upper) / 2
      }
      await Device.updateOne({ id }, { $set: { [field]: newOrder } })
    } else if (entity === 'repairType') {
      const all = await RepairType.find().lean()
      all.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
      const orders = all.map(x => x.order ?? 0)
      if (new Set(orders).size !== orders.length) await normalizeSequential(all, RepairType, {}, 'order')
      const list = await RepairType.find().sort({ order: 1, name: 1 }).lean()
      const i = list.findIndex(x => x.id === id)
      if (i < 0) throw new Error('Type not found')
      const prev = i > 0 ? list[i-1] : null
      const prevPrev = i > 1 ? list[i-2] : null
      const next = i < list.length-1 ? list[i+1] : null
      const nextNext = i < list.length-2 ? list[i+2] : null
      let newOrder = list[i].order ?? i
      if (direction === 'up' && prev) {
        const lower = prevPrev ? (prevPrev.order ?? (i-2)) : (prev.order ?? (i-1)) - 1
        newOrder = ((prev.order ?? (i-1)) + lower) / 2
      } else if (direction === 'down' && next) {
        const upper = nextNext ? (nextNext.order ?? (i+2)) : (next.order ?? (i+1)) + 1
        newOrder = ((next.order ?? (i+1)) + upper) / 2
      }
      await RepairType.updateOne({ id }, { $set: { order: newOrder } })
    } else if (entity === 'repair') {
      const current = await Repair.findOne({ id }).lean()
      if (!current) throw new Error('Repair not found')
      const scope = { deviceId: scopeValue || current.deviceId }
      const all = await Repair.find(scope).lean()
      all.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
      const orders = all.map(x => x.order ?? 0)
      if (new Set(orders).size !== orders.length) await normalizeSequential(all, Repair, scope, 'order')
      const list = await Repair.find(scope).sort({ order: 1, name: 1 }).lean()
      const i = list.findIndex(x => x.id === id)
      if (i < 0) throw new Error('Repair not found in scope')
      const prev = i > 0 ? list[i-1] : null
      const prevPrev = i > 1 ? list[i-2] : null
      const next = i < list.length-1 ? list[i+1] : null
      const nextNext = i < list.length-2 ? list[i+2] : null
      let newOrder = list[i].order ?? i
      if (direction === 'up' && prev) {
        const lower = prevPrev ? (prevPrev.order ?? (i-2)) : (prev.order ?? (i-1)) - 1
        newOrder = ((prev.order ?? (i-1)) + lower) / 2
      } else if (direction === 'down' && next) {
        const upper = nextNext ? (nextNext.order ?? (i+2)) : (next.order ?? (i+1)) + 1
        newOrder = ((next.order ?? (i+1)) + upper) / 2
      }
      await Repair.updateOne({ id }, { $set: { order: newOrder } })
    } else if (entity === 'brandSection') {
      const all = await BrandSection.find().lean()
      all.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
      const orders = all.map(x => x.order ?? 0)
      if (new Set(orders).size !== orders.length) await normalizeSequential(all, BrandSection, {}, 'order')
      const list = await BrandSection.find().sort({ order: 1, name: 1 }).lean()
      const i = list.findIndex(x => x.id === id)
      if (i < 0) throw new Error('BrandSection not found')
      const prev = i > 0 ? list[i-1] : null
      const prevPrev = i > 1 ? list[i-2] : null
      const next = i < list.length-1 ? list[i+1] : null
      const nextNext = i < list.length-2 ? list[i+2] : null
      let newOrder = list[i].order ?? i
      if (direction === 'up' && prev) {
        const lower = prevPrev ? (prevPrev.order ?? (i-2)) : (prev.order ?? (i-1)) - 1
        newOrder = ((prev.order ?? (i-1)) + lower) / 2
      } else if (direction === 'down' && next) {
        const upper = nextNext ? (nextNext.order ?? (i+2)) : (next.order ?? (i+1)) + 1
        newOrder = ((next.order ?? (i+1)) + upper) / 2
      }
      await BrandSection.updateOne({ id }, { $set: { order: newOrder } })
    }

    revalidatePath('/admin')
    if (redirectTo) redirect(redirectTo)
  } catch (error) {
    console.error('Error reordering item:', error)
  }
}

// Bulk save explicit order using provided id sequence
export async function saveOrderSequence(formData: FormData) {
  await connectDB()

  const entity = formData.get('entity') as string // 'brand' | 'device' | 'repair' | 'repairType'
  const ordered = (formData.get('ordered') as string) || '' // comma-separated ids
  const scopeKey = formData.get('scopeKey') as string | null // e.g., 'deviceId'
  const scopeValue = formData.get('scopeValue') as string | null // e.g., a specific deviceId
  const orderField = (formData.get('orderField') as string) || 'order'
  const redirectTo = (formData.get('redirectTo') as string) || '/admin'

  if (!entity || !ordered) {
    if (redirectTo) redirect(redirectTo)
    return
  }

  const ids = ordered.split(',').map(s => s.trim()).filter(Boolean)

  try {
    const bulkUpdates = ids.map((id, index) => {
      const filter: any = { id }
      if (entity === 'brand' && scopeKey === 'sectionId' && scopeValue) {
        if (scopeValue === '__none__') {
          filter.$or = [{ sectionId: { $exists: false } }, { sectionId: null }, { sectionId: '' }]
        } else {
          filter.sectionId = scopeValue
        }
      } else if (scopeKey && scopeValue) {
        filter[scopeKey] = scopeValue
      }
      return { updateOne: { filter, update: { $set: { [orderField]: index } } } }
    })

    switch (entity) {
      case 'brand':
        if (bulkUpdates.length) await Brand.bulkWrite(bulkUpdates)
        break
      case 'device':
        if (bulkUpdates.length) await Device.bulkWrite(bulkUpdates)
        break
      case 'repair':
        if (bulkUpdates.length) await Repair.bulkWrite(bulkUpdates)
        break
      case 'repairType':
        if (bulkUpdates.length) await RepairType.bulkWrite(bulkUpdates)
        // Propagate global repair type order to all device repairs by matching name
        if (orderField === 'order') try {
          const types = await RepairType.find({ id: { $in: ids } }).lean()
          const typeById: Record<string, string> = {}
          types.forEach(t => { typeById[t.id] = t.name })
          const repairOps = ids.map((typeId, idx) => ({
            updateMany: {
              filter: { name: typeById[typeId] },
              update: { $set: { order: idx } }
            }
          }))
          if (repairOps.length) await Repair.bulkWrite(repairOps as any)
        } catch (e) {
          console.error('Error propagating repair order from types:', e)
        }
        break
      case 'brandSection':
        if (bulkUpdates.length) await BrandSection.bulkWrite(bulkUpdates)
        break
      default:
        break
    }

    revalidatePath('/admin')
    if (redirectTo) redirect(redirectTo)
  } catch (error) {
    console.error('Error saving order sequence:', error)
  }
}

// Save device order per brand based on a flat ordered list of device ids
export async function saveDeviceOrderByBrand(formData: FormData) {
  await connectDB()

  const ordered = (formData.get('ordered') as string) || ''
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=toestellen&sortDevices=order'

  if (!ordered) {
    if (redirectTo) redirect(redirectTo)
    return
  }

  const ids = ordered.split(',').map(s => s.trim()).filter(Boolean)

  try {
    // Fetch brandId mapping for devices
    const devices = await Device.find({ id: { $in: ids } }).select('id brandId').lean()
    const brandById: Record<string, string> = {}
    devices.forEach(d => { brandById[d.id] = d.brandId })

    // Assign sequential order within each brand based on the incoming sequence
    const counters: Record<string, number> = {}
    const bulk = ids.map(id => {
      const brandId = brandById[id]
      const idx = (counters[brandId] ?? 0)
      counters[brandId] = idx + 1
      return { updateOne: { filter: { id }, update: { $set: { order: idx } } } }
    })
    if (bulk.length) await Device.bulkWrite(bulk)

    revalidatePath('/admin')
    if (redirectTo) redirect(redirectTo)
  } catch (error) {
    console.error('Error saving device order by brand:', error)
  }
}

// Save device order per type based on a flat ordered list of device ids
export async function saveDeviceOrderByType(formData: FormData) {
  await connectDB()

  const ordered = (formData.get('ordered') as string) || ''
  const redirectTo = (formData.get('redirectTo') as string) || '/admin?tab=toestellen&sortDeviceTypes=order'

  if (!ordered) {
    if (redirectTo) redirect(redirectTo)
    return
  }

  const ids = ordered.split(',').map(s => s.trim()).filter(Boolean)

  try {
    const devices = await Device.find({ id: { $in: ids } }).select('id type').lean()
    const typeById: Record<string, string> = {}
    devices.forEach(d => { typeById[d.id] = d.type })

    const counters: Record<string, number> = {}
    const bulk = ids.map(id => {
      const type = typeById[id]
      const idx = (counters[type] ?? 0)
      counters[type] = idx + 1
      return { updateOne: { filter: { id }, update: { $set: { typeOrder: idx } } } }
    })
    if (bulk.length) await Device.bulkWrite(bulk)

    revalidatePath('/admin')
    if (redirectTo) redirect(redirectTo)
  } catch (error) {
    console.error('Error saving device order by type:', error)
  }
}
