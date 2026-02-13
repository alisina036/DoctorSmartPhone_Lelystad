'use client'

import { useState, useEffect, useRef } from 'react'
import { Printer, AlertCircle, CheckCircle, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DymoPrintButton, DymoStatusCard } from '@/components/admin/dymo-print-button'

/**
 * Kassa Component met DYMO Label Print Integratie
 * Scannen van barcodes, toevoegen van producten en direct printen van labels
 */
export function KassaDymoIntegration({ products = [] }) {
  const [cart, setCart] = useState([])
  const [barcodeScanInput, setBarcodeScanInput] = useState('')
  const [total, setTotal] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const searchInputRef = useRef(null)
  const barcodeInputRef = useRef(null)

  // Bereken totaal
  useEffect(() => {
    const sum = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    setTotal(sum)
  }, [cart])

  // Focus op barcode input bij laden
  useEffect(() => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 100)
  }, [])

  // Barcode scanner logic
  const handleBarcodeScan = (e) => {
    const barcode = e.target.value.trim()

    if (barcode.length >= 3) {
      // Zoek product op barcode
      const product = products.find(p => 
        p.barcode === barcode || p.sku === barcode
      )

      if (product) {
        addProductToCart(product)
        setBarcodeScanInput('')
        // Focus terugzetten op input
        setTimeout(() => {
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus()
          }
        }, 0)
      }
    }
  }

  // Product toevoegen aan kar
  const addProductToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id)
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  // Product verwijderen uit kar
  const removeProductFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId))
  }

  // Hoeveelheid wijzigen
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Print label voor product
  const handlePrintLabel = (product) => {
    setSelectedProduct(product)
    setShowPrintDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* DYMO Status */}
      <DymoStatusCard />

      {/* Barcode Scanner Input */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Barcode Scanner
          </CardTitle>
          <CardDescription>
            Scan barcodes om producten aan de kar toe te voegen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeScanInput}
            onChange={(e) => setBarcodeScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeScan(e)
              }
            }}
            placeholder="Scan barcode hier..."
            className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-lg font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </CardContent>
      </Card>

      {/* Kar */}
      <Card>
        <CardHeader>
          <CardTitle>
            Winkelwagen ({cart.length} artikel{cart.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Scan een barcode of voeg producten toe
            </p>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Barcode: {item.barcode} | SKU: {item.sku}
                      </p>
                      <p className="text-sm text-gray-600">
                        €{parseFloat(item.price).toFixed(2)} per stuk
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Hoeveelheid */}
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Totaal voor item */}
                      <div className="w-24 text-right font-medium">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>

                      {/* Print Button */}
                      <Button
                        onClick={() => handlePrintLabel(item)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>

                      {/* Verwijderen */}
                      <Button
                        onClick={() => removeProductFromCart(item._id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaal */}
              <div className="mt-4 pt-4 border-t-2 flex justify-between items-center">
                <span className="text-lg font-bold">TOTAAL:</span>
                <span className="text-2xl font-bold text-green-600">
                  €{total.toFixed(2)}
                </span>
              </div>

              {/* Actie Knoppen */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setCart([])}
                  variant="outline"
                  className="flex-1"
                >
                  Kar Legen
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Afrekenen
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      {selectedProduct && (
        <PrintLabelDialog
          product={selectedProduct}
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
        />
      )}

      {/* Instructies */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">
            Hoe werkt het?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>1. DYMO Verbinding:</strong> De DYMO LabelWriter 450 moet aangesloten zijn en DYMO Connect moet draaien.
          </p>
          <p>
            <strong>2. Scannen:</strong> Scan barcodes met je scanner. Producten worden automatisch aan de kar toegevoegd.
          </p>
          <p>
            <strong>3. Labelen:</strong> Klik de printknop naast elk product om labels te printen (bijv. voor voorraad).
          </p>
          <p>
            <strong>4. Verkoop:</strong> Klik "Afrekenen" om de transactie te registreren en de voorraad bij te werken.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PrintLabelDialog({ product, open, onOpenChange }) {
  const [quantity, setQuantity] = useState(1)
  const [printing, setPrinting] = useState(false)
  const [result, setResult] = useState(null)

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const response = await fetch('/api/dymo/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData: {
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            sku: product.sku
          },
          quantity
        })
      })

      const data = await response.json()
      if (response.ok) {
        setResult({ success: true, message: data.message })
        setTimeout(() => onOpenChange(false), 1500)
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Label Printen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div className={`flex gap-3 p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </span>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Product:</p>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">Barcode: {product.barcode}</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Aantal labels</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={printing}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={printing}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={printing}
                  className="flex-1"
                >
                  {printing ? 'Printen...' : 'Printen'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default KassaDymoIntegration
