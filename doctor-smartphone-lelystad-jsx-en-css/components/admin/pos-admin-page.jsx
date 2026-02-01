'use client'

import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Barcode, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Building2, X, Check, Printer } from 'lucide-react'
import AdminNav from './admin-nav'
import AdminHeader from './admin-header'
import { useToast } from '@/hooks/use-toast'
import ConfirmDialog from './confirm-dialog'

export default function POSAdminPage() {
  const { toast } = useToast()
  const [cart, setCart] = useState([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [selectedPayment, setSelectedPayment] = useState('Cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Bevestigen',
    onConfirm: null
  })
  const barcodeInputRef = useRef(null)

  const paymentMethods = [
    { id: 'Cash', label: 'Contant', icon: Banknote },
    { id: 'PIN', label: 'PIN', icon: CreditCard },
    { id: 'iDeal', label: 'iDeal', icon: Smartphone },
    { id: 'Bankoverschrijving', label: 'Overschrijving', icon: Building2 }
  ]

  useEffect(() => {
    loadProducts()
    // Focus barcode input on mount
    barcodeInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.deviceModelId?.name?.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/inventory/products')
      const data = await res.json()
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault()
    
    if (!barcodeInput.trim()) return
    
    // Zoek product op barcode
    const product = products.find(p => p.barcode === barcodeInput.trim())
    
    if (product) {
      addToCart(product)
      setBarcodeInput('')
    } else {
      toast({
        variant: 'destructive',
        title: 'Product niet gevonden',
        description: `Geen product gevonden met barcode: ${barcodeInput}`
      })
      setBarcodeInput('')
    }
  }

  const addToCart = (product) => {
    // Check voorraad
    const currentCartQty = cart.find(item => item.productId === product._id)?.quantity || 0
    
    if (product.stock <= currentCartQty) {
      toast({
        variant: 'destructive',
        title: 'Onvoldoende voorraad',
        description: `Voor ${product.name} zijn er ${product.stock} stuks beschikbaar.`
      })
      return
    }
    
    const existingItem = cart.find(item => item.productId === product._id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        deviceName: product.deviceModelId?.name,
        barcode: product.barcode,
        unitPrice: product.salePrice,
        quantity: 1,
        totalPrice: product.salePrice,
        stock: product.stock
      }])
    }
  }

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + change
        
        if (newQty <= 0) {
          return null
        }
        
        if (newQty > item.stock) {
          toast({
            variant: 'destructive',
            title: 'Onvoldoende voorraad',
            description: `Beschikbaar: ${item.stock} stuks.`
          })
          return item
        }
        
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
      }
      return item
    }).filter(Boolean))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Winkelwagen is leeg',
        description: 'Scan een product of zoek in de lijst.'
      })
      return
    }
    
    if (!selectedPayment) {
      toast({
        variant: 'destructive',
        title: 'Selecteer een betaalmethode',
        description: 'Kies een betaalmethode om af te rekenen.'
      })
      return
    }
    
    try {
      const totalAmount = getTotalAmount()
      // Prijs is al inclusief BTW, dus we berekenen BTW alleen informatief
      const totalIncludingBTW = totalAmount
      const btwPercentage = totalAmount / 1.21 * 0.21 // Terugrekenen naar BTW
      
      const payload = {
        items: cart,
        subtotal: totalAmount,
        discount: 0,
        tax: parseFloat(btwPercentage.toFixed(2)),
        total: totalAmount,
        paymentMethod: selectedPayment,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined
      }
      
      console.log('Checkout payload:', payload)
      
      const res = await fetch('/api/inventory/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      console.log('Response status:', res.status, res.statusText)
      
      let data
      try {
        data = await res.json()
      } catch (e) {
        const text = await res.text()
        console.error('Response was not JSON:', text)
        toast({
          variant: 'destructive',
          title: 'Server fout',
          description: text.substring(0, 200)
        })
        return
      }
      
      console.log('Checkout response:', data)
      
      if (res.ok) {
        setLastSale(data)
        setShowReceipt(true)
        setCart([])
        setCustomerInfo({ name: '', phone: '', email: '' })
        loadProducts() // Reload om updated stock te krijgen
      } else {
        console.error('Sale error:', data)
        toast({
          variant: 'destructive',
          title: 'Fout bij afrekenen',
          description: (data.error || 'Onbekende fout') + (data.details ? ` ${data.details}` : '')
        })
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      toast({
        variant: 'destructive',
        title: 'Fout bij afrekenen',
        description: error.message
      })
    }
  }

  const printReceipt = () => {
    // Open een nieuw venster voor de bon
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kassabon ${lastSale.saleNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          
          .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .shop-info {
            font-size: 10px;
            margin: 2px 0;
          }
          
          .section {
            margin: 10px 0;
            padding: 5px 0;
          }
          
          .section-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .line-item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          
          .item-name {
            flex: 1;
            padding-right: 5px;
          }
          
          .item-qty {
            min-width: 30px;
            text-align: right;
          }
          
          .item-price {
            min-width: 60px;
            text-align: right;
          }
          
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          
          .divider-thick {
            border-top: 2px solid #000;
            margin: 8px 0;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
          }
          
          .payment-info {
            text-align: center;
            margin: 10px 0;
            font-size: 11px;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 10px;
          }
          
          .thank-you {
            font-weight: bold;
            margin: 8px 0;
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">DOCTOR SMARTPHONE</div>
          <div class="shop-info">Lelystad</div>
          <div class="shop-info">Tel: 0320 410 140</div>
          <div class="shop-info">www.doctorsmartphone-lelystad.nl</div>
        </div>
        
        <div class="section">
          <div class="section-title">Bonnummer: ${lastSale.saleNumber}</div>
          <div style="font-size: 10px;">Datum: ${new Date(lastSale.createdAt).toLocaleString('nl-NL', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          ${lastSale.items.map(item => `
            <div class="line-item">
              <div class="item-name">${(() => {
                const deviceName = item.deviceName || item.productId?.deviceModelId?.name
                const productName = item.productId?.name || item.name
                return deviceName ? `${deviceName} - ${productName}` : productName
              })()}</div>
            </div>
            <div class="line-item" style="font-size: 10px;">
              <div class="item-qty">${item.quantity}x</div>
              <div>€${item.unitPrice.toFixed(2)}</div>
              <div class="item-price">€${(item.unitPrice * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="divider-thick"></div>
        
        <div class="total-line">
          <div>SUBTOTAAL (incl. BTW)</div>
          <div>€${(lastSale.subtotal || lastSale.total).toFixed(2)}</div>
        </div>
        
        ${lastSale.discount > 0 ? `
          <div class="total-line" style="font-size: 12px;">
            <div>KORTING</div>
            <div>-€${lastSale.discount.toFixed(2)}</div>
          </div>
        ` : ''}
        
        <div class="total-line" style="font-size: 11px; color: #666;">
          <div>waarvan BTW (21%)</div>
          <div>€${(lastSale.tax || 0).toFixed(2)}</div>
        </div>
        
        <div class="divider-thick"></div>
        
        <div class="total-line" style="font-size: 16px;">
          <div>TOTAAL</div>
          <div>€${(lastSale.total || lastSale.totalAmount || 0).toFixed(2)}</div>
        </div>
        
        <div class="payment-info">
          <div style="margin: 8px 0;">Betaald met: <strong>${lastSale.paymentMethod}</strong></div>
        </div>
        
        ${lastSale.customerName ? `
          <div class="divider"></div>
          <div class="section">
            <div class="section-title">Klantgegevens</div>
            <div style="font-size: 10px;">
              ${lastSale.customerName ? `<div>Naam: ${lastSale.customerName}</div>` : ''}
              ${lastSale.customerPhone ? `<div>Tel: ${lastSale.customerPhone}</div>` : ''}
              ${lastSale.customerEmail ? `<div>Email: ${lastSale.customerEmail}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="thank-you">Bedankt voor uw aankoop!</div>
          <div style="margin: 5px 0;">Reparaties • Verkoop • Accessoires</div>
          <div>www.doctorsmartphone-lelystad.nl</div>
          <div style="margin-top: 8px; font-size: 9px;">
            Retour mogelijk binnen 14 dagen<br>
            met originele bon en verpakking
          </div>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    
    // Wacht even zodat de content geladen is, dan print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const clearCart = () => {
    setConfirmDialog({
      open: true,
      title: 'Winkelwagen legen',
      description: 'Weet je zeker dat je de winkelwagen wilt legen?',
      confirmLabel: 'Legen',
      onConfirm: () => setCart([])
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Kassa / Point of Sale" count={`${cart.length} items in winkelwagen`} isPending={false} />        
        <AdminNav />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-[#3ca0de]" />
                Scannen & Zoeken
              </h2>
              
              {/* Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode of voer in..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#3ca0de] rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent text-lg"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#3ca0de] text-white rounded-lg font-semibold hover:bg-[#2d8bc7] transition-colors"
                >
                  Toevoegen
                </button>
              </form>
            </div>
            
            {/* Product Search */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek product op naam, barcode of SKU..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
              />
              
              {filteredProducts.length > 0 && (
                <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                  {filteredProducts.map(product => (
                    <button
                      key={product._id}
                      onClick={() => {
                        addToCart(product)
                        setSearchQuery('')
                      }}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-[#3ca0de] transition-colors text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                      <ConfirmDialog
                        open={confirmDialog.open}
                        title={confirmDialog.title}
                        description={confirmDialog.description}
                        confirmLabel={confirmDialog.confirmLabel}
                        onConfirm={confirmDialog.onConfirm}
                        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                      />
                          {product.deviceModelId?.name && (
                            <div className="text-sm text-gray-600">{product.deviceModelId.name}</div>
                          )}
                          <div className="text-sm text-gray-500">
                            {product.barcode} • {product.categoryId?.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Voorraad: {product.stock}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#3ca0de]">
                            €{product.salePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Shopping Cart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Winkelwagen</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Wissen
                  </button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Winkelwagen is leeg</p>
                  <p className="text-sm text-gray-400 mt-1">Scan een barcode of zoek een product</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.deviceName && (
                          <div className="text-sm text-gray-600">{item.deviceName}</div>
                        )}
                        <div className="text-sm text-gray-500">€{item.unitPrice.toFixed(2)} per stuk</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <div className="font-bold text-gray-900">
                          €{(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Checkout */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Klantgegevens (optioneel)</h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Naam"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                />
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Telefoonnummer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                />
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Betaalmethode</h2>
              
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(method => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedPayment === method.id
                          ? 'border-[#3ca0de] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        selectedPayment === method.id ? 'text-[#3ca0de]' : 'text-gray-400'
                      }`} />
                      <div className={`text-sm font-medium ${
                        selectedPayment === method.id ? 'text-[#3ca0de]' : 'text-gray-600'
                      }`}>
                        {method.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Total & Checkout */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Artikelen</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotaal</span>
                  <span>€{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">Totaal</span>
                  <span className="text-3xl font-bold text-[#3ca0de]">
                    €{getTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-4 bg-[#3ca0de] text-white rounded-lg font-bold text-lg hover:bg-[#2d8bc7] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" />
                Afrekenen
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Betaling Succesvol</h2>
                    <p className="text-gray-600">Bon #{lastSale.saleNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4 mb-4 space-y-2">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.productId?.name || item.name}
                    </span>
                    <span className="font-medium">€{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Totaal</span>
                  <span className="text-[#3ca0de]">€{(lastSale.total || lastSale.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Betaald met</span>
                  <span className="font-medium capitalize">{lastSale.paymentMethod}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={printReceipt}
                  className="flex-1 py-3 border-2 border-[#3ca0de] text-[#3ca0de] rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Printen
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-3 bg-[#3ca0de] text-white rounded-lg font-semibold hover:bg-[#2d8bc7] transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
