"use client"

import { useMemo, useState } from "react"
import VitrineDeviceCard from "@/components/vitrine/vitrine-device-card"
import {
  vitrineKleuren,
  vitrineMerken,
  vitrineOpslag,
  vitrineStatussen,
  vitrineTypes,
} from "@/lib/vitrine-data"

const ANY = ""

export default function VitrinePage({ items = [] }) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState(ANY)
  const [merk, setMerk] = useState(ANY)
  const [kleur, setKleur] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  const [opslag, setOpslag] = useState(ANY)

  const safeItems = Array.isArray(items) ? items : []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return safeItems.filter((item) => {
      if (type && item.type !== type) return false
      if (merk && item.merk !== merk) return false
      if (kleur && item.kleur !== kleur) return false
      if (status && item.status !== status) return false
      if (opslag && (item.opslag ?? "") !== opslag) return false

      if (!q) return true
      const haystack = `${item.type} ${item.merk} ${item.model} ${item.opslag ?? ""} ${item.kleur} ${item.status} ${item.beschrijving}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [safeItems, query, type, merk, kleur, status, opslag])

  return (
    <section className="bg-muted py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-background border rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Vitrine</h1>
              <p className="mt-2 text-muted-foreground">
                Bekijk beschikbare toestellen. Filters werken live, zonder verversen.
              </p>
            </div>

            <div className="w-full md:max-w-md">
              <label className="block text-sm font-medium mb-2">Zoeken</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek op merk, model, kleur..."
                className="w-full px-4 py-3 border rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <FilterSelect label="Type" value={type} onChange={setType} options={vitrineTypes} />
            <FilterSelect label="Merk" value={merk} onChange={setMerk} options={vitrineMerken} />
            <FilterSelect label="Opslag" value={opslag} onChange={setOpslag} options={vitrineOpslag} />
            <FilterSelect label="Kleur" value={kleur} onChange={setKleur} options={vitrineKleuren} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={vitrineStatussen} />
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Resultaten: <span className="font-medium text-foreground">{filtered.length}</span>
            </div>
            <button
              type="button"
              className="underline"
              onClick={() => {
                setQuery("")
                setType(ANY)
                setMerk(ANY)
                setOpslag(ANY)
                setKleur(ANY)
                setStatus(ANY)
              }}
            >
              Reset filters
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <VitrineDeviceCard key={item.id} item={item} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 text-center text-muted-foreground">
              Er staan nog geen toestellen in de vitrine.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg bg-background"
      >
        <option value="">Alles</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
