export const dynamic = 'force-dynamic'
import { Lock, Trash2, Save, Plus, Wrench, X, Edit2, ChevronUp, ChevronDown } from 'lucide-react'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import { Brand } from '@/lib/models/Brand'
import { Device } from '@/lib/models/Device'
import { Repair } from '@/lib/models/Repair'
import { RepairType } from '@/lib/models/RepairType'
import { vitrineTypes } from '@/lib/vitrine-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FormSelect from '@/components/admin/form-select'
import AdminNav from '@/components/admin/admin-nav'
import AdminHeader from '@/components/admin/admin-header'
import { Fragment } from 'react'
import { addBrand, deleteBrand, addDevice, deleteDevice, addRepair, deleteRepair, updateRepairPrice, ensureStandardRepairs, addRepairType, updateRepairType, deleteRepairType, reorderItem, saveOrderSequence, updateBrand, updateDevice, addScreenQuality, toggleScreenQuality, updateScreenQualityPrice, deleteScreenQuality, saveDeviceOrderByBrand, syncRepairsToAllDevices } from './actions'
import { getAdminSessionCookieName, verifyAdminSessionToken } from '@/lib/admin-session'

export const metadata = {
  title: 'Admin',
}

export default async function AdminPage({ searchParams }) {
  const params = await searchParams

  const email = params?.email
  const password = params?.password
  const isLoginAttempt = params?.loggedin === 'true'

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminSessionCookieName())?.value
  const hasValidSession = verifyAdminSessionToken(sessionToken)

  // Legacy query login fallback (still supported)
  const isAuthenticatedByQuery = isLoginAttempt && email === 'test@test.com' && password === 'test123'
  const isAuthenticated = hasValidSession || isAuthenticatedByQuery
  const showLoginError = params?.error === '1'

  let brands = []
  let devices = []
  let repairs = []
  let repairTypes = []
  let dbError = false

  if (isAuthenticated) {
    try {
      await connectDB()
      brands = await Brand.find().lean()
      devices = await Device.find().lean()
      repairs = await Repair.find().lean()
      repairTypes = await RepairType.find().lean()

      brands = JSON.parse(JSON.stringify(brands))
      devices = JSON.parse(JSON.stringify(devices))
      repairs = JSON.parse(JSON.stringify(repairs))
      repairTypes = JSON.parse(JSON.stringify(repairTypes))
    } catch (error) {
      console.error('Database verbinding mislukt in AdminPage:', error)
      dbError = true
      brands = []
      devices = []
      repairs = []
      repairTypes = []
    }
  }

  const activeTab = params?.tab || 'merken'
  const editingDeviceId = params?.editDevice
  const editingBrandId = params?.editBrand
  const editingDeviceInfoId = params?.editDeviceInfo
  const editingRepairTypeId = params?.editRepairType
  const sortBrands = params?.sortBrands || 'order'
  const sortDevices = params?.sortDevices || 'order'
  const sortRepairTypes = params?.sortRepairTypes || 'order'

  let editingDevice = null
  let editingBrand = null
  let editingDeviceInfo = null
  let editingRepairs = []
  let editingRepairType = null

  if (isAuthenticated && editingDeviceId) {
    editingDevice = devices.find(d => d.id === editingDeviceId)
    if (editingDevice) {
      // Re-fetch repairs for this device
      editingRepairs = await Repair.find({ deviceId: editingDeviceId }).lean()
      editingRepairs = JSON.parse(JSON.stringify(editingRepairs))
      const collatorModal = new Intl.Collator('nl', { sensitivity: 'base' })
      editingRepairs.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collatorModal.compare(a.name, b.name))
    }
  }

  if (isAuthenticated && editingRepairTypeId) {
    editingRepairType = repairTypes.find(t => t.id === editingRepairTypeId)
  }

  if (isAuthenticated && editingBrandId) {
    editingBrand = brands.find(b => b.id === editingBrandId) || null
  }

  if (isAuthenticated && editingDeviceInfoId) {
    editingDeviceInfo = devices.find(d => d.id === editingDeviceInfoId) || null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white border rounded-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#3ca0de] rounded-lg flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

          {showLoginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              Verkeerde inloggegevens. Probeer het opnieuw.
            </div>
          )}

          <form action="/api/admin/login" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="test@test.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wachtwoord</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="••••••••"
              />
            </div>

            <input type="hidden" name="redirect" value="/admin/merken" />

            <button
              type="submit"
              className="w-full bg-[#3ca0de] text-white py-3 rounded-lg hover:bg-[#2d8bc7] font-medium"
            >
              Inloggen
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">Gebruik: test@test.com / test123</p>
        </div>
      </div>
    )
  }

  const authParams = isAuthenticatedByQuery ? `loggedin=true&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}` : ''

  // Sorting helpers and application
  const collator = new Intl.Collator('nl', { sensitivity: 'base' })
  const applySort = (arr, mode) => {
    if (!Array.isArray(arr)) return arr
    const out = [...arr]
    switch (mode) {
      case 'name-asc':
        out.sort((a, b) => collator.compare(a.name, b.name))
        break
      case 'name-desc':
        out.sort((a, b) => collator.compare(b.name, a.name))
        break
      case 'order':
      default:
        // For devices, group by brand then order then name
        if (out.length && out[0]?.brandId !== undefined) {
          const brandName = (x) => (brands.find(b => b.id === x.brandId)?.name || x.brandId)
          out.sort((a, b) => (
            collator.compare(brandName(a), brandName(b)) ||
            ((a.order ?? 0) - (b.order ?? 0)) ||
            collator.compare(a.name, b.name)
          ))
        } else {
          out.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
        }
        break
    }
    return out
  }

  // Brands are rendered per Type-group below; keep the raw list and sort per group.
  repairTypes = applySort(repairTypes, sortRepairTypes)

  const brandTypeOptions = vitrineTypes.map((t) => ({ value: t, label: t }))
  const deviceTypeOptions = [
    { value: 'phone', label: 'Telefoon' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'laptop', label: 'Laptop' },
  ]
  const TYPE_NONE = '__none__'
  const sortByOrderThenName = (arr) => {
    const out = [...arr]
    out.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name))
    return out
  }
  const sortByOrderFieldThenName = (arr, field = 'order') => {
    const out = [...arr]
    out.sort((a, b) => ((a?.[field] ?? 0) - (b?.[field] ?? 0)) || collator.compare(a.name, b.name))
    return out
  }
  const sortByNameAsc = (arr) => {
    const out = [...arr]
    out.sort((a, b) => collator.compare(a.name, b.name))
    return out
  }
  const sortByNameDesc = (arr) => {
    const out = [...arr]
    out.sort((a, b) => collator.compare(b.name, a.name))
    return out
  }

  const sortDevicesByMode = (arr, mode, field = 'order') => {
    if (!Array.isArray(arr)) return []
    switch (mode) {
      case 'name-asc':
        return sortByNameAsc(arr)
      case 'name-desc':
        return sortByNameDesc(arr)
      case 'order':
      default:
        return sortByOrderFieldThenName(arr, field)
    }
  }

  const brandLookup = new Map(brands.map(b => [b.id, b]))
  const unknownBrandIds = Array.from(new Set(devices.map(d => d.brandId).filter(id => !brandLookup.has(id)))).sort()
  const devicesByBrand = [
    ...brands.map((brand) => ({
      key: brand.id,
      label: brand.name,
      devices: sortDevicesByMode(devices.filter(d => d.brandId === brand.id), sortDevices, 'order')
    })),
    ...unknownBrandIds.map((brandId) => ({
      key: brandId,
      label: brandId,
      devices: sortDevicesByMode(devices.filter(d => d.brandId === brandId), sortDevices, 'order')
    }))
  ]
  const orderedDeviceIdsByBrand = devicesByBrand.flatMap(g => g.devices.map(d => d.id))
  const orderedDeviceIdsByBrandAsc = [...devices].sort((a, b) => {
    const ba = brandLookup.get(a.brandId)?.name || a.brandId
    const bb = brandLookup.get(b.brandId)?.name || b.brandId
    return collator.compare(ba, bb) || collator.compare(a.name, b.name)
  }).map(d => d.id)
  const orderedDeviceIdsByBrandDesc = [...devices].sort((a, b) => {
    const ba = brandLookup.get(a.brandId)?.name || a.brandId
    const bb = brandLookup.get(b.brandId)?.name || b.brandId
    return collator.compare(bb, ba) || collator.compare(b.name, a.name)
  }).map(d => d.id)

  const isScreenRepairName = (name) => name === 'Beeldscherm en glas' || name === 'Scherm vervangen'

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader 
          title={`Database: ${brands.length} merken, ${devices.length} toestellen, ${repairs.length} reparaties`}
          count=""
          isPending={false}
        />
        {dbError && (
          <div className="mb-6 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            Kan geen verbinding maken met MongoDB. Controleer Atlas IP whitelist of je MONGODB_URI.
          </div>
        )}

        <AdminNav />

        {/* Edit Device Repairs Modal */}
        {editingDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold">Reparaties beheren</h2>
                  <p className="text-gray-600">Voor: {editingDevice.name}</p>
                </div>
                <a href={`/admin?${authParams}&tab=toestellen`} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-6 h-6" />
                </a>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Volgorde wordt centraal beheerd bij tab: Reparaties.</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editingRepairs.map((repair) => {
                    const repairType = repairTypes.find((t) => t.name === repair.name)
                    const iconUrl = repair.image || repair.icon || repairType?.imageUrl

                    return (
                      <div key={repair._id} className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                            {iconUrl ? (
                              <img src={iconUrl} alt={repair.name} className="w-full h-full object-contain" />
                            ) : (
                              <Wrench className="w-5 h-5 text-[#3ca0de]" />
                            )}
                          </div>
                          <h3 className="font-semibold text-sm leading-tight">{repair.name}</h3>
                        </div>

                        <form action={updateRepairPrice} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={repair.id} />
                          <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <Input
                              type="number"
                              name="price"
                              defaultValue={repair.price}
                              step="0.01"
                              className="w-full pl-8 pr-3"
                            />
                          </div>
                          <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white h-9 px-3 inline-flex items-center gap-2" title="Opslaan">
                            <Save className="w-4 h-4" />
                            Opslaan
                          </Button>
                        </form>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          {repair.price <= 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-700">Op aanvraag</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">Actief</span>
                          )}
                          <form action={deleteRepair}>
                            <input type="hidden" name="id" value={repair.id} />
                            <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                            <button type="submit" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-red-600 hover:text-red-800 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                              Verwijderen
                            </button>
                          </form>
                        </div>

                        {isScreenRepairName(repair.name) && (
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium mb-2">Schermkwaliteiten</div>
                            <div className="space-y-3">
                              {(repair.screenQualities || []).map((q) => (
                                <div key={q.name} className="flex items-center justify-between gap-3 bg-gray-50 border rounded p-3">
                                  <div className="flex items-center gap-3">
                                    <form action={toggleScreenQuality} className="flex items-center gap-2">
                                      <input type="hidden" name="repairId" value={repair.id} />
                                      <input type="hidden" name="name" value={q.name} />
                                      <input type="hidden" name="enabled" value={(!q.enabled).toString()} />
                                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                                      <button type="submit" className={`px-2 py-1 rounded text-xs ${q.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {q.enabled ? 'Aan' : 'Uit'}
                                      </button>
                                    </form>
                                    <div className="font-medium">{q.name}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <form action={updateScreenQualityPrice} className="flex items-center gap-2">
                                      <input type="hidden" name="repairId" value={repair.id} />
                                      <input type="hidden" name="name" value={q.name} />
                                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                        <Input type="number" name="price" step="0.01" defaultValue={q.price} className="w-28 pl-8 pr-3 py-1.5" />
                                      </div>
                                      <button type="submit" className="bg-[#3ca0de] text-white px-2 py-1 rounded text-xs hover:bg-[#2d8bc7]">Opslaan</button>
                                    </form>
                                    {q.name !== 'Origineel' && (
                                      <form action={deleteScreenQuality}>
                                        <input type="hidden" name="repairId" value={repair.id} />
                                        <input type="hidden" name="name" value={q.name} />
                                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                                        <button type="submit" className="text-red-600 hover:text-red-800 text-xs">Verwijderen</button>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="border-t pt-3">
                                <form action={addScreenQuality} className="flex items-end gap-3">
                                  <input type="hidden" name="repairId" value={repair.id} />
                                  <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&editDevice=${editingDevice.id}`} />
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Naam</label>
                                    <Input name="name" placeholder="Bijv. Soft OLED" required />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Prijs (€)</label>
                                    <Input name="price" type="number" step="0.01" className="w-32" placeholder="0.00" />
                                  </div>
                                  <button type="submit" className="bg-[#3ca0de] text-white px-3 py-2 rounded hover:bg-[#2d8bc7]">Toevoegen</button>
                                </form>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {editingRepairs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Geen reparaties gevonden.
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 text-right">
                <Button asChild className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium">
                  <a href={`/admin?${authParams}&tab=toestellen`}>
                    Sluiten
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border rounded-xl mb-6 p-6">
          {activeTab === 'merken' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nieuw Merk Toevoegen
                  </h3>
                  <form action={addBrand} className="grid grid-cols-4 gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Naam</label>
                      <Input type="text" name="name" required placeholder="Bijv. Samsung" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                      <Input type="url" name="imageUrl" placeholder="https://..." />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <FormSelect name="sectionId" placeholder="Kies type" options={brandTypeOptions} />
                    </div>
                    <div>
                      <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">Toevoegen</Button>
                    </div>
                  </form>
                </div>

                {[{ key: TYPE_NONE, title: 'Zonder type' }, ...vitrineTypes.map((t) => ({ key: t, title: t }))].map((group) => {
                  const inGroup = group.key === TYPE_NONE
                    ? brands.filter((b) => !b.sectionId)
                    : brands.filter((b) => b.sectionId === group.key)

                  const byOrder = sortByOrderThenName(inGroup)
                  const byNameAsc = sortByNameAsc(inGroup)
                  const byNameDesc = sortByNameDesc(inGroup)

                  return (
                    <div key={group.key} className="bg-white border rounded-xl p-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <h3 className="text-lg font-bold">{group.title}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <form action={saveOrderSequence} className="inline-flex">
                            <input type="hidden" name="entity" value="brand" />
                            <input type="hidden" name="scopeKey" value="sectionId" />
                            <input type="hidden" name="scopeValue" value={group.key} />
                            <input type="hidden" name="ordered" value={byNameAsc.map((b) => b.id).join(',')} />
                            <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                            <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">A–Z toepassen</Button>
                          </form>
                          <form action={saveOrderSequence} className="inline-flex">
                            <input type="hidden" name="entity" value="brand" />
                            <input type="hidden" name="scopeKey" value="sectionId" />
                            <input type="hidden" name="scopeValue" value={group.key} />
                            <input type="hidden" name="ordered" value={byNameDesc.map((b) => b.id).join(',')} />
                            <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                            <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">Z–A toepassen</Button>
                          </form>
                          <form action={saveOrderSequence} className="inline-flex ml-2">
                            <input type="hidden" name="entity" value="brand" />
                            <input type="hidden" name="scopeKey" value="sectionId" />
                            <input type="hidden" name="scopeValue" value={group.key} />
                            <input type="hidden" name="ordered" value={byOrder.map((b) => b.id).join(',')} />
                            <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-2 py-1">Opslaan volgorde</Button>
                          </form>
                        </div>
                      </div>

                      {byOrder.length === 0 ? (
                        <div className="text-sm text-gray-600">Geen merken in dit type.</div>
                      ) : (
                        <div className="overflow-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Afbeelding</th>
                                <th className="text-left py-2">Naam</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">ID</th>
                                <th className="text-left py-2">Volgorde</th>
                                <th className="text-right py-2">Acties</th>
                              </tr>
                            </thead>
                            <tbody>
                              {byOrder.map((brand) => (
                                <tr key={brand._id} className="border-b last:border-b-0">
                                  <td className="py-2">
                                    {brand.imageUrl && <img src={brand.imageUrl} alt={brand.name} className="w-8 h-8 object-contain" />}
                                  </td>
                                  <td className="py-2 font-medium">{brand.name}</td>
                                  <td className="py-2">
                                    <form action={updateBrand} className="flex items-center gap-2">
                                      <input type="hidden" name="id" value={brand.id} />
                                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                                      <FormSelect name="sectionId" placeholder="Kies type" options={brandTypeOptions} defaultValue={brand.sectionId || ''} />
                                      <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white text-xs px-2 py-1">Opslaan</Button>
                                    </form>
                                  </td>
                                  <td className="py-2 text-gray-500">{brand.id}</td>
                                  <td className="py-2">
                                    <div className="flex items-center gap-1">
                                      <form action={reorderItem} className="inline-block">
                                        <input type="hidden" name="entity" value="brand" />
                                        <input type="hidden" name="id" value={brand.id} />
                                        <input type="hidden" name="direction" value="up" />
                                        <input type="hidden" name="scopeKey" value="sectionId" />
                                        <input type="hidden" name="scopeValue" value={group.key} />
                                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                                        <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omhoog">
                                          <ChevronUp className="w-4 h-4" />
                                        </button>
                                      </form>
                                      <form action={reorderItem} className="inline-block">
                                        <input type="hidden" name="entity" value="brand" />
                                        <input type="hidden" name="id" value={brand.id} />
                                        <input type="hidden" name="direction" value="down" />
                                        <input type="hidden" name="scopeKey" value="sectionId" />
                                        <input type="hidden" name="scopeValue" value={group.key} />
                                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                                        <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omlaag">
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                      </form>
                                    </div>
                                  </td>
                                  <td className="py-2 text-right align-middle">
                                    <div className="flex items-center justify-end gap-2">
                                      <a
                                        href={`/admin?${authParams}&tab=merken&editBrand=${brand.id}`}
                                        className="text-[#3ca0de] hover:text-[#2d8bc7] p-1"
                                        title="Bewerken"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </a>
                                      <form action={deleteBrand} className="inline-block">
                                        <input type="hidden" name="id" value={brand.id} />
                                        <button type="submit" className="text-red-500 hover:text-red-700 p-1 rounded" title="Verwijderen" aria-label="Verwijderen">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </form>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}

              </div>
            )}

            {activeTab === 'toestellen' && (
              <div className="space-y-8">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nieuw Toestel Toevoegen
                  </h3>
                  <form action={addDevice} className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-1">Naam</label>
                      <Input type="text" name="name" required placeholder="Bijv. Galaxy S23" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Merk</label>
                      <FormSelect 
                        name="brandId" 
                        placeholder="Kies merk..." 
                        options={brands.map(b => ({ value: b.id, label: b.name }))} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <FormSelect 
                        name="type" 
                        defaultValue={editingDeviceInfo ? editingDeviceInfo.type : ''}
                        placeholder="Kies type..." 
                        options={deviceTypeOptions} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                      <Input type="url" name="imageUrl" placeholder="https://..." />
                    </div>
                    <div className="col-span-4">
                      <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white w-full">
                        Toevoegen & Standaard Reparaties Genereren
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Toestellen per merk</h3>
                      <p className="text-sm text-gray-600">Elke merk-sectie heeft een eigen volgorde.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Button asChild className={`${sortDevices === 'order' ? 'bg-[#3ca0de] text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-sm px-2 py-1`}>
                        <a href={`/admin?${authParams}&tab=toestellen&sortDevices=order`}>Handmatig</a>
                      </Button>
                      <form action={saveOrderSequence} className="inline-flex">
                        <input type="hidden" name="entity" value="device" />
                        <input type="hidden" name="ordered" value={orderedDeviceIdsByBrandAsc.join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&sortDevices=order`} />
                        <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">A–Z toepassen</Button>
                      </form>
                      <form action={saveOrderSequence} className="inline-flex">
                        <input type="hidden" name="entity" value="device" />
                        <input type="hidden" name="ordered" value={orderedDeviceIdsByBrandDesc.join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&sortDevices=order`} />
                        <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">Z–A toepassen</Button>
                      </form>
                      <form action={saveDeviceOrderByBrand} className="inline-flex ml-2">
                        <input type="hidden" name="ordered" value={orderedDeviceIdsByBrand.join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&sortDevices=order`} />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-2 py-1">Opslaan huidige volgorde</Button>
                      </form>
                    </div>
                  </div>

                  {devicesByBrand.map((group) => (
                    <div key={group.key} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <div className="font-semibold">{group.label}</div>
                        <div className="text-xs text-gray-500">{group.devices.length} toestellen</div>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Afbeelding</th>
                            <th className="text-left py-2 px-4">Naam</th>
                            <th className="text-left py-2 px-4">Merk</th>
                            <th className="text-left py-2 px-4">Type</th>
                            <th className="text-left py-2 px-4">Volgorde</th>
                            <th className="text-right py-2 px-4">Acties</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.devices.length === 0 ? (
                            <tr className="border-b">
                              <td colSpan={6} className="py-3 px-4 text-sm text-gray-600">Geen toestellen in dit merk.</td>
                            </tr>
                          ) : (
                            group.devices.map((device) => (
                              <tr key={device._id} className="border-b">
                                <td className="py-2 px-4">
                                  {device.imageUrl && <img src={device.imageUrl} alt={device.name} className="w-8 h-8 object-contain" />}
                                </td>
                                <td className="py-2 px-4 font-medium">{device.name}</td>
                                <td className="py-2 px-4">{brandLookup.get(device.brandId)?.name || device.brandId}</td>
                                <td className="py-2 px-4 capitalize">{device.type}</td>
                                <td className="py-2 px-4">
                                  <div className="flex items-center gap-1">
                                    <form action={reorderItem} className="inline-block">
                                      <input type="hidden" name="entity" value="device" />
                                      <input type="hidden" name="id" value={device.id} />
                                      <input type="hidden" name="direction" value="up" />
                                      <input type="hidden" name="scopeKey" value="brandId" />
                                      <input type="hidden" name="scopeValue" value={device.brandId} />
                                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&sortDevices=order`} />
                                      <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omhoog">
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                    </form>
                                    <form action={reorderItem} className="inline-block">
                                      <input type="hidden" name="entity" value="device" />
                                      <input type="hidden" name="id" value={device.id} />
                                      <input type="hidden" name="direction" value="down" />
                                      <input type="hidden" name="scopeKey" value="brandId" />
                                      <input type="hidden" name="scopeValue" value={device.brandId} />
                                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen&sortDevices=order`} />
                                      <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omlaag">
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </form>
                                  </div>
                                </td>
                                <td className="py-2 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <a 
                                      href={`/admin?${authParams}&tab=toestellen&editDeviceInfo=${device.id}`}
                                      className="text-[#3ca0de] hover:text-[#2d8bc7] p-1" 
                                      title="Bewerken"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </a>
                                    <a 
                                      href={`/admin?${authParams}&tab=toestellen&editDevice=${device.id}`}
                                      className="text-[#3ca0de] hover:text-[#2d8bc7] p-1" 
                                      title="Reparaties beheren"
                                    >
                                      <Wrench className="w-4 h-4" />
                                    </a>
                                    <form action={deleteDevice} className="inline-block">
                                      <input type="hidden" name="id" value={device.id} />
                                      <button type="submit" className="text-red-500 hover:text-red-700 p-1" title="Verwijderen">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                
              </div>
            )}

            {activeTab === 'reparaties' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <h3 className="font-bold mb-2 text-blue-900">ℹ️ Reparatie Types Beheren</h3>
                  <p className="text-sm text-blue-800">
                    Hier beheer je de standaard reparaties (zoals "Scherm vervangen"). 
                    Als je hier een type toevoegt, wordt deze automatisch toegevoegd aan <strong>alle bestaande toestellen</strong>.
                    Als je een naam wijzigt, wordt dit aangepast voor alle toestellen.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nieuw Reparatie Type Toevoegen
                  </h3>
                  <form action={addRepairType} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Naam</label>
                      <Input type="text" name="name" required placeholder="Bijv. Achterkant vervangen" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Afbeelding URL (Optioneel)</label>
                      <Input type="url" name="imageUrl" placeholder="https://..." />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Garantie (maanden)</label>
                      <Input type="number" name="warrantyMonths" min="0" placeholder="Bijv. 3" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Garantie tekst (optioneel)</label>
                      <Input type="text" name="warrantyText" placeholder="Bijv. 3 maanden garantie op reparatie" />
                    </div>
                    <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">Toevoegen aan Alle Toestellen</Button>
                  </form>
                  <div className="mt-4">
                    <form action={syncRepairsToAllDevices} className="inline-flex items-center gap-2">
                      <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties`} />
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Synchroniseer reparaties met alle toestellen</Button>
                    </form>
                  </div>
                </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">Sorteren (eenmalig toepassen):</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Button asChild className={`${sortRepairTypes === 'order' ? 'bg-[#3ca0de] text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-sm px-2 py-1`}>
                        <a href={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`}>Handmatig</a>
                      </Button>
                      <form action={saveOrderSequence} className="inline-flex">
                        <input type="hidden" name="entity" value="repairType" />
                        <input type="hidden" name="ordered" value={[...repairTypes].sort((a,b)=>new Intl.Collator('nl',{sensitivity:'base'}).compare(a.name,b.name)).map(t=>t.id).join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`} />
                        <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">A–Z toepassen</Button>
                      </form>
                      <form action={saveOrderSequence} className="inline-flex">
                        <input type="hidden" name="entity" value="repairType" />
                        <input type="hidden" name="ordered" value={[...repairTypes].sort((a,b)=>new Intl.Collator('nl',{sensitivity:'base'}).compare(b.name,a.name)).map(t=>t.id).join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`} />
                        <Button type="submit" className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2 py-1">Z–A toepassen</Button>
                      </form>
                      <form action={saveOrderSequence} className="inline-flex ml-2">
                        <input type="hidden" name="entity" value="repairType" />
                        <input type="hidden" name="ordered" value={repairTypes.map(t=>t.id).join(',')} />
                        <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`} />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-2 py-1">Opslaan huidige volgorde</Button>
                      </form>
                    </div>
                  </div>

                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Afbeelding</th>
                      <th className="text-left py-2">Naam</th>
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">Volgorde</th>
                      <th className="text-right py-2">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairTypes.map((type) => (
                      <tr key={type._id} className="border-b">
                        <td className="py-2">
                          {type.imageUrl && <img src={type.imageUrl} alt={type.name} className="w-8 h-8 object-contain" />}
                        </td>
                        <td className="py-2 font-medium">{type.name}</td>
                        <td className="py-2 text-gray-500 text-sm">{type.id}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <form action={reorderItem} className="inline-block">
                              <input type="hidden" name="entity" value="repairType" />
                              <input type="hidden" name="id" value={type.id} />
                              <input type="hidden" name="direction" value="up" />
                              <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`} />
                              <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omhoog">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                            </form>
                            <form action={reorderItem} className="inline-block">
                              <input type="hidden" name="entity" value="repairType" />
                              <input type="hidden" name="id" value={type.id} />
                              <input type="hidden" name="direction" value="down" />
                              <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=reparaties&sortRepairTypes=order`} />
                              <button type="submit" className="p-1 rounded hover:bg-gray-100" title="Omlaag">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={`/admin?${authParams}&tab=reparaties&editRepairType=${type.id}`}
                              className="text-[#3ca0de] hover:text-[#2d8bc7] p-1" 
                              title="Bewerken"
                            >
                              <Edit2 className="w-4 h-4" />
                            </a>
                            <form action={deleteRepairType} className="inline-block">
                              <input type="hidden" name="id" value={type.id} />
                              <input type="hidden" name="name" value={type.name} />
                              <button type="submit" className="text-red-500 hover:text-red-700 p-1" title="Verwijderen">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {repairTypes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nog geen reparatie types. Voeg er een toe om te beginnen.
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Edit Repair Type Modal */}
        {editingRepairType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold">Reparatie Type Bewerken</h2>
                <a href={`/admin?${authParams}&tab=reparaties`} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-6 h-6" />
                </a>
              </div>
              
              <div className="p-6">
                <form action={updateRepairType} className="space-y-4">
                  <input type="hidden" name="id" value={editingRepairType.id} />
                  <input type="hidden" name="oldName" value={editingRepairType.name} />
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Naam</label>
                    <Input 
                      type="text" 
                      name="name" 
                      defaultValue={editingRepairType.name} 
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Let op: Als je de naam wijzigt, wordt dit aangepast voor alle toestellen die deze reparatie hebben.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                    <Input 
                      type="url" 
                      name="imageUrl" 
                      defaultValue={editingRepairType.imageUrl} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Garantie (maanden)</label>
                    <Input
                      type="number"
                      name="warrantyMonths"
                      min="0"
                      defaultValue={editingRepairType.warrantyMonths ?? ""}
                      placeholder="Bijv. 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Garantie tekst (optioneel)</label>
                    <Input
                      type="text"
                      name="warrantyText"
                      defaultValue={editingRepairType.warrantyText ?? ""}
                      placeholder="Bijv. 3 maanden garantie op reparatie"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-2">
                    <Button asChild className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                      <a href={`/admin?${authParams}&tab=reparaties`}>
                        Annuleren
                      </a>
                    </Button>
                    <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">
                      Opslaan
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Brand Modal */}
        {editingBrand && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold">Merk bewerken</h2>
                <a href={`/admin?${authParams}&tab=merken`} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-6 h-6" />
                </a>
              </div>
              <div className="p-6">
                <form action={updateBrand} className="space-y-4">
                  <input type="hidden" name="id" value={editingBrand.id} />
                  <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=merken`} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Naam</label>
                    <Input type="text" name="name" defaultValue={editingBrand.name} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                    <Input type="url" name="imageUrl" defaultValue={editingBrand.imageUrl} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <FormSelect name="sectionId" placeholder="Kies type" options={brandTypeOptions} defaultValue={editingBrand.sectionId || ''} />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button asChild className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                      <a href={`/admin?${authParams}&tab=merken`}>Annuleren</a>
                    </Button>
                    <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">Opslaan</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Device Info Modal */}
        {editingDeviceInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold">Toestel bewerken</h2>
                <a href={`/admin?${authParams}&tab=toestellen`} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-6 h-6" />
                </a>
              </div>
              <div className="p-6">
                <form action={updateDevice} className="space-y-4">
                  <input type="hidden" name="id" value={editingDeviceInfo.id} />
                  <input type="hidden" name="redirectTo" value={`/admin?${authParams}&tab=toestellen`} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Naam</label>
                    <input type="text" name="name" defaultValue={editingDeviceInfo.name} className="w-full px-3 py-2 border rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Merk</label>
                    <FormSelect 
                      name="brandId" 
                      defaultValue={editingDeviceInfo.brandId} 
                      placeholder="Kies merk..." 
                      options={brands.map(b => ({ value: b.id, label: b.name }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <FormSelect 
                      name="type" 
                      defaultValue={editingDeviceInfo.type} 
                      placeholder="Kies type..." 
                      options={[
                        { value: 'phone', label: 'Telefoon' },
                        { value: 'tablet', label: 'Tablet' },
                        { value: 'laptop', label: 'Laptop' },
                      ]} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                    <input type="url" name="imageUrl" defaultValue={editingDeviceInfo.imageUrl} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button asChild className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                      <a href={`/admin?${authParams}&tab=toestellen`}>Annuleren</a>
                    </Button>
                    <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">Opslaan</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
