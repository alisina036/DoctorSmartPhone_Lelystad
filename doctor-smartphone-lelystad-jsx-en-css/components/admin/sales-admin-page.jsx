"use client"

import { useMemo, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AdminHeader from "@/components/admin/admin-header"
import AdminNav from "@/components/admin/admin-nav"

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0"
  return value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SalesAdminPage({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || [])
  const [selectedId, setSelectedId] = useState(initialProducts?.[0]?.id || "")
  const [quantity, setQuantity] = useState(1)
  const [search, setSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("PIN")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const filteredProducts = useMemo(() => {
    const term = String(search || "").trim().toLowerCase()
    if (!term) return products
    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase()
      const barcode = String(product.barcode || "").toLowerCase()
      return name.includes(term) || barcode.includes(term)
    })
  }, [products, search])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId),
    [products, selectedId]
  )
  const total = selectedProduct ? Number(selectedProduct.price || 0) * Number(quantity || 0) : 0

  const printReceipt = ({ product, qty, totalPrice, method }) => {
    const now = new Date()
    const lines = [
      { label: product.name, value: `€ ${formatNumber(Number(product.price || 0))} x ${qty}` },
      { label: "Barcode", value: product.barcode || "-" },
    ]

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bon</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 4mm; }
              body { margin: 0; }
            }
            body { font-family: "Courier New", monospace; font-size: 12px; color: #000; }
            .center { text-align: center; }
            .row { display: flex; justify-content: space-between; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .total { font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="center">
            <div><strong>Doctor Smartphone</strong></div>
            <div>De Wissel 15, Lelystad</div>
            <div>036 525 6149</div>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Datum</span><span>${now.toLocaleDateString("nl-NL")}</span></div>
          <div class="row"><span>Tijd</span><span>${now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span></div>
          <div class="divider"></div>
          ${lines
            .map((line) => `<div class="row"><span>${line.label}</span><span>${line.value}</span></div>`)
            .join("")}
          <div class="divider"></div>
          <div class="row total"><span>Totaal</span><span>€ ${formatNumber(totalPrice)}</span></div>
          <div class="row"><span>Betaald met</span><span>${method}</span></div>
          <div class="divider"></div>
          <div class="center">Bedankt voor uw bezoek!</div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank", "width=400,height=600")
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleSell = async (event) => {
    event.preventDefault()
    if (isSaving) return
    setMessage(null)
    setError(null)

    const qty = Number(quantity || 0)
    if (!selectedId || !Number.isFinite(qty) || qty <= 0) {
      setError("Selecteer een product en geldige hoeveelheid.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/retail-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedId, quantity: qty }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Verkoop mislukt.")
      }

      const updated = data?.product
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      }
      setMessage("Verkoop geregistreerd en voorraad bijgewerkt.")
      if (selectedProduct) {
        printReceipt({
          product: { ...selectedProduct, stock_count: updated?.stock_count ?? selectedProduct.stock_count },
          qty,
          totalPrice: Number(selectedProduct.price || 0) * qty,
          method: paymentMethod,
        })
      }
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Verkoop" count={products.length} isPending={isSaving} />
        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">🧾 Verkoop kassa</h2>
          <p className="text-gray-600 text-sm">Selecteer een product en registreer de verkoop.</p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <form className="space-y-5" onSubmit={handleSell}>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {message}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Zoek (barcode / naam)</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Scan barcode of typ productnaam"
              />
            </div>

            <div className="grid gap-2">
              <Label>Product</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {filteredProducts.length === 0 && <option value="">Geen producten</option>}
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.stock_count} op voorraad)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Hoeveelheid</Label>
              <Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Betaald met</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="PIN">PIN</option>
                <option value="Contant">Contant</option>
              </select>
            </div>

            {selectedProduct && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm space-y-1">
                <div>Prijs per stuk: <span className="font-semibold">€ {formatNumber(Number(selectedProduct.price || 0))}</span></div>
                <div>Barcode: {selectedProduct.barcode}</div>
                <div>Voorraad: {selectedProduct.stock_count}</div>
                <div>Totaal: <span className="font-semibold">€ {formatNumber(total)}</span></div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white" disabled={isSaving || products.length === 0}>
                <ShoppingCart className="w-4 h-4 mr-2" />Verkoop bevestigen
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
