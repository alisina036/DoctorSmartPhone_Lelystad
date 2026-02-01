"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Smartphone, Laptop, Tablet, ChevronRight, Check, Wrench, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Helper to fetch data safely with timeout
async function fetchData(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`Failed to fetch ${url}`)
    return res.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export default function Wizard() {
  // State for data
  const [brands, setBrands] = useState([])
  const [devices, setDevices] = useState([])
  const [repairs, setRepairs] = useState([])
  
  // State for UI
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selection state
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)

  // Load data on mount
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      try {
        console.log("Wizard: Starting data load...")
        setIsLoading(true)
        setError(null)
        
        // Safety timeout to ensure we don't get stuck in loading state
        const safetyTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            console.warn("Wizard: Safety timeout triggered")
            setIsLoading(false)
            setError("Het laden duurt langer dan verwacht. Controleer uw verbinding.")
          }
        }, 8000)

        // Fetch all data in parallel
        const [brandsData, devicesData, repairsData] = await Promise.all([
          fetchData("/api/brands"),
          fetchData("/api/devices"),
          fetchData("/api/repairs")
        ])
        
        clearTimeout(safetyTimeout)

        if (mounted) {
          console.log("Wizard: Data loaded successfully", { 
            brands: brandsData.length, 
            devices: devicesData.length, 
            repairs: repairsData.length 
          })
          setBrands(brandsData)
          setDevices(devicesData)
          setRepairs(repairsData)
        }
      } catch (err) {
        console.error("Wizard data loading error:", err)
        if (mounted) {
          setError("Kon gegevens niet laden. Controleer uw internetverbinding of probeer het later opnieuw.")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
    
    return () => { mounted = false }
  }, [])

  // Filter logic
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    if (!query) return null

    const matchedBrands = brands.filter(b => b.name.toLowerCase().includes(query))
    const matchedDevices = devices.filter(d => d.name.toLowerCase().includes(query))
    // Find repairs that match name OR belong to a matched device
    const matchedRepairs = repairs.filter(r => {
      const device = devices.find(d => d.id === r.deviceId)
      const deviceName = device?.name.toLowerCase() || ""
      return r.name.toLowerCase().includes(query) || deviceName.includes(query)
    })

    return {
      brands: matchedBrands,
      devices: matchedDevices,
      repairs: matchedRepairs
    }
  }, [searchQuery, brands, devices, repairs])

  // Step navigation handlers
  const goToStep = (newStep) => {
    if (newStep < step) {
      // Going back
      setStep(newStep)
      if (newStep === 1) {
        setSelectedBrand(null)
        setSelectedDevice(null)
      } else if (newStep === 2) {
        setSelectedDevice(null)
      }
    } else {
      // Going forward - only allowed if selection exists
      if (newStep === 2 && selectedBrand) setStep(2)
      if (newStep === 3 && selectedDevice) setStep(3)
    }
  }

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand)
    setSelectedDevice(null)
    setSearchQuery("")
    setStep(2)
  }

  const handleDeviceSelect = (device) => {
    // Ensure we have the brand for this device (useful if selected via search)
    if (!selectedBrand || selectedBrand.id !== device.brandId) {
      const brand = brands.find(b => b.id === device.brandId)
      setSelectedBrand(brand)
    }
    setSelectedDevice(device)
    setSearchQuery("")
    setStep(3)
  }

  // Get current view data based on step
  const currentViewData = useMemo(() => {
    if (step === 1) return brands
    if (step === 2) return devices.filter(d => d.brandId === selectedBrand?.id)
    if (step === 3) return repairs.filter(r => r.deviceId === selectedDevice?.id)
    return []
  }, [step, brands, devices, repairs, selectedBrand, selectedDevice])

  // Render helpers
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 w-full max-w-3xl mx-auto">
      {[
        { num: 1, label: "Merk" },
        { num: 2, label: "Toestel" },
        { num: 3, label: "Reparatie" }
      ].map((s, idx) => (
        <div key={s.num} className="flex items-center">
          <div 
            onClick={() => goToStep(s.num)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all",
              step === s.num ? "bg-[#3ca0de] text-white shadow-md" : 
              step > s.num ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
            )}
          >
            <span className="font-bold">{step > s.num ? <Check size={16} /> : s.num}</span>
            <span className="hidden sm:inline font-medium">{s.label}</span>
          </div>
          {idx < 2 && (
            <div className={cn("h-1 w-8 sm:w-16 mx-2 rounded", step > s.num ? "bg-green-500" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ca0de] mx-auto mb-4"></div>
        <p className="text-gray-500">Wizzard laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Opnieuw proberen</Button>
      </div>
    )
  }

  return (
    <section className="py-12 bg-white rounded-xl shadow-sm border border-gray-100 my-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reparatie Wizard</h2>
          <p className="text-gray-500">Vind direct de juiste reparatie voor uw device</p>
        </div>

        {renderStepIndicator()}

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            type="text"
            placeholder="Zoek op merk, model of reparatie (bv. iPhone 13 scherm)..."
            className="pl-10 h-12 text-lg border-gray-200 focus:border-[#3ca0de] focus:ring-[#3ca0de]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {searchQuery ? (
            // Search Results View
            <div className="space-y-8">
              {filteredData?.devices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[#3ca0de]">Toestellen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredData.devices.map(device => (
                      <Card 
                        key={device.id}
                        onClick={() => handleDeviceSelect(device)}
                        className="p-4 cursor-pointer hover:border-[#3ca0de] hover:shadow-md transition-all flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                          {device.type === 'laptop' ? <Laptop size={24} className="text-gray-400" /> :
                           device.type === 'tablet' ? <Tablet size={24} className="text-gray-400" /> :
                           <Smartphone size={24} className="text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-xs text-gray-500">Klik om reparaties te zien</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {filteredData?.brands.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[#3ca0de]">Merken</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredData.brands.map(brand => (
                      <Card 
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand)}
                        className="p-4 cursor-pointer hover:border-[#3ca0de] hover:shadow-md transition-all text-center"
                      >
                        <p className="font-medium">{brand.name}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {filteredData?.devices.length === 0 && filteredData?.brands.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Geen resultaten gevonden voor "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            // Step Views
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {step === 1 && (
                <div>
                  {currentViewData.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Geen merken gevonden.</p>
                      <Button variant="link" onClick={() => window.location.reload()}>Pagina verversen</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {currentViewData.map(brand => (
                        <Card 
                          key={brand.id}
                          onClick={() => handleBrandSelect(brand)}
                          className="group p-6 cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all flex flex-col items-center justify-center gap-4"
                        >
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            {brand.imageUrl ? (
                              <img src={brand.imageUrl} alt={brand.name} className="w-10 h-10 object-contain" />
                            ) : (
                              <span className="text-xl font-bold text-[#3ca0de]">{brand.name.substring(0,1)}</span>
                            )}
                          </div>
                          <span className="font-semibold text-gray-700 group-hover:text-[#3ca0de]">{brand.name}</span>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" onClick={() => goToStep(1)} className="gap-2">
                      <ArrowLeft size={16} /> Terug naar merken
                    </Button>
                    <h3 className="text-xl font-bold">Kies uw {selectedBrand?.name} model</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentViewData.map(device => (
                      <Card 
                        key={device.id}
                        onClick={() => handleDeviceSelect(device)}
                        className="p-4 cursor-pointer hover:border-[#3ca0de] hover:shadow-md transition-all flex items-center gap-4"
                      >
                         <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                          {device.imageUrl ? (
                             <img src={device.imageUrl} alt={device.name} className="w-full h-full object-contain" />
                          ) : (
                            device.type === 'laptop' ? <Laptop size={24} className="text-gray-400" /> :
                            device.type === 'tablet' ? <Tablet size={24} className="text-gray-400" /> :
                            <Smartphone size={24} className="text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium">{device.name}</span>
                      </Card>
                    ))}
                  </div>
                  {currentViewData.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Geen toestellen gevonden voor dit merk.</p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" onClick={() => goToStep(2)} className="gap-2">
                      <ArrowLeft size={16} /> Terug naar toestellen
                    </Button>
                    <h3 className="text-xl font-bold">Reparaties voor {selectedDevice?.name}</h3>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-4 auto-rows-fr">
                    {currentViewData.map(repair => (
                      <Card key={repair.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#3ca0de]">
                            <Wrench size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{repair.name}</h4>
                            <p className="text-sm text-gray-500">Klaar terwijl u wacht</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-xl font-bold text-[#3ca0de]">€{repair.price}</span>
                          <span className="text-xs text-gray-400">incl. BTW</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {currentViewData.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Geen reparaties gevonden voor dit toestel.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
