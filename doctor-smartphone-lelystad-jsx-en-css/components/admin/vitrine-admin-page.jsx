"use client"

import { Fragment, useMemo, useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import VitrineAddForm from "@/components/admin/vitrine-add-form"
import VitrineEditForm from "@/components/admin/vitrine-edit-form"
import { createVitrineItem, deleteVitrineItem, updateVitrineItem } from "@/app/admin/vitrine/actions"
import AdminNav from "@/components/admin/admin-nav"
import AdminHeader from "@/components/admin/admin-header"

export default function VitrineAdminPage({ initialItems }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemIdParam = searchParams.get('itemId')
  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : [])
  const [editingId, setEditingId] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [openedFromParam, setOpenedFromParam] = useState(false)

  const normalized = useMemo(() => {
    return items.map((x) => ({
      ...x,
      prijs: Number(x?.prijs ?? 0),
      batterijConditie: Number(x?.batterijConditie ?? 0),
    }))
  }, [items])

  const handleAdd = (payload) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const created = await createVitrineItem(payload)
          setItems((prev) => [created, ...prev])
          router.refresh()
          resolve(created)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  const handleDelete = (id) => {
    startTransition(async () => {
      await deleteVitrineItem(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      setEditingId((prev) => (prev === id ? null : prev))
      router.refresh()
    })
  }

  const handleUpdate = (payload) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const updated = await updateVitrineItem(payload)
          setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
          setEditingId(null)
          router.refresh()
          resolve(updated)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  useEffect(() => {
    if (!itemIdParam || openedFromParam || items.length === 0) return
    const item = items.find((x) => x.id === itemIdParam)
    if (item) {
      setEditingId(itemIdParam)
      setOpenedFromParam(true)
      setTimeout(() => {
        const row = document.getElementById(`vitrine-item-${itemIdParam}`)
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [itemIdParam, openedFromParam, items])

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Vitrine items" count={normalized.length} isPending={isPending} />

        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">📦 Vitrine beheer</h2>
          <p className="text-gray-600 text-sm">
            Voeg toestellen toe met alle info; items worden opgeslagen in MongoDB.
          </p>
        </div>

        <VitrineAddForm onAdd={handleAdd} />

        <div className="mt-8 bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Huidige vitrine items</h2>

          {normalized.length === 0 ? (
            <div className="text-sm text-gray-600">Nog geen items toegevoegd.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Merk</th>
                    <th className="text-left py-2">Model</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Opslag</th>
                    <th className="text-left py-2">Kleur</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">IMEI</th>
                    <th className="text-left py-2">Voorraad</th>
                    <th className="text-left py-2">Batterij</th>
                    <th className="text-left py-2">Prijs</th>
                    <th className="text-right py-2">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="border-b" id={`vitrine-item-${item.id}`}>
                        <td className="py-2 font-medium">{item.merk}</td>
                        <td className="py-2">{item.model}</td>
                        <td className="py-2">{item.type}</td>
                        <td className="py-2">{item.opslag || "-"}</td>
                        <td className="py-2">{item.kleur}</td>
                        <td className="py-2">{item.status}</td>
                        <td className="py-2">{item.imei || "-"}</td>
                        <td className="py-2">{item.voorraadStatus || "beschikbaar"}</td>
                        <td className="py-2">{item.batterijConditie}%</td>
                        <td className="py-2">€ {item.prijs}</td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setEditingId((prev) => (prev === item.id ? null : item.id))}
                              className="inline-flex items-center gap-2 text-[#3ca0de] hover:underline"
                            >
                              <Pencil className="w-4 h-4" />
                              Bewerken
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center gap-2 text-red-600 hover:underline"
                            >
                              <Trash2 className="w-4 h-4" />
                              Verwijderen
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingId === item.id && (
                        <tr className="border-b last:border-b-0">
                          <td className="py-4" colSpan={9}>
                            <VitrineEditForm
                              item={item}
                              onSave={handleUpdate}
                              onCancel={() => setEditingId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
