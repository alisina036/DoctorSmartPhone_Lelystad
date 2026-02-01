"use client"

import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import AdminHeader from "@/components/admin/admin-header"
import AdminNav from "@/components/admin/admin-nav"
import ConfirmDialog from "@/components/admin/confirm-dialog"

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock_count: "",
  barcode: "",
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0"
  return value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function StockAdminPage({ initialProducts, initialCategories, initialDevices }) {
  const [products, setProducts] = useState(initialProducts || [])
  const [categories, setCategories] = useState(initialCategories || [])
  const [devices] = useState(initialDevices || [])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryHideInWizard, setNewCategoryHideInWizard] = useState(false)
  const [categoryError, setCategoryError] = useState(null)
  const [isCategorySaving, setIsCategorySaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Bevestigen",
    onConfirm: null,
  })

  const sortedProducts = useMemo(() => {
    const collator = new Intl.Collator("nl", { sensitivity: "base" })
    return [...products].sort((a, b) => collator.compare(a.name || "", b.name || ""))
  }, [products])

  const sortedCategories = useMemo(() => {
    const collator = new Intl.Collator("nl", { sensitivity: "base" })
    return [...categories].sort((a, b) => collator.compare(a.name || "", b.name || ""))
  }, [categories])

  const deviceCategories = useMemo(() => {
    const names = new Set()
    for (const device of devices) {
      const name = String(device?.name || "").trim()
      if (name) names.add(name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }))
  }, [devices])

  const allCategories = useMemo(() => {
    const out = []
    const seen = new Set()
    for (const name of deviceCategories) {
      if (!seen.has(name)) {
        out.push({ name, source: "device" })
        seen.add(name)
      }
    }
    for (const cat of sortedCategories) {
      const name = String(cat?.name || "").trim()
      if (name && !seen.has(name)) {
        out.push({ name, source: "custom" })
        seen.add(name)
      }
    }
    return out
  }, [deviceCategories, sortedCategories])

  const categoryCards = useMemo(() => {
    const deviceMap = new Map()
    for (const device of devices) {
      const name = String(device?.name || "").trim()
      if (!name) continue
      if (!deviceMap.has(name)) deviceMap.set(name, device?.imageUrl || "")
    }
    return allCategories.map((cat) => {
      const imageUrl = deviceMap.get(cat.name) || "/placeholder.svg"
      return { ...cat, imageUrl }
    })
  }, [allCategories, devices])

  const buildCategoryId = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowCategoryForm(false)
    setShowCategoryPicker(true)
    setNewCategoryName("")
    setNewCategoryHideInWizard(false)
    setCategoryError(null)
    setIsOpen(true)
  }

  const openEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      stock_count: String(product.stock_count ?? ""),
      barcode: product.barcode || "",
    })
    setError(null)
    setShowCategoryForm(false)
    setShowCategoryPicker(true)
    setNewCategoryName("")
    setNewCategoryHideInWizard(false)
    setCategoryError(null)
    setIsOpen(true)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (isSaving) return
    setError(null)

    const name = String(form.name || "").trim()
    const category = String(form.category || "").trim()
    const barcode = String(form.barcode || "").trim()
    const price = Number(form.price || 0)
    const stock = Number(form.stock_count || 0)

    if (!name || !category || !barcode) {
      setError("Vul alle verplichte velden in.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: editingId || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        category,
        barcode,
        price: Number.isFinite(price) ? price : 0,
        stock_count: Number.isFinite(stock) ? stock : 0,
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: payload }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Opslaan mislukt.")
      }

      const saved = data?.product || payload
      setProducts((prev) => (editingId
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev]
      ))
      setIsOpen(false)
      setEditingId(null)
      setForm(emptyForm)
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (product) => {
    setConfirmDialog({
      open: true,
      title: "Product verwijderen",
      description: `Weet je zeker dat je ${product.name} wilt verwijderen?`,
      confirmLabel: "Verwijderen",
      onConfirm: async () => {
        await fetch(`/api/products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" })
        setProducts((prev) => prev.filter((item) => item.id !== product.id))
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Voorraad" count={products.length} isPending={isSaving} />
        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">📦 Voorraadbeheer</h2>
              <p className="text-gray-600 text-sm">Beheer producten, prijzen en voorraad.</p>
            </div>
            <Button onClick={openAdd} className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white">
              <Plus className="w-4 h-4 mr-2" />Nieuw product
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          {sortedProducts.length === 0 ? (
            <div className="text-sm text-gray-600">Nog geen producten toegevoegd.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Naam</th>
                    <th className="text-left py-2">Categorie</th>
                    <th className="text-left py-2">Barcode</th>
                    <th className="text-right py-2">Prijs</th>
                    <th className="text-right py-2">Voorraad</th>
                    <th className="text-right py-2">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="py-2 font-medium">{product.name}</td>
                      <td className="py-2">{product.category}</td>
                      <td className="py-2">{product.barcode}</td>
                      <td className="py-2 text-right">€ {formatNumber(Number(product.price || 0))}</td>
                      <td className="py-2 text-right">{product.stock_count}</td>
                      <td className="py-2 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="inline-flex items-center gap-1 text-[#3ca0de] hover:underline"
                          >
                            <Pencil className="w-4 h-4" />Bewerken
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="inline-flex items-center gap-1 text-red-600 hover:underline"
                          >
                            <Trash2 className="w-4 h-4" />Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Product bewerken" : "Nieuw product"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Naam *</Label>
              <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Categorie *</Label>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="text-sm">
                  <span className="text-gray-500">Geselecteerd:</span>{" "}
                  <span className="font-medium">{form.category || "Nog geen"}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCategoryPicker((v) => {
                        const next = !v
                        if (next) setShowCategoryForm(false)
                        return next
                      })
                    }}
                  >
                    {showCategoryPicker ? "Verberg categorieën" : "Kies categorie"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCategoryForm((v) => {
                        const next = !v
                        if (next) setShowCategoryPicker(false)
                        return next
                      })
                    }}
                  >
                    Nieuwe categorie
                  </Button>
                </div>
              </div>
            </div>
            {showCategoryPicker && (
              <div className="border rounded-lg bg-white p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {categoryCards.map((cat) => (
                    <button
                      key={`${cat.source}-${cat.name}`}
                      type="button"
                      onClick={() => {
                        handleChange("category", cat.name)
                        setShowCategoryPicker(false)
                      }}
                      className={`border rounded-lg p-3 text-left hover:border-[#3ca0de] hover:shadow-sm transition ${form.category === cat.name ? "border-[#3ca0de] ring-2 ring-[#3ca0de]/20" : "border-gray-200"}`}
                    >
                      <div className="w-full h-24 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-800">{cat.name}</div>
                      <div className="text-xs text-gray-500">
                        {cat.source === "device" ? "Device categorie" : "Custom categorie"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showCategoryForm && (
              <div className="border rounded-lg bg-gray-50 p-4 space-y-3">
                {categoryError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {categoryError}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Nieuwe categorie naam</Label>
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newCategoryHideInWizard}
                    onChange={(e) => setNewCategoryHideInWizard(e.target.checked)}
                  />
                  Verberg in wizard (blijft zichtbaar in admin)
                </label>
                {sortedCategories.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">Bestaande categorieën</div>
                    <div className="space-y-1">
                      {sortedCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between gap-2 bg-white border rounded-md px-3 py-2">
                          <span>{cat.name}{cat.hideInWizard ? " (verborgen in wizard)" : ""}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={async () => {
                              setConfirmDialog({
                                open: true,
                                title: "Categorie verwijderen",
                                description: `Categorie ${cat.name} verwijderen?`,
                                confirmLabel: "Verwijderen",
                                onConfirm: async () => {
                                  await fetch(`/api/product-types?id=${encodeURIComponent(cat.id)}`, { method: "DELETE" })
                                  setCategories((prev) => prev.filter((x) => x.id !== cat.id))
                                  if (form.category === cat.name) {
                                    handleChange("category", "")
                                  }
                                },
                              })
                            }}
                          >
                            Verwijderen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCategoryForm(false)
                    setNewCategoryName("")
                    setNewCategoryHideInWizard(false)
                    setCategoryError(null)
                  }}>
                    Annuleren
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white"
                    disabled={isCategorySaving}
                    onClick={async () => {
                      const name = String(newCategoryName || "").trim()
                      if (!name) {
                        setCategoryError("Vul een categorie naam in.")
                        return
                      }
                      setCategoryError(null)
                      setIsCategorySaving(true)
                      try {
                        const payload = {
                          id: buildCategoryId(name),
                          name,
                          hideInWizard: newCategoryHideInWizard,
                        }
                        const res = await fetch("/api/product-types", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: payload }),
                        })
                        const data = await res.json().catch(() => null)
                        if (!res.ok) {
                          throw new Error(data?.error || "Categorie opslaan mislukt.")
                        }
                        const saved = data?.type || payload
                        setCategories((prev) => {
                          const next = prev.filter((x) => x.id !== saved.id)
                          next.push(saved)
                          return next
                        })
                        handleChange("category", saved.name)
                        setShowCategoryForm(false)
                        setNewCategoryName("")
                        setNewCategoryHideInWizard(false)
                      } catch (e) {
                        setCategoryError(String(e?.message || e))
                      } finally {
                        setIsCategorySaving(false)
                      }
                    }}
                  >
                    Categorie toevoegen
                  </Button>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Barcode *</Label>
              <Input value={form.barcode} onChange={(e) => handleChange("barcode", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Prijs (€)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Voorraad</Label>
                <Input type="number" step="1" value={form.stock_count} onChange={(e) => handleChange("stock_count", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuleren</Button>
              <Button type="submit" className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white" disabled={isSaving}>
                {editingId ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
