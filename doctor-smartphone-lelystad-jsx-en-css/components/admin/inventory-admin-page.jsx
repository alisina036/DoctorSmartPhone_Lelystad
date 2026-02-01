'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, Plus, Edit, Trash2, Barcode, AlertTriangle, TrendingUp, TrendingDown, Printer } from 'lucide-react'
import AdminNav from './admin-nav'
import AdminHeader from './admin-header'
import DeviceSelectorDropdown from './device-selector-dropdown'
import PrintLabelDialog from './print-label-dialog'
import { useToast } from '@/hooks/use-toast'
import ConfirmDialog from './confirm-dialog'

export default function InventoryAdminPage() {
  const searchParams = useSearchParams()
  const initialSearch = useMemo(() => searchParams.get('search') || '', [searchParams])
  const productIdParam = useMemo(() => searchParams.get('productId'), [searchParams])
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [deviceModels, setDeviceModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [printLabelProduct, setPrintLabelProduct] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Verwijderen',
    onConfirm: null
  })
  const [filters, setFilters] = useState({
    categoryType: '',
    deviceModelId: '',
    search: initialSearch,
    lowStock: false
  })
  const [openedFromParam, setOpenedFromParam] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryType: '',
    deviceModelId: '',
    stock: 0,
    minStock: 5,
    maxStock: 100,
    purchasePrice: 0,
    salePrice: 0,
    location: '',
    description: '',
    images: []
  })

  useEffect(() => {
    loadData()
  }, [filters])

  useEffect(() => {
    if (!productIdParam || openedFromParam || products.length === 0) return
    const product = products.find((p) => p._id === productIdParam)
    if (product) {
      handleEdit(product)
      setOpenedFromParam(true)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }, [productIdParam, openedFromParam, products])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Laad device models
      const deviceRes = await fetch('/api/devices')
      const deviceData = await deviceRes.json()
      console.log('Devices loaded:', deviceData)
      setDeviceModels(Array.isArray(deviceData) ? deviceData : deviceData.devices || [])
      
      // Laad products met filters
      const params = new URLSearchParams()
      if (filters.categoryType) params.append('categoryType', filters.categoryType)
      if (filters.deviceModelId) params.append('deviceModelId', filters.deviceModelId)
      if (filters.search) params.append('search', filters.search)
      if (filters.lowStock) params.append('lowStock', 'true')
      
      const prodRes = await fetch(`/api/inventory/products?${params}`)
      const prodData = await prodRes.json()
      // Sorteer alfabetisch op naam
      const sorted = (prodData || []).sort((a, b) => a.name.localeCompare(b.name, 'nl'))
      setProducts(sorted)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = '/api/inventory/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const data = editingProduct 
        ? { ...formData, id: editingProduct._id }
        : formData
      
      // Verwijder lege deviceModelId om validation errors te voorkomen
      if (data.deviceModelId === '') {
        delete data.deviceModelId
      }
      
      console.log('Submitting data:', data)
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          console.error('API Error:', errorData)
        } catch (jsonError) {
          const text = await res.text()
          console.error('Response was not JSON:', text)
          errorMessage = `Server error: ${text.substring(0, 200)}`
        }
        toast({
          variant: 'destructive',
          title: 'Opslaan mislukt',
          description: errorMessage
        })
        return
      }
      
      const result = await res.json()
      console.log('Product saved:', result)
      toast({
        title: editingProduct ? 'Product bijgewerkt' : 'Product toegevoegd',
        description: editingProduct ? 'De wijzigingen zijn opgeslagen.' : 'Het product is toegevoegd.'
      })
      setShowAddForm(false)
      setEditingProduct(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: error.message
      })
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/inventory/products?id=${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        loadData()
        toast({
          title: 'Product verwijderd',
          description: 'Het product is verwijderd.'
        })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        variant: 'destructive',
        title: 'Verwijderen mislukt',
        description: 'Er ging iets mis bij het verwijderen.'
      })
    }
  }

  const confirmDelete = (id, name) => {
    setConfirmDialog({
      open: true,
      title: 'Product verwijderen',
      description: `Weet je zeker dat je ${name} wilt verwijderen?`,
      confirmLabel: 'Verwijderen',
      onConfirm: () => handleDelete(id)
    })
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      sku: product.sku || '',
      categoryType: product.categoryType || '',
      deviceModelId: product.deviceModelId?._id || '',
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      location: product.location || '',
      description: product.description || '',
      images: product.images || []
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      sku: '',
      categoryType: '',
      deviceModelId: '',
      stock: 0,
      minStock: 5,
      maxStock: 100,
      purchasePrice: 0,
      salePrice: 0,
      location: '',
      description: '',
      images: []
    })
  }

  const generateBarcode = () => {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const barcode = `${timestamp.slice(-9)}${random}`
    setFormData({ ...formData, barcode })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Voorraadbeheer" count={`${products.length} producten`} isPending={loading} />
                <AdminNav />
                {/* Add Product Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingProduct(null)
              resetForm()
            }}
            className="bg-[#3ca0de] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2d8bc7] transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuw Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Zoeken..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
            />
            
            <select
              value={filters.categoryType}
              onChange={(e) => setFilters({ ...filters, categoryType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
            >
              <option value="">Alle categorieën</option>
              <option value="accessoire">Accessoires</option>
              <option value="onderdeel">Toestel onderdeel</option>
            </select>
            
            <select
              value={filters.deviceModelId}
              onChange={(e) => setFilters({ ...filters, deviceModelId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
            >
              <option value="">Alle toestellen</option>
              {deviceModels.map(device => (
                <option key={device._id} value={device._id}>
                  {device.name}
                </option>
              ))}
            </select>
            
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                className="w-4 h-4 text-[#3ca0de] focus:ring-[#3ca0de] rounded"
              />
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Lage voorraad</span>
            </label>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Product Bewerken' : 'Nieuw Product Toevoegen'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Productnaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                      placeholder="Scan of typ barcode"
                    />
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                    placeholder="Automatisch gegenereerd"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorie *
                  </label>
                  <select
                    required
                    value={formData.categoryType}
                    onChange={(e) => setFormData({ ...formData, categoryType: e.target.value, deviceModelId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  >
                    <option value="">Selecteer categorie</option>
                    <option value="accessoire">Accessoires</option>
                    <option value="onderdeel">Toestel onderdeel</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geschikt voor toestel (optioneel)
                  </label>
                  <DeviceSelectorDropdown
                    value={formData.deviceModelId}
                    onChange={(value) => setFormData({ ...formData, deviceModelId: value })}
                    devices={deviceModels}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voorraad *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. Voorraad *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max. Voorraad
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inkoopprijs (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verkoopprijs (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Locatie
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                    placeholder="Bijv. Schap A-3"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#3ca0de] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2d8bc7] transition-colors"
                >
                  {editingProduct ? 'Bijwerken' : 'Toevoegen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingProduct(null)
                    resetForm()
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ca0de] mx-auto"></div>
              <p className="text-gray-600 mt-4">Producten laden...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Geen producten gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode/SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categorie
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voorraad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inkoop
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verkoop
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marge
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const margin = product.salePrice - product.purchasePrice
                    const marginPercentage = product.purchasePrice > 0 
                      ? ((margin / product.purchasePrice) * 100).toFixed(1)
                      : 0
                    const isLowStock = product.stock <= product.minStock
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.deviceModelId && (
                                <div className="text-sm text-gray-500">
                                  {product.deviceModelId.name}
                                </div>
                              )}
                              {product.location && (
                                <div className="text-xs text-gray-400">
                                  📍 {product.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-mono">
                            {product.barcode || '-'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {product.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {product.categoryType === 'accessoire' ? 'Accessoires' : 'Toestel onderdeel'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            isLowStock 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isLowStock && <AlertTriangle className="w-4 h-4" />}
                            {product.stock}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Min: {product.minStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          €{product.purchasePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          €{product.salePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                            margin > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {margin > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            €{margin.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {marginPercentage}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPrintLabelProduct(product)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Print Label"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Bewerken"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(product._id, product.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Totaal Producten</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <Package className="w-12 h-12 text-[#3ca0de] opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Totale Waarde</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  €{products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lage Voorraad</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {products.filter(p => p.stock <= p.minStock).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Gem. Marge</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.length > 0 
                    ? (products.reduce((sum, p) => {
                        const margin = p.purchasePrice > 0 
                          ? ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100
                          : 0
                        return sum + margin
                      }, 0) / products.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-[#3ca0de] opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Print Label Dialog */}
      {printLabelProduct && (
        <PrintLabelDialog
          product={printLabelProduct}
          onClose={() => setPrintLabelProduct(null)}
        />
      )}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      />
    </div>
  )
}
