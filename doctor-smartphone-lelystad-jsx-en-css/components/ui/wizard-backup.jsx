"use client"
import { useEffect, useState, useMemo } from 'react'
import { Search, ChevronRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

export default function Wizard() {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [brands, setBrands] = useState([])
  const [devices, setDevices] = useState([])
  const [repairs, setRepairs] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [highlightedRepair, setHighlightedRepair] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load all data on mount
  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        setError(null)
        console.log('🔄 Starting data fetch...')
        const startTime = Date.now()
        
        // Fetch with timeout
        const fetchWithTimeout = (url, timeout = 5000) => {
          return Promise.race([
            fetchJSON(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ])
        }
        
        const [brandsData, devicesData, repairsData] = await Promise.all([
          fetchWithTimeout('/api/brands', 10000),
          fetchWithTimeout('/api/devices', 10000),
          fetchWithTimeout('/api/repairs', 10000)
        ])
        
        const elapsed = Date.now() - startTime
        console.log(`✅ Data loaded in ${elapsed}ms`)
        
        if (mounted) {
          setBrands(brandsData)
          setDevices(devicesData)
          setRepairs(repairsData)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('❌ Failed to load data:', err)
        if (mounted) {
          setError(err.message)
          // Fallback to empty data if API fails
          setBrands([])
          setDevices([])
          setRepairs([])
          setIsLoading(false)
        }
      }
    }
    
    fetchData()
    return () => { mounted = false }
  }, [])

  // Global search across all data
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { brands: [], devices: [], repairs: [] }
    }

    const query = searchQuery.toLowerCase()
    
    const matchedBrands = brands.filter(b => 
      b.name.toLowerCase().includes(query)
    )
    
    const matchedDevices = devices.filter(d => 
      d.name.toLowerCase().includes(query)
    )
    
    const matchedRepairs = repairs.filter(r => 
      r.name.toLowerCase().includes(query)
    ).map(repair => {
      const device = devices.find(d => d.id === repair.deviceId)
      const brand = device ? brands.find(b => b.id === device.brandId) : null
      return { ...repair, device, brand }
    })
    
    return { brands: matchedBrands, devices: matchedDevices, repairs: matchedRepairs }
  }, [searchQuery, brands, devices, repairs])

  // Current step data
  const currentBrands = useMemo(() => {
    if (searchQuery.trim()) return searchResults.brands
    return brands
  }, [searchQuery, brands, searchResults.brands])

  const currentDevices = useMemo(() => {
    if (searchQuery.trim()) return searchResults.devices
    if (!selectedBrand) return []
    return devices.filter(d => d.brandId === selectedBrand.id)
  }, [searchQuery, selectedBrand, devices, searchResults.devices])

  const currentRepairs = useMemo(() => {
    if (searchQuery.trim()) return searchResults.repairs
    if (!selectedDevice) return []
    return repairs.filter(r => r.deviceId === selectedDevice.id)
  }, [searchQuery, selectedDevice, repairs, searchResults.repairs])

  // Handlers
  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand)
    setSelectedDevice(null)
    setHighlightedRepair(null)
    setSearchQuery('')
    setStep(2)
  }

  const handleDeviceSelect = (device) => {
    const brand = brands.find(b => b.id === device.brandId)
    setSelectedBrand(brand)
    setSelectedDevice(device)
    setHighlightedRepair(null)
    setSearchQuery('')
    setStep(3)
  }

  const handleRepairSelect = (repair) => {
    const device = devices.find(d => d.id === repair.deviceId)
    const brand = device ? brands.find(b => b.id === device.brandId) : null
    
    setSelectedBrand(brand)
    setSelectedDevice(device)
    setHighlightedRepair(repair.id)
    setSearchQuery('')
    setStep(3)
  }

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) {
      setStep(1)
    } else if (targetStep === 2 && selectedBrand) {
      setStep(2)
    } else if (targetStep === 3 && selectedDevice) {
      setStep(3)
    }
  }

  const handleBackToStep = (targetStep) => {
    if (targetStep === 1) {
      setSelectedBrand(null)
      setSelectedDevice(null)
      setHighlightedRepair(null)
      setStep(1)
    } else if (targetStep === 2) {
      setSelectedDevice(null)
      setHighlightedRepair(null)
      setStep(2)
    }
  }

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-500 mb-4 text-lg">Er is een fout opgetreden bij het laden van de gegevens.</p>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <Button onClick={() => window.location.reload()}>Probeer opnieuw</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Vind Uw Reparatie</h2>
          <p className="text-xl text-muted-foreground">Kies uw merk, toestel en bekijk de prijzen</p>
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => handleStepClick(1)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
              step === 1
                ? 'bg-[#3ca0de] text-white shadow-lg scale-105'
                : step > 1
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step > 1 && <Check className="w-5 h-5" />}
            <span>1. Merken</span>
          </button>

          <ChevronRight className="w-5 h-5 text-gray-400" />

          <button
            onClick={() => handleStepClick(2)}
            disabled={!selectedBrand}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
              step === 2
                ? 'bg-[#3ca0de] text-white shadow-lg scale-105'
                : step > 2 && selectedBrand
                ? 'bg-green-500 text-white hover:bg-green-600'
                : selectedBrand
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step > 2 && <Check className="w-5 h-5" />}
            <span>2. Toestellen</span>
          </button>

          <ChevronRight className="w-5 h-5 text-gray-400" />

          <button
            onClick={() => handleStepClick(3)}
            disabled={!selectedDevice}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
              step === 3
                ? 'bg-[#3ca0de] text-white shadow-lg scale-105'
                : selectedDevice
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>3. Reparaties</span>
          </button>
        </div>

        {/* Breadcrumb (selected path) */}
        {(selectedBrand || selectedDevice) && (
          <div className="text-center mb-6 text-sm text-muted-foreground">
            {selectedBrand && <span className="font-semibold text-[#3ca0de]">{selectedBrand.name}</span>}
            {selectedDevice && (
              <>
                <ChevronRight className="inline w-4 h-4 mx-2" />
                <span className="font-semibold text-[#3ca0de]">{selectedDevice.name}</span>
              </>
            )}
          </div>
        )}

        {/* Global Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek merk, toestel of reparatie... (bijv. iPhone 15, Samsung, Batterij)"
              className="pl-12 h-14 text-lg border-2 focus:border-[#3ca0de]"
            />
          </div>
        </div>

        {/* Search Results (when searching) */}
        {searchQuery.trim() && (
          <div className="space-y-8">
            {/* Device results */}
            {searchResults.devices.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-[#3ca0de] text-white px-3 py-1 rounded-full text-sm">
                    {searchResults.devices.length}
                  </span>
                  Toestellen gevonden
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.devices.map((device) => {
                    const brand = brands.find(b => b.id === device.brandId)
                    return (
                      <Card
                        key={device.id}
                        onClick={() => handleDeviceSelect(device)}
                        className="cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all overflow-hidden group p-4"
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-3">
                          {device.imageUrl && device.imageUrl !== '/placeholder.svg' ? (
                            <img src={device.imageUrl} alt={device.name} className="w-full h-full object-contain p-4" />
                          ) : (
                            <span className="text-3xl font-bold text-gray-300">{device.name.substring(0, 2)}</span>
                          )}
                        </div>
                        <p className="font-semibold text-center group-hover:text-[#3ca0de] transition-colors">
                          {device.name}
                        </p>
                        {brand && (
                          <p className="text-xs text-muted-foreground text-center mt-1">{brand.name}</p>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Repair results */}
            {searchResults.repairs.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-[#3ca0de] text-white px-3 py-1 rounded-full text-sm">
                    {searchResults.repairs.length}
                  </span>
                  Reparaties gevonden
                </h3>
                <div className="max-w-3xl mx-auto space-y-3">
                  {searchResults.repairs.map((repair) => (
                    <Card
                      key={repair.id}
                      onClick={() => handleRepairSelect(repair)}
                      className="p-4 hover:border-[#3ca0de] hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{repair.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {repair.device?.name} ({repair.brand?.name})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#3ca0de]">€{repair.price}</p>
                          <p className="text-xs text-muted-foreground">incl. BTW</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Brand results */}
            {searchResults.brands.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-[#3ca0de] text-white px-3 py-1 rounded-full text-sm">
                    {searchResults.brands.length}
                  </span>
                  Merken gevonden
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.brands.map((brand) => (
                    <Card
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand)}
                      className="cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all overflow-hidden group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                        {brand.imageUrl && brand.imageUrl !== '/placeholder.svg' ? (
                          <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-4xl font-bold text-[#3ca0de]">{brand.name[0]}</span>
                        )}
                      </div>
                      <div className="p-3 border-t text-center">
                        <p className="font-semibold group-hover:text-[#3ca0de] transition-colors">{brand.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchResults.brands.length === 0 && 
             searchResults.devices.length === 0 && 
             searchResults.repairs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Geen resultaten gevonden voor "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">Probeer een ander zoekwoord</p>
              </div>
            )}
          </div>
        )}

        {/* Step Content (when not searching) */}
        {!searchQuery.trim() && (
          <div>
            {/* Step 1: Brands */}
            {step === 1 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Kies een merk</h3>
                {currentBrands.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">Geen merken gevonden.</p>
                    <p className="text-sm text-muted-foreground mt-2">Er zijn momenteel geen merken beschikbaar in de database.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {currentBrands.map((brand) => (
                    <Card
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand)}
                      className="cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all overflow-hidden group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                        {brand.imageUrl && brand.imageUrl !== '/placeholder.svg' ? (
                          <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-4xl font-bold text-[#3ca0de]">{brand.name[0]}</span>
                        )}
                      </div>
                      <div className="p-3 border-t text-center">
                        <p className="font-semibold group-hover:text-[#3ca0de] transition-colors">{brand.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
                )}
              </div>
            )}

            {/* Step 2: Devices */}
            {step === 2 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Kies een toestel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentDevices.map((device) => (
                    <Card
                      key={device.id}
                      onClick={() => handleDeviceSelect(device)}
                      className="cursor-pointer hover:border-[#3ca0de] hover:shadow-lg transition-all overflow-hidden group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                        {device.imageUrl && device.imageUrl !== '/placeholder.svg' ? (
                          <img src={device.imageUrl} alt={device.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-3xl font-bold text-gray-300">{device.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <div className="p-4 border-t">
                        <p className="font-semibold text-center group-hover:text-[#3ca0de] transition-colors">
                          {device.name}
                        </p>
                        {device.type && (
                          <p className="text-xs text-muted-foreground text-center mt-1 capitalize">{device.type}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                {currentDevices.length === 0 && (
                  <p className="text-center text-muted-foreground mt-8">
                    Geen toestellen gevonden voor {selectedBrand?.name}
                  </p>
                )}
                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={() => handleBackToStep(1)}>
                    Terug naar merken
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Repairs */}
            {step === 3 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Kies een reparatie</h3>
                <div className="max-w-3xl mx-auto space-y-3">
                  {currentRepairs.map((repair) => (
                    <Card
                      key={repair.id}
                      className={`p-6 transition-all ${
                        highlightedRepair === repair.id
                          ? 'border-[#3ca0de] border-2 shadow-lg bg-blue-50'
                          : 'hover:border-[#3ca0de] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{repair.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">Voor {selectedDevice?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-[#3ca0de]">€{repair.price}</p>
                          <p className="text-xs text-muted-foreground">incl. BTW</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {currentRepairs.length === 0 && (
                  <p className="text-center text-muted-foreground mt-8">
                    Geen reparaties gevonden voor {selectedDevice?.name}
                  </p>
                )}
                <div className="mt-8 text-center space-x-4">
                  <Button variant="outline" onClick={() => handleBackToStep(2)}>
                    Terug naar toestellen
                  </Button>
                  <Button variant="outline" onClick={() => handleBackToStep(1)}>
                    Terug naar merken
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
