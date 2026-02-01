"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, ChevronRight, Smartphone, Tablet, Laptop, Wrench, ArrowLeft, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { vitrineTypes } from "@/lib/vitrine-data"

export default function DeviceSelector() {
  // --- STATE ---
  const [step, setStep] = useState(1) // 1 = Merk, 2 = Toestel, 3 = Reparatie
  const [searchQuery, setSearchQuery] = useState("")
  
  const [brands, setBrands] = useState([])
  const [devices, setDevices] = useState([])
  const [repairs, setRepairs] = useState([])
  const [repairTypes, setRepairTypes] = useState([])
  
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)

  // Geselecteerde reparaties over alle toestellen heen
  const [selectedRepairs, setSelectedRepairs] = useState([]) // {deviceId, deviceName, brandId, brandName, repairId, repairName, price}
  // Per-reparatie keuze voor schermkwaliteit (alleen voor 'Beeldscherm en glas')
  const [qualitySelection, setQualitySelection] = useState({}) // { [repairId]: qualityName }

  // --- DATA FETCHING (Simpel gehouden: alles in 1x ophalen) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // We halen de data op van de API endpoints die we al hebben
        const [brandsRes, devicesRes, repairsRes, typesRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/devices'),
          fetch('/api/repairs'),
          fetch('/api/repair-types')
        ])
        
        const brandsData = await brandsRes.json()
        const devicesData = await devicesRes.json()
        const repairsData = await repairsRes.json()
        const typesData = await typesRes.json()

        const collator = new Intl.Collator('nl', { sensitivity: 'base' })
        const byOrderThenName = (a, b) => ((a.order ?? 0) - (b.order ?? 0)) || collator.compare(a.name, b.name)

        setBrands(Array.isArray(brandsData) ? [...brandsData].sort(byOrderThenName) : [])
        setDevices(Array.isArray(devicesData) ? [...devicesData].sort(byOrderThenName) : [])
        setRepairs(Array.isArray(repairsData) ? [...repairsData].sort(byOrderThenName) : [])
        setRepairTypes(Array.isArray(typesData) ? [...typesData].sort(byOrderThenName) : [])
      } catch (error) {
        console.error("Fout bij laden data:", error)
        // Fallback data voor als de API faalt (zodat de site niet leeg is)
        const fallbackBrands = [
          { id: 'apple', name: 'Apple' },
          { id: 'samsung', name: 'Samsung' }
        ]
        const collator2 = new Intl.Collator('nl', { sensitivity: 'base' })
        setBrands(fallbackBrands.sort((a,b)=>collator2.compare(a.name,b.name)))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // --- LOGICA ---

  // Filter logica voor zoeken
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase().trim()
    
    if (!query) return null // Geen zoekopdracht = normale flow

    // Zoek in alles
    const foundBrands = brands.filter(b => b.name.toLowerCase().includes(query))
    const foundDevices = devices.filter(d => d.name.toLowerCase().includes(query))
    const foundRepairs = repairs.filter(r => r.name.toLowerCase().includes(query))

    return { foundBrands, foundDevices, foundRepairs }
  }

  const searchResults = getFilteredData()

  // Helper: target only the screen replacement repair
  const isScreenRepair = (name) => name === 'Scherm vervangen' || name === 'Beeldscherm en glas'

  // Navigatie helpers
  const selectBrand = (brand) => {
    setSelectedBrand(brand)
    setSelectedDevice(null)
    setStep(2)
    setSearchQuery("")
  }

  const selectDevice = (device) => {
    // Als we via zoeken komen, moeten we ook het merk zetten
    if (!selectedBrand) {
      const brand = brands.find(b => b.id === device.brandId)
      setSelectedBrand(brand)
    }
    setSelectedDevice(device)
    setStep(3)
    setSearchQuery("")
  }

  // Toevoegen/verwijderen van reparaties aan "winkelmandje"
  const addRepair = (repair) => {
    if (!selectedDevice) return
    let price = Number(repair.price || 0)
    let qualityLabel = null
    if (isScreenRepair(repair.name)) {
      const actives = (repair.screenQualities || []).filter(q => q.enabled)
      const visibleQuals = actives.length > 0 ? actives : [{ name: 'Origineel', price: Number(repair.price || 0), enabled: true }]
      const selectedName = qualitySelection[repair.id] || visibleQuals[0].name
      const found = visibleQuals.find(q => q.name === selectedName) || visibleQuals[0]
      price = Number(found.price || 0)
      qualityLabel = found.name
    }
    const already = selectedRepairs.some(
      (r) => r.deviceId === selectedDevice.id && r.repairId === repair.id
    )
    if (already) return
    const brand = brands.find((b) => b.id === selectedDevice.brandId)
    setSelectedRepairs((prev) => [
      ...prev,
      {
        deviceId: selectedDevice.id,
        deviceName: selectedDevice.name,
        brandId: brand?.id,
        brandName: brand?.name,
        repairId: repair.id,
        repairName: qualityLabel ? `${repair.name} — ${qualityLabel}` : repair.name,
        price,
      },
    ])
  }

  const removeRepair = (deviceId, repairId) => {
    setSelectedRepairs((prev) => prev.filter((r) => !(r.deviceId === deviceId && r.repairId === repairId)))
  }

  const clearRepairs = () => setSelectedRepairs([])

  const subtotal = useMemo(() => selectedRepairs.reduce((sum, r) => sum + Number(r.price || 0), 0), [selectedRepairs])
  const discount = useMemo(() => (selectedRepairs.length >= 2 ? 15 : 0), [selectedRepairs])
  const total = useMemo(() => Math.max(subtotal - discount, 0), [subtotal, discount])

  // --- RENDER HELPERS ---

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base">
        <button 
          onClick={() => setStep(1)}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            step === 1 ? "bg-[#3ca0de] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          1. Merk
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <button 
          onClick={() => selectedBrand && setStep(2)}
          disabled={!selectedBrand}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            step === 2 ? "bg-[#3ca0de] text-white" : 
            selectedBrand ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "text-gray-300 cursor-not-allowed"
          }`}
        >
          2. Toestel
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <button 
          disabled={!selectedDevice}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            step === 3 ? "bg-[#3ca0de] text-white" : 
            selectedDevice ? "bg-gray-100 text-gray-600" : "text-gray-300 cursor-not-allowed"
          }`}
        >
          3. Reparatie
        </button>
      </div>
    </div>
  )

  if (isLoading) {
    return <div className="py-20 text-center text-gray-500">Laden...</div>
  }

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Kies uw reparatie</h2>
          <p className="text-gray-500">In 3 simpele stappen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Wizard Card */}
          <Card className="lg:col-span-2 p-6 border shadow-sm bg-white">
            {/* Zoekbalk */}
            <div className="max-w-xl mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Zoek merk, toestel of reparatie..."
                className="pl-10 h-12 text-lg border-gray-300 focus:border-[#3ca0de] focus:ring-[#3ca0de]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stap Indicator (alleen als we niet zoeken) */}
            {!searchQuery && renderStepIndicator()}

            {/* CONTENT AREA */}
            <div className="min-h-[300px]">

          {/* ZOEKRESULTATEN */}
          {searchQuery && searchResults && (
            <div className="space-y-8">
              {/* Toestellen resultaten */}
              {searchResults.foundDevices.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-[#3ca0de]">Toestellen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.foundDevices.map(device => (
                      <Card 
                        key={device.id} 
                        onClick={() => selectDevice(device)}
                        className="p-6 min-h-[180px] cursor-pointer hover:ring-2 hover:ring-[#3ca0de] transition-all flex flex-col items-center justify-center text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-24 h-24 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                            {device.imageUrl ? (
                              <img src={device.imageUrl} alt={device.name} className="w-full h-full object-contain" />
                            ) : (
                              <Smartphone className="w-10 h-10 text-gray-600" />
                            )}
                          </div>
                          <span className="font-semibold">{device.name}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Merken resultaten */}
              {searchResults.foundBrands.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-[#3ca0de]">Merken</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {searchResults.foundBrands.map(brand => (
                      <Card 
                        key={brand.id} 
                        onClick={() => selectBrand(brand)}
                        className="p-4 cursor-pointer hover:border-[#3ca0de] hover:shadow-md transition-all text-center"
                      >
                        <span className="font-medium">{brand.name}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.foundDevices.length === 0 && searchResults.foundBrands.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Geen resultaten gevonden voor "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* NORMALE FLOW (Geen zoekopdracht) */}
          {!searchQuery && (
            <>
              {/* STAP 1: MERKEN */}
              {step === 1 && (
                <div className="space-y-8">
                  {/* Zonder type */}
                  {brands.filter(b => !b.sectionId).length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-[#3ca0de]">Zonder type</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...brands].filter(b => !b.sectionId).map(brand => (
                          <Card 
                            key={brand.id}
                            onClick={() => selectBrand(brand)}
                            className="p-6 cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all flex flex-col items-center gap-4 group"
                          >
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                              {brand.imageUrl ? (
                                <img src={brand.imageUrl} alt={brand.name} className="w-10 h-10 object-contain" />
                              ) : (
                                <span className="text-xl font-bold text-[#3ca0de]">{brand.name.substring(0,1)}</span>
                              )}
                            </div>
                            <span className="font-semibold group-hover:text-[#3ca0de]">{brand.name}</span>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Gedefinieerde types (zelfde lijst als Vitrine) */}
                  {vitrineTypes
                    .filter((t) => brands.some((b) => b.sectionId === t))
                    .map((t) => (
                      <div key={t}>
                        <h3 className="font-bold text-lg mb-4 text-[#3ca0de]">{t}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {[...brands]
                            .filter((b) => b.sectionId === t)
                            .map((brand) => (
                              <Card
                                key={brand.id}
                                onClick={() => selectBrand(brand)}
                                className="p-6 cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all flex flex-col items-center gap-4 group"
                              >
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                  {brand.imageUrl ? (
                                    <img src={brand.imageUrl} alt={brand.name} className="w-10 h-10 object-contain" />
                                  ) : (
                                    <span className="text-xl font-bold text-[#3ca0de]">{brand.name.substring(0, 1)}</span>
                                  )}
                                </div>
                                <span className="font-semibold group-hover:text-[#3ca0de]">{brand.name}</span>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* STAP 2: TOESTELLEN */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 pl-0 hover:bg-transparent hover:text-[#3ca0de]">
                      <ArrowLeft className="w-4 h-4" /> Terug naar merken
                    </Button>
                  </div>
                  <h3 className="text-xl font-bold mb-6">Kies uw {selectedBrand?.name} model</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...devices]
                      .filter(d => d.brandId === selectedBrand?.id)
                      .map(device => (
                        <Card 
                          key={device.id}
                          onClick={() => selectDevice(device)}
                          className="p-6 min-h-[220px] cursor-pointer hover:ring-2 hover:ring-[#3ca0de] transition-all flex flex-col items-center justify-center text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-28 h-28 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                              {device.imageUrl ? (
                                <img src={device.imageUrl} alt={device.name} className="w-full h-full object-contain" />
                              ) : (
                                <Smartphone className="w-10 h-10 text-gray-600" />
                              )}
                            </div>
                            <span className="font-semibold">{device.name}</span>
                          </div>
                        </Card>
                    ))}
                  </div>
                  {devices.filter(d => d.brandId === selectedBrand?.id).length === 0 && (
                    <p className="text-center text-gray-500">Geen toestellen gevonden.</p>
                  )}
                </div>
              )}

              {/* STAP 3: REPARATIES */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" onClick={() => setStep(2)} className="gap-2 pl-0 hover:bg-transparent hover:text-[#3ca0de]">
                      <ArrowLeft className="w-4 h-4" /> Terug naar toestellen
                    </Button>
                  </div>
                  <h3 className="text-xl font-bold mb-6">Reparaties voor {selectedDevice?.name}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...repairs]
                      .filter(r => r.deviceId === selectedDevice?.id)
                      .map(repair => {
                        // Prijsbepaling: voor schermvervanging neem geselecteerde kwaliteit, anders gewone prijs
                        let displayPrice = Number(repair.price || 0)
                        let activeQuals = []
                        let visibleQuals = []
                        if (isScreenRepair(repair.name)) {
                          activeQuals = (repair.screenQualities || []).filter(q => q.enabled)
                          visibleQuals = activeQuals.length > 0 ? activeQuals : [{ name: 'Origineel', price: Number(repair.price || 0), enabled: true }]
                          const selectedName = qualitySelection[repair.id] || visibleQuals[0].name
                          const found = visibleQuals.find(q => q.name === selectedName) || visibleQuals[0]
                          displayPrice = Number(found.price || 0)
                        }
                        const inCart = selectedRepairs.some(
                          (it) => it.deviceId === selectedDevice?.id && it.repairId === repair.id,
                        )
                        return (
                          <Card key={repair.id} className="p-4 rounded-xl flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                {(() => {
                                  const t = repairTypes.find(t => t.name === repair.name)
                                  const url = t?.imageUrl
                                  return url ? (
                                    <img src={url} alt={repair.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Wrench className="w-4 h-4 text-[#3ca0de]" />
                                  )
                                })()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold leading-tight text-sm line-clamp-2">
                                  {repair.name}
                                </h4>
                                {isScreenRepair(repair.name) && (
                                  <div className="mt-1">
                                    <label className="text-[11px] text-gray-500 mr-2">Kies schermkwaliteit:</label>
                                    <Select
                                      value={qualitySelection[repair.id] || (visibleQuals?.[0]?.name || 'Origineel')}
                                      onValueChange={(val) => setQualitySelection(prev => ({ ...prev, [repair.id]: val }))}
                                    >
                                      <SelectTrigger className="rounded-lg ring-1 ring-gray-200 bg-white shadow-sm hover:shadow-md px-2 py-1 text-[11px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl shadow-md">
                                        {(visibleQuals || []).map(q => (
                                          <SelectItem key={q.name} value={q.name}>
                                            {q.name} — €{Number(q.price || 0)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                {!isScreenRepair(repair.name) && (
                                  <p className="text-[11px] text-gray-500">Klaar terwijl u wacht</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                              <div className="text-left leading-tight">
                                <span className="block text-base font-bold text-[#3ca0de]">
                                  {displayPrice > 0 ? `€${displayPrice}` : "Op aanvraag"}
                                </span>
                                {displayPrice > 0 && <span className="text-[10px] text-gray-400">incl. BTW</span>}
                              </div>
                              <Button
                                size="sm"
                                className="self-end"
                                variant={inCart ? "secondary" : "default"}
                                disabled={inCart || displayPrice <= 0}
                                onClick={() => addRepair(repair)}
                              >
                                {inCart ? "Toegevoegd" : "Toevoegen"}
                              </Button>
                            </div>
                          </Card>
                        )
                      })}
                  </div>
                  {repairs.filter(r => r.deviceId === selectedDevice?.id).length === 0 && (
                    <p className="text-center text-gray-500">Geen reparaties gevonden.</p>
                  )}
                </div>
              )}
            </>
          )}
            </div>
          </Card>

          {/* Selection / Winkelmandje Card */}
          <Card className="p-6 border shadow-sm bg-white lg:sticky lg:top-6">
            <h3 className="text-xl font-bold mb-4">Uw selectie</h3>

            {selectedRepairs.length === 0 ? (
              <p className="text-gray-500">Nog geen reparaties geselecteerd. Kies een toestel en voeg reparaties toe.</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {selectedRepairs.map((item) => (
                    <div key={`${item.deviceId}-${item.repairId}`} className="flex items-start justify-between border rounded-lg p-3">
                      <div>
                        <div className="text-sm text-gray-500">{item.brandName} • {item.deviceName}</div>
                        <div className="font-medium">{item.repairName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-[#3ca0de]">€{Number(item.price || 0)}</div>
                        <button
                          className="text-gray-400 hover:text-red-600"
                          aria-label="Verwijderen"
                          onClick={() => removeRepair(item.deviceId, item.repairId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotaal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Korting {selectedRepairs.length >= 2 ? "(2+ reparaties)" : ""}</span>
                    <span className={discount > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                      {discount > 0 ? `-€${discount.toFixed(2)}` : "€0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Totaal</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <Button variant="outline" onClick={clearRepairs}>Leegmaken</Button>
                </div>

                <div className="text-xs text-gray-500">
                  Tip: U kunt gerust doorgaan met kiezen van een ander merk of toestel. De selectie blijft bewaard.
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </section>
  )
}
    