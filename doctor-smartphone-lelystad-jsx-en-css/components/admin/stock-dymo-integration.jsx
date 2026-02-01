'use client'

import { useState, useEffect } from 'react'
import { DymoPrintButton, DymoStatusCard } from '@/components/admin/dymo-print-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, AlertCircle, Loader } from 'lucide-react'

/**
 * Voorraad Component met DYMO Print Mogelijkheden
 * Toon producten met stock en print labels bulk
 */
export function StockDymoIntegration() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handlePrintSelected = async () => {
    if (selectedProducts.length === 0) return

    setPrinting(true)
    try {
      const itemsToPrint = products
        .filter(p => selectedProducts.includes(p._id))
        .map(p => ({
          product: {
            name: p.name,
            price: p.price,
            barcode: p.barcode,
            sku: p.sku
          },
          quantity: 1
        }))

      const response = await fetch('/api/dymo/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: itemsToPrint
        })
      })

      if (response.ok) {
        alert(`${selectedProducts.length} labels geprint!`)
        setSelectedProducts([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setPrinting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* DYMO Status */}
      <DymoStatusCard />

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Print */}
      {selectedProducts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} geselecteerd
            </CardTitle>
            <Button
              onClick={handlePrintSelected}
              disabled={printing}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              {printing ? 'Printen...' : 'Labels Printen'}
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product._id} className="hover:shadow-lg transition">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    SKU: {product.sku}
                  </CardDescription>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product._id)}
                  onChange={() => toggleProductSelection(product._id)}
                  className="w-4 h-4 mt-1"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Barcode:</span>
                  <br />
                  <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {product.barcode}
                  </code>
                </p>
                <p>
                  <span className="text-gray-600">Prijs:</span>
                  <br />
                  <span className="font-bold text-lg">€{parseFloat(product.price).toFixed(2)}</span>
                </p>
                <p>
                  <span className="text-gray-600">Voorraad:</span>
                  <br />
                  <span className={`font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {product.stock} stuks
                  </span>
                </p>
              </div>

              {/* Individual Print Button */}
              <DymoPrintButton
                product={{
                  name: product.name,
                  price: product.price,
                  barcode: product.barcode,
                  sku: product.sku
                }}
                quantity={product.stock}
                className="w-full"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Geen producten gevonden
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StockDymoIntegration
