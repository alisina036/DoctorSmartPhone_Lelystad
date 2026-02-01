"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { Plus, Printer, Download, Trash2, Pencil, Lock, Mail, Barcode as BarcodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import AdminNav from "@/components/admin/admin-nav"
import AdminHeader from "@/components/admin/admin-header"
import { updateVitrineStatusByImei } from "@/app/admin/vitrine/actions"
import { vitrineKleuren, vitrineOpslag, vitrineStatussen } from "@/lib/vitrine-data"
import { useToast } from "@/hooks/use-toast"
import "./invoice-admin-page.css"

const shopInfo = {
  name: "Doctor Smartphone Lelystad",
  address: "De Wissel 15, 8232 DM Lelystad",
  phone: "036 525 6149",
  kvk: "80570038",
  btw: "NL236855025803",
}

const invoiceTypes = [
  { value: "reparatie", label: "Reparatie" },
  { value: "verkoop", label: "Verkoop" },
  { value: "inkoop", label: "Inkoop" },
]

const paymentMethods = ["PIN", "Contant", "Bankoverschrijving"]
const paymentStatuses = ["Openstaand", "Betaald", "Geannuleerd"]
const batteryOptions = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

const formatDate = (value) => {
  if (!value) return "-"
  const d = new Date(value)
  return d.toLocaleDateString("nl-NL", { year: "numeric", month: "2-digit", day: "2-digit" })
}

const getInitialNumber = (lastNumber) => {
  const year = new Date().getFullYear()
  const base = Number(`${year}0001`)
  if (!lastNumber) return base
  return Number(lastNumber) + 1
}

const getVatRate = (type, vatMode) => {
  if (type === "reparatie") return 0.21
  if (type === "verkoop") return vatMode === "marge" ? 0 : 0.21
  return 0
}

const createEmptyInvoice = (lastNumber) => {
  const nextNumber = getInitialNumber(lastNumber)
  return {
    id: createId(),
    number: nextNumber,
    invoiceDate: new Date().toISOString(),
    type: "reparatie",
    vatMode: "btw21",
    paymentMethod: "PIN",
    paymentStatus: "Betaald",
    customerName: "",
    customerAddress: "",
    customerPostalCode: "",
    customerCity: "",
    customerEmail: "",
    customerPhone: "",
    imeiList: [""],
    iban: "",
    lines: [
      { description: "", details: "", quantity: 1, price: 0 },
    ],
    createdAt: null,
    updatedAt: null,
  }
}

export default function InvoiceAdminPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState([])
  const [draft, setDraft] = useState(() => createEmptyInvoice(null))
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState("")
  const [lastNumber, setLastNumber] = useState(null)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [emailWarning, setEmailWarning] = useState(null)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [availableInventory, setAvailableInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [repairTypes, setRepairTypes] = useState([])
  const [loadingRepairTypes, setLoadingRepairTypes] = useState(false)
  const [openRepairDropdown, setOpenRepairDropdown] = useState(null)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [inventoryProducts, setInventoryProducts] = useState([])
  const barcodeInputRef = useRef(null)

  const printRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingInvoices(true)
        const res = await fetch("/api/invoices-data", { cache: "no-store" })
        const data = await res.json().catch(() => null)
        const nextInvoices = Array.isArray(data?.invoices) ? data.invoices : []
        const numericLast = Number(data?.lastNumber || 0) || null
        setInvoices(nextInvoices)
        setLastNumber(numericLast)
        setDraft(createEmptyInvoice(numericLast))
      } catch {
        setInvoices([])
        setLastNumber(null)
        setDraft(createEmptyInvoice(null))
      } finally {
        setLoadingInvoices(false)
      }
    }
    load()
  }, [])

  const fetchAvailableInventory = async () => {
    try {
      setLoadingInventory(true)
      const res = await fetch("/api/vitrine-items?status=beschikbaar&includeImei=1", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      setAvailableInventory(Array.isArray(data) ? data : [])
    } catch {
      setAvailableInventory([])
    } finally {
      setLoadingInventory(false)
    }
  }

  useEffect(() => {
    if (draft.type !== "verkoop") return
    fetchAvailableInventory()
  }, [draft.type])

  const fetchInventoryProducts = async () => {
    try {
      const res = await fetch("/api/inventory/products", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      setInventoryProducts(Array.isArray(data) ? data : [])
    } catch {
      setInventoryProducts([])
    }
  }

  useEffect(() => {
    if (draft.type === "reparatie" || draft.type === "verkoop") {
      fetchInventoryProducts()
    }
  }, [draft.type])

  const fetchRepairTypes = async () => {
    try {
      setLoadingRepairTypes(true)
      const res = await fetch("/api/repair-types", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      setRepairTypes(Array.isArray(data) ? data : [])
    } catch {
      setRepairTypes([])
    } finally {
      setLoadingRepairTypes(false)
    }
  }

  useEffect(() => {
    if (draft.type !== "reparatie") return
    fetchRepairTypes()
  }, [draft.type])

  const locked = useMemo(() => {
    if (!draft?.createdAt) return false
    const created = new Date(draft.createdAt).getTime()
    return Date.now() - created > 24 * 60 * 60 * 1000
  }, [draft])

  const vatRate = getVatRate(draft.type, draft.vatMode)

  const totals = useMemo(() => {
    const grossTotal = (draft.lines || []).reduce((sum, line) => {
      const qty = Number(line.quantity || 0)
      const price = Number(line.price || 0)
      return sum + qty * price
    }, 0)
    if (vatRate <= 0) {
      return { subtotal: grossTotal, vatAmount: 0, total: grossTotal }
    }
    const net = grossTotal / (1 + vatRate)
    const vatAmount = grossTotal - net
    return { subtotal: net, vatAmount, total: grossTotal }
  }, [draft.lines, vatRate])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return invoices
    return invoices.filter((inv) => {
      const haystack = [
        inv.number,
        inv.customerName,
        inv.customerEmail,
        inv.customerPhone,
        inv.type,
        inv.paymentStatus,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [invoices, search])

  const documentTitle = useMemo(() => {
    const label = invoiceTypes.find((t) => t.value === draft.type)?.label || "Factuur"
    return `${label}-${draft.number}`
  }, [draft.number, draft.type])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
  })

  const safePrint = () => {
    if (!printRef.current) return
    handlePrint()
  }

  const updateDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const updateLine = (index, key, value) => {
    setDraft((prev) => {
      const next = [...prev.lines]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, lines: next }
    })
  }

  const updateLineFields = (index, patch) => {
    setDraft((prev) => {
      const next = [...prev.lines]
      next[index] = { ...next[index], ...patch }
      return { ...prev, lines: next }
    })
  }

  const addLine = () => {
    setDraft((prev) => ({
      ...prev,
      lines: [...prev.lines, { description: "", details: "", quantity: 1, price: 0 }],
    }))
  }

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const product = inventoryProducts.find(p => p.barcode === barcodeInput.trim())
    if (product) {
      const deviceName = product.deviceModelId?.name || ""
      const fullName = deviceName ? `${deviceName} - ${product.name}` : product.name
      
      // Find existing line with same product or add new line
      const existingLineIndex = draft.lines.findIndex(line => line.description === fullName)
      
      if (existingLineIndex >= 0) {
        // Increase quantity of existing line
        updateLine(existingLineIndex, "quantity", draft.lines[existingLineIndex].quantity + 1)
      } else {
        // Add new line
        setDraft((prev) => ({
          ...prev,
          lines: [...prev.lines, { description: fullName, details: "", quantity: 1, price: product.salePrice }],
        }))
      }
      
      setBarcodeInput("")
      barcodeInputRef.current?.focus()
    } else {
      toast({
        variant: "destructive",
        title: "Product niet gevonden",
        description: `Geen product gevonden met barcode: ${barcodeInput}`,
      })
      setBarcodeInput("")
    }
  }

  const removeLine = (index) => {
    setDraft((prev) => {
      const next = prev.lines.filter((_, i) => i !== index)
      return { ...prev, lines: next.length ? next : [{ description: "", details: "", quantity: 1, price: 0 }] }
    })
  }


  const updateImei = (index, value) => {
    setDraft((prev) => {
      const next = [...(prev.imeiList || [""])]
      next[index] = value
      return { ...prev, imeiList: next }
    })
  }

  const addImei = () => {
    setDraft((prev) => ({
      ...prev,
      imeiList: [...(prev.imeiList || [""]), ""],
    }))
  }

  const removeImei = (index) => {
    setDraft((prev) => {
      const list = prev.imeiList || [""]
      const next = list.filter((_, i) => i !== index)
      return { ...prev, imeiList: next.length ? next : [""] }
    })
  }

  useEffect(() => {
    const postal = (draft.customerPostalCode || "").trim()
    const city = (draft.customerCity || "").trim()
    if (!postal || !city) {
      setAddressSuggestions([])
      return
    }

    let aborted = false
    const timeout = setTimeout(async () => {
      try {
        setAddressLoading(true)
        const query = new URLSearchParams({
          format: "json",
          limit: "5",
          countrycodes: "nl",
          postalcode: postal,
          city,
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
          headers: { "Accept-Language": "nl" },
        })
        const data = await res.json()
        if (aborted) return
        setAddressSuggestions(Array.isArray(data) ? data : [])
      } catch {
        if (!aborted) setAddressSuggestions([])
      } finally {
        if (!aborted) setAddressLoading(false)
      }
    }, 500)

    return () => {
      aborted = true
      clearTimeout(timeout)
    }
  }, [draft.customerPostalCode, draft.customerCity])

  const emptyWarning = (value) => {
    if (value === null || value === undefined) return "Field is leeg"
    if (String(value).trim().length === 0) return "Field is leeg"
    return ""
  }

  const parseInvoiceDate = (value) => {
    if (!value) return null
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const isValidEmail = (value) => {
    const v = String(value || "").trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  const formatWarrantyText = (repairType) => {
    if (!repairType) return ""
    const rawText = String(repairType.warrantyText || "").trim()
    if (rawText) {
      return /^garantie\s*:/i.test(rawText) ? rawText : `Garantie: ${rawText}`
    }
    const months = Number(repairType.warrantyMonths || 0)
    if (Number.isFinite(months) && months > 0) {
      return `Garantie: ${months} maand${months === 1 ? "" : "en"}`
    }
    return ""
  }

  const mergeWarrantyDetails = (details, warrantyText) => {
    const parts = String(details || "")
      .split("•")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^garantie\s*:/i.test(part))
    if (warrantyText) parts.push(warrantyText)
    return parts.join(" • ")
  }

  const appendRepairToDescription = (description, repairName, allRepairTypes = []) => {
    let base = String(description || "").trim()
    const repair = String(repairName || "").trim()
    if (!repair) return base

    if (Array.isArray(allRepairTypes) && allRepairTypes.length) {
      allRepairTypes.forEach((type) => {
        const name = String(type?.name || "").trim()
        if (!name) return
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const pattern = new RegExp(`\\s*-?\\s*${escaped}$`, "i")
        base = base.replace(pattern, "").trim()
      })
    }

    if (!base) return repair
    return `${base} - ${repair}`
  }

  const verkoopWarrantyNote =
    "Garantie: 1 maand op interne defecten. Geen garantie op water- of valschade en fysieke schade."

  const warrantyNoteByDescription = (description) => {
    const text = String(description || "").toLowerCase()
    if (!text) return ""
    const noWarranty = [
      /achterkant\s*glas/i,
      /oplaadpoort/i,
      /cameralens/i,
    ]
    if (noWarranty.some((rx) => rx.test(text))) return ""

    const hasWarranty = [
      /scherm\s*(reparatie|vervangen)/i,
      /achterkant\s*behuizing/i,
      /batterij\s*vervangen/i,
      /achter\s*camera/i,
      /voor\s*camera/i,
      /oorspeaker/i,
    ]
    if (hasWarranty.some((rx) => rx.test(text))) {
      return "Garantie: 3 maanden op de werking van dit onderdeel. Val-, stoot-, breuk- en waterschade zijn uitgesloten van garantie."
    }

    return ""
  }

  const sendInvoiceEmail = async (payload, totalsSnapshot, target = "customer") => {
    const isCompany = target === "company"
    const to = isCompany ? "" : String(payload?.customerEmail || "").trim()
    if (!isCompany && (!to || !isValidEmail(to))) return

    const typeLabel = invoiceTypes.find((t) => t.value === payload.type)?.label || "Factuur"
    const extraNoteParts = []
    if (payload.type === "verkoop" && payload.vatMode === "marge") {
      extraNoteParts.push("BTW niet aftrekbaar (margeregeling).")
    }
    if (payload.type === "verkoop") {
      extraNoteParts.push(verkoopWarrantyNote)
    }
    if (payload.type === "inkoop") {
      extraNoteParts.push("Inkoopverklaring aanwezig op de factuur.")
    }
    const extraNote = extraNoteParts.join(" ")
    const imeiNote = (payload.type === "reparatie" || payload.type === "verkoop")
      ? (payload.imeiList || []).filter(Boolean).join(", ")
      : ""

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          toCompany: isCompany,
          number: payload.number,
          typeLabel,
          invoiceDate: payload.invoiceDate || payload.createdAt || new Date().toISOString(),
          paymentStatus: payload.paymentStatus,
          paymentMethod: payload.paymentMethod,
          iban: payload.iban,
          totals: totalsSnapshot,
          lines: payload.lines || [],
          extraNote: [extraNote, imeiNote ? `IMEI: ${imeiNote}` : ""].filter(Boolean).join(" • "),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.sent === false) {
        setEmailWarning(data?.error || "E-mail kon niet worden verzonden.")
      } else {
        setEmailWarning(null)
      }
    } catch (e) {
      setEmailWarning(String(e?.message || e))
    }
  }

  const saveInvoice = async () => {
    if (locked) return null
    const now = new Date().toISOString()
    const isNew = !draft.createdAt
    const payload = {
      ...draft,
      invoiceDate: draft.invoiceDate || draft.createdAt || now,
      createdAt: draft.createdAt || now,
      updatedAt: now,
    }

    const res = await fetch("/api/invoices-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice: payload }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setEmailWarning(data?.error || "Opslaan mislukt.")
      return null
    }

    const saved = data?.invoice || payload
    const nextInvoices = isNew
      ? [saved, ...invoices]
      : invoices.map((inv) => (inv.id === saved.id ? saved : inv))
    setInvoices(nextInvoices)
    setLastNumber(Number(data?.lastNumber || saved.number || lastNumber || 0))
    setActiveId(saved.id)
    setDraft(saved)

    if (payload.type === "verkoop") {
      const imei = (payload.imeiList || []).find((x) => String(x || "").trim())
      if (imei) {
        try {
          await updateVitrineStatusByImei(imei, "verkocht")
          fetchAvailableInventory()
        } catch (e) {
          setEmailWarning(String(e?.message || e))
        }
      }
    }

    if (payload.customerEmail && isValidEmail(payload.customerEmail)) {
      sendInvoiceEmail(saved, totals)
    }
    return saved
  }

  const resendInvoiceEmail = () => {
    if (!draft.createdAt) return
    if (!draft.customerEmail || !isValidEmail(draft.customerEmail)) {
      setEmailWarning("Geen geldig e-mailadres om opnieuw te versturen.")
      return
    }
    sendInvoiceEmail(draft, totals)
  }

  const resendInvoiceEmailToCompany = () => {
    if (!draft.createdAt) return
    sendInvoiceEmail(draft, totals, "company")
  }

  const handlePrintNow = async () => {
    if (!draft.createdAt && !locked) {
      const saved = await saveInvoice()
      if (saved) {
        setTimeout(() => safePrint(), 0)
      }
      return
    }
    safePrint()
  }

  const startNewInvoice = () => {
    setActiveId(null)
    setDraft(createEmptyInvoice(lastNumber))
  }

  const openInvoice = (invoice) => {
    setActiveId(invoice.id)
    setDraft({
      ...invoice,
      invoiceDate: invoice.invoiceDate || invoice.createdAt || new Date().toISOString(),
    })
  }

  const deleteInvoice = (id) => {
    const remove = async () => {
      await fetch(`/api/invoices-data?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const next = invoices.filter((inv) => inv.id !== id)
      setInvoices(next)
      if (activeId === id) {
        setActiveId(null)
        setDraft(createEmptyInvoice(lastNumber))
      }
    }
    remove()
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="no-print">
          <AdminHeader title="Facturen" count={invoices.length} isPending={false} />
        </div>

        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6 no-print">
          <h2 className="text-2xl font-bold mb-1">📑 Facturen</h2>
          <p className="text-gray-600 text-sm">Maak, bewerk en print facturen. Na 24 uur worden ze vergrendeld.</p>
        </div>

        <div className="invoice-layout no-print">
          <div className="invoice-panel">
            <div className="invoice-panel-header">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Factuur bewerken</div>
                  <div className="text-sm text-gray-500">Factuurnummer en details</div>
                </div>
                <div className="invoice-actions">
                  <Button
                    type="button"
                    onClick={startNewInvoice}
                    className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe factuur
                  </Button>
                  <Button type="button" onClick={handlePrintNow} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button type="button" onClick={handlePrintNow} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    type="button"
                    onClick={resendInvoiceEmail}
                    className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                    disabled={!draft.createdAt}
                  >
                    <Mail className="w-4 h-4 mr-2" />Opnieuw naar klant
                  </Button>
                  <Button
                    type="button"
                    onClick={resendInvoiceEmailToCompany}
                    className="bg-indigo-100 text-indigo-900 hover:bg-indigo-200"
                    disabled={!draft.createdAt}
                  >
                    <Mail className="w-4 h-4 mr-2" />Opnieuw naar bedrijf
                  </Button>
                </div>
              </div>
            </div>
            <div className="invoice-panel-body">
              {locked && (
                <div className="invoice-note mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Deze factuur is ouder dan 24 uur en is vergrendeld (alleen printen/downloaden).
                </div>
              )}
              {emailWarning && (
                <div className="invoice-note mb-4" style={{ borderColor: "#f59e0b", background: "#fff7ed" }}>
                  E-mail waarschuwing: {emailWarning}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurnummer</label>
                  <input
                    type="number"
                    value={draft.number}
                    onChange={(e) => updateDraft("number", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurdatum</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-3 py-2 border rounded-lg text-left"
                        disabled={locked}
                      >
                        {parseInvoiceDate(draft.invoiceDate)
                          ? format(parseInvoiceDate(draft.invoiceDate), "dd-MM-yyyy")
                          : "Kies datum"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseInvoiceDate(draft.invoiceDate) || undefined}
                        onSelect={(date) => updateDraft("invoiceDate", date ? date.toISOString() : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {!locked && emptyWarning(draft.invoiceDate) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={draft.type}
                    onChange={(e) => updateDraft("type", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  >
                    {invoiceTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Betaalmethode</label>
                  <select
                    value={draft.paymentMethod}
                    onChange={(e) => updateDraft("paymentMethod", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={draft.paymentStatus}
                    onChange={(e) => updateDraft("paymentStatus", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                {draft.paymentMethod === "Bankoverschrijving" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">IBAN (handmatig invullen)</label>
                    <input
                      type="text"
                      value={draft.iban || ""}
                      onChange={(e) => updateDraft("iban", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="NL00BANK0123456789"
                      disabled={locked}
                    />
                    {!locked && emptyWarning(draft.iban) && (
                      <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                    )}
                  </div>
                )}
                {draft.type === "verkoop" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">BTW-regime</label>
                    <select
                      value={draft.vatMode}
                      onChange={(e) => updateDraft("vatMode", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={locked}
                    >
                      <option value="btw21">21% BTW</option>
                      <option value="marge">Margeregeling (BTW niet aftrekbaar)</option>
                    </select>
                  </div>
                )}
                {draft.type === "verkoop" && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-1">IMEI (verkoop)</label>
                    <input
                      type="text"
                      list="available-imei"
                      value={(draft.imeiList || [""])[0] || ""}
                      onChange={(e) => updateDraft("imeiList", [e.target.value])}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder={loadingInventory ? "Beschikbare IMEI laden..." : "Kies of typ IMEI"}
                      disabled={locked}
                    />
                    <datalist id="available-imei">
                      {availableInventory
                        .filter((item) => String(item?.imei || "").trim())
                        .map((item) => (
                          <option
                            key={item.id}
                            value={item.imei}
                            label={`${item.merk} ${item.model} ${item.opslag || ""}`.trim()}
                          />
                        ))}
                    </datalist>
                    {!locked && (draft.imeiList || []).every((x) => !String(x || "").trim()) && (
                      <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                    )}
                  </div>
                )}
                {draft.type === "reparatie" && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-1">IMEI nummers</label>
                    <div className="space-y-2">
                      {(draft.imeiList || [""]).map((value, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateImei(index, e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder={`IMEI ${index + 1}`}
                            disabled={locked}
                          />
                          <button
                            type="button"
                            onClick={() => removeImei(index)}
                            disabled={locked}
                            className="px-2 py-2 text-sm text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        onClick={addImei}
                        disabled={locked}
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        IMEI toevoegen
                      </Button>
                    </div>
                    {!locked && (draft.imeiList || []).every((x) => !String(x || "").trim()) && (
                      <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Klantnaam</label>
                  <input
                    type="text"
                    value={draft.customerName}
                    onChange={(e) => updateDraft("customerName", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerName) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Straat + huisnummer</label>
                  <input
                    type="text"
                    value={draft.customerAddress}
                    onChange={(e) => updateDraft("customerAddress", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerAddress) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postcode</label>
                  <input
                    type="text"
                    value={draft.customerPostalCode}
                    onChange={(e) => updateDraft("customerPostalCode", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerPostalCode) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stad</label>
                  <input
                    type="text"
                    value={draft.customerCity}
                    onChange={(e) => updateDraft("customerCity", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerCity) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={draft.customerEmail}
                    onChange={(e) => updateDraft("customerEmail", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerEmail) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefoon</label>
                  <input
                    type="text"
                    value={draft.customerPhone}
                    onChange={(e) => updateDraft("customerPhone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={locked}
                  />
                  {!locked && emptyWarning(draft.customerPhone) && (
                    <div className="text-xs text-amber-600 mt-1">Field is leeg</div>
                  )}
                </div>
              </div>

              {(draft.customerPostalCode && draft.customerCity) && !locked && (
                <div className="mb-6">
                  <div className="text-sm font-medium mb-2">Adres suggesties</div>
                  {addressLoading ? (
                    <div className="text-sm text-gray-500">Zoeken...</div>
                  ) : addressSuggestions.length === 0 ? (
                    <div className="text-sm text-gray-500">Geen suggesties gevonden.</div>
                  ) : (
                    <div className="grid gap-2">
                      {addressSuggestions.map((item) => (
                        <button
                          key={item.place_id}
                          type="button"
                          onClick={() => updateDraft("customerAddress", item.display_name)}
                          className="text-left px-3 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Barcode Scanner */}
              {(draft.type === "reparatie" || draft.type === "verkoop") && !locked && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2 text-blue-900">
                    <BarcodeIcon className="w-4 h-4 inline mr-2" />
                    Scan Barcode
                  </label>
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Scan of typ barcode..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Toevoegen
                    </button>
                  </form>
                  <div className="text-xs text-blue-700 mt-2">
                    Scan een product barcode om het automatisch toe te voegen met prijs
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Productlijnen</h3>
                  <Button type="button" onClick={addLine} disabled={locked} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                    <Plus className="w-4 h-4 mr-2" />Regel toevoegen
                  </Button>
                </div>

                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Omschrijving</th>
                      <th>Aantal</th>
                      <th>Prijs p/stuk (incl. BTW)</th>
                      <th>Regel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lines.map((line, index) => {
                      const selectedRepairType = repairTypes.find((type) => line.description?.includes(type.name))
                      const warrantyLabel = formatWarrantyText(selectedRepairType)
                      const dropdownOpen = openRepairDropdown === index
                      return (
                      <tr key={index}>
                        <td>
                          <div className="space-y-2">
                            {draft.type === "reparatie" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenRepairDropdown(dropdownOpen ? null : index)}
                                  disabled={locked}
                                  className="w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-between bg-white hover:bg-gray-50"
                                >
                                  <span className="flex items-center gap-2 text-gray-700">
                                    {selectedRepairType?.imageUrl ? (
                                      <img src={selectedRepairType.imageUrl} alt="" className="w-5 h-5 object-contain" />
                                    ) : (
                                      <span className="w-5 h-5 rounded bg-gray-100" />
                                    )}
                                    <span>{selectedRepairType?.name || (loadingRepairTypes ? "Reparaties laden..." : "Kies reparatie...")}</span>
                                  </span>
                                  <span className="text-gray-400">▾</span>
                                </button>
                                {dropdownOpen && !locked && (
                                  <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border bg-white shadow-lg">
                                    {repairTypes.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-gray-500">Geen reparaties gevonden.</div>
                                    )}
                                    {repairTypes.map((type) => (
                                      <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                          const nextWarranty = formatWarrantyText(type)
                                          updateLineFields(index, {
                                            description: appendRepairToDescription(line.description, type.name, repairTypes),
                                            details: mergeWarrantyDetails(line.details, nextWarranty),
                                          })
                                          setOpenRepairDropdown(null)
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                      >
                                        {type.imageUrl ? (
                                          <img src={type.imageUrl} alt="" className="w-6 h-6 object-contain" />
                                        ) : (
                                          <span className="w-6 h-6 rounded bg-gray-100" />
                                        )}
                                        <span className="flex-1">
                                          <div className="font-medium text-gray-800">{type.name}</div>
                                          {formatWarrantyText(type) && (
                                            <div className="text-xs text-gray-500">{formatWarrantyText(type)}</div>
                                          )}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {warrantyLabel && (
                                  <div className="text-xs text-gray-500 mt-1">{warrantyLabel}</div>
                                )}
                              </div>
                            )}
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(index, "description", e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Omschrijving"
                              disabled={locked}
                            />
                            {draft.type === "inkoop" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <select
                                  value={line.kleur || ""}
                                  onChange={(e) => updateLine(index, "kleur", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                  disabled={locked}
                                >
                                  <option value="">Kleur</option>
                                  {vitrineKleuren.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <select
                                  value={line.opslag || ""}
                                  onChange={(e) => updateLine(index, "opslag", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                  disabled={locked}
                                >
                                  <option value="">Opslag</option>
                                  {vitrineOpslag.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={line.batterijConditie ?? ""}
                                  onChange={(e) => updateLine(index, "batterijConditie", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                  placeholder="Batterijconditie (%)"
                                  disabled={locked}
                                />
                                <select
                                  value={line.status || ""}
                                  onChange={(e) => updateLine(index, "status", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                  disabled={locked}
                                >
                                  <option value="">Conditie</option>
                                  {vitrineStatussen.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={line.imei || ""}
                                  onChange={(e) => updateLine(index, "imei", e.target.value)}
                                  className="w-full px-2 py-1 border rounded md:col-span-2"
                                  placeholder="IMEI"
                                  disabled={locked}
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={line.details || ""}
                                onChange={(e) => updateLine(index, "details", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs"
                                placeholder="Details (bijv. model, opslag, kleur, staat)"
                                disabled={locked}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, "quantity", Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                            disabled={locked}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={line.price}
                            onChange={(e) => updateLine(index, "price", Number(e.target.value))}
                            className="w-32 px-2 py-1 border rounded"
                            disabled={locked}
                          />
                        </td>
                        <td>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(Number(line.quantity || 0) * Number(line.price || 0))}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              disabled={locked}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="invoice-summary">
                <div className="invoice-summary-row">
                  <span>Subtotaal (excl. BTW)</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="invoice-summary-row">
                  <span>BTW ({Math.round(vatRate * 100)}%)</span>
                  <span>{formatCurrency(totals.vatAmount)}</span>
                </div>
                <div className="invoice-summary-row total">
                  <span>Totaal (incl. BTW)</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {draft.type === "verkoop" && draft.vatMode === "marge" && (
                <div className="invoice-note mt-4">BTW niet aftrekbaar (margeregeling).</div>
              )}

              {draft.type === "verkoop" && (
                <div className="invoice-note mt-2">{verkoopWarrantyNote}</div>
              )}

              {draft.type === "inkoop" && (
                <div className="invoice-note mt-4">
                  Inkoopverklaring: De verkoper verklaart eigenaar te zijn van het toestel en vrij van rechten van derden.
                  Identiteit gecontroleerd en akkoord met inkoopvoorwaarden.
                  <div className="invoice-signature mt-4" />
                  <div className="text-xs text-gray-500 mt-1">Handtekening klant</div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="button"
                  onClick={saveInvoice}
                  disabled={locked}
                  className="bg-[#3ca0de] hover:bg-[#2d8bc7] text-white"
                >
                  Opslaan
                </Button>
                {draft.createdAt && (
                  <div className="text-xs text-gray-500">
                    Aangemaakt: {formatDate(draft.createdAt)} • Laatst bijgewerkt: {formatDate(draft.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="invoice-panel">
            <div className="invoice-panel-header">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Facturen overzicht</div>
                  <div className="text-sm text-gray-500">Zoek en open bestaande facturen</div>
                </div>
                <div className="invoice-chip">
                  <Lock className="w-4 h-4" /> 24u lock actief
                </div>
              </div>
            </div>
            <div className="invoice-panel-body">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Zoeken</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Zoek op nummer, klant of type..."
                />
              </div>

              {loadingInvoices ? (
                <div className="text-sm text-gray-500">Facturen laden...</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-gray-500">Geen facturen gevonden.</div>
              ) : (
                <div className="invoice-list">
                  {filtered.map((inv) => {
                    const isLocked = inv?.createdAt && Date.now() - new Date(inv.createdAt).getTime() > 24 * 60 * 60 * 1000
                    const typeLabel = invoiceTypes.find((t) => t.value === inv.type)?.label || inv.type
                    return (
                      <div key={inv.id} className="invoice-list-item">
                        <div className="invoice-list-header">
                          <div>
                            <div className="font-semibold">{typeLabel} #{inv.number}</div>
                            <div className="invoice-list-meta">{formatDate(inv.createdAt)} • {inv.customerName || "-"}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLocked && <span className="invoice-chip"><Lock className="w-3 h-3" />Vergrendeld</span>}
                            <button
                              type="button"
                              onClick={() => openInvoice(inv)}
                              className="inline-flex items-center gap-2 text-[#3ca0de] hover:underline"
                            >
                              <Pencil className="w-4 h-4" />Open
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteInvoice(inv.id)}
                              className="inline-flex items-center gap-2 text-red-600 hover:underline"
                            >
                              <Trash2 className="w-4 h-4" />Verwijderen
                            </button>
                          </div>
                        </div>
                        <div className="invoice-list-meta">Status: {inv.paymentStatus || "-"} • Betaalmethode: {inv.paymentMethod} • Totaal: {formatCurrency(inv.lines?.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.price || 0), 0))}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <div ref={printRef} className="invoice-a4">
            <div className="invoice-header">
              <div className="invoice-header-left">
                <div className="invoice-title">Factuur</div>
                <div className="invoice-meta">{invoiceTypes.find((t) => t.value === draft.type)?.label || "Factuur"}</div>
              </div>
              <div className="invoice-logo">
                <img src="/doctor-smartphone-logo..png" alt="Doctor Smartphone" />
              </div>
              <div className="invoice-header-right">
                <div className="invoice-meta">Factuurnummer</div>
                <div className="text-lg font-semibold">{draft.number}</div>
                <div className="invoice-meta">Datum: {formatDate(draft.invoiceDate || draft.createdAt || new Date())}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="invoice-block">
                <div className="invoice-block-title">Bedrijf</div>
                <div className="text-sm font-semibold">{shopInfo.name}</div>
                <div className="text-sm">{shopInfo.address}</div>
                <div className="text-sm">Tel: {shopInfo.phone}</div>
                <div className="text-sm">KVK: {shopInfo.kvk}</div>
                <div className="text-sm">BTW: {shopInfo.btw}</div>
                {draft.paymentMethod === "Bankoverschrijving" && draft.iban ? (
                  <div className="text-sm">IBAN: {draft.iban}</div>
                ) : null}
              </div>
              <div className="invoice-block">
                <div className="invoice-block-title">Klant</div>
                <div className="text-sm font-semibold">{draft.customerName || "-"}</div>
                <div className="text-sm">{draft.customerAddress || "-"}</div>
                <div className="text-sm">{draft.customerEmail || "-"}</div>
                <div className="text-sm">{draft.customerPhone || "-"}</div>
                {(draft.type === "reparatie" || draft.type === "verkoop") && (
                  <div className="text-sm">
                    IMEI: {(draft.imeiList || []).filter(Boolean).join(", ") || "-"}
                  </div>
                )}
                <div className="text-sm">Postcode: {draft.customerPostalCode || "-"}</div>
                <div className="text-sm">Stad: {draft.customerCity || "-"}</div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Omschrijving</th>
                  <th>Aantal</th>
                  <th>Prijs</th>
                  <th>Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>{line.description || "-"}</div>
                      {(() => {
                        const warrantyNote = warrantyNoteByDescription(line.description)
                        return warrantyNote ? (
                          <div className="text-xs text-gray-400 mt-1">{warrantyNote}</div>
                        ) : null
                      })()}
                      {(() => {
                        const detailsFromFields = [
                          line.kleur ? `Kleur: ${line.kleur}` : "",
                          line.opslag ? `Opslag: ${line.opslag}` : "",
                          line.batterijConditie ? `Batterij: ${line.batterijConditie}%` : "",
                          line.status ? `Conditie: ${line.status}` : "",
                          line.imei ? `IMEI: ${line.imei}` : "",
                        ].filter(Boolean).join(" • ")
                        const details = line.details || detailsFromFields
                        return details ? (
                          <div className="text-xs text-gray-500">{details}</div>
                        ) : null
                      })()}
                    </td>
                    <td>{line.quantity}</td>
                    <td>{formatCurrency(line.price)}</td>
                    <td>{formatCurrency(Number(line.quantity || 0) * Number(line.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <div className="invoice-summary-row">
                <span>Subtotaal (excl. BTW)</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="invoice-summary-row">
                <span>BTW ({Math.round(vatRate * 100)}%)</span>
                <span>{formatCurrency(totals.vatAmount)}</span>
              </div>
              <div className="invoice-summary-row total">
                <span>Totaal (incl. BTW)</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {draft.type === "verkoop" && draft.vatMode === "marge" && (
              <div className="invoice-note mt-4">BTW niet aftrekbaar (margeregeling).</div>
            )}

            {draft.type === "verkoop" && (
              <div className="invoice-note mt-2">{verkoopWarrantyNote}</div>
            )}

            {draft.type === "inkoop" && (
              <div className="invoice-note mt-4">
                Inkoopverklaring: De verkoper verklaart eigenaar te zijn van het toestel en vrij van rechten van derden.
                Identiteit gecontroleerd en akkoord met inkoopvoorwaarden.
              </div>
            )}

            <div className="invoice-note mt-4">
              <div className="text-sm font-medium">Handtekening Klant</div>
              <div className="invoice-signature mt-2" />
              <div className="text-xs text-gray-500 mt-1">Voor akkoord</div>
            </div>

            <div className="invoice-footer">
              <div>Status: {draft.paymentStatus}</div>
              <div>Betaalmethode: {draft.paymentMethod}</div>
              <div>Bedankt voor uw bezoek bij Doctor Smartphone Lelystad.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
