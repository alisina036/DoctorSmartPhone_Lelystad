"use client"

import VitrineForm from "@/components/admin/vitrine-form"

function itemToForm(item) {
  const fotos = Array.isArray(item?.fotos) ? item.fotos : []

  return {
    id: String(item?.id ?? ""),
    type: String(item?.type ?? ""),
    merk: String(item?.merk ?? ""),
    model: String(item?.model ?? ""),
    opslag: String(item?.opslag ?? ""),
    prijs: String(item?.prijs ?? ""),
    kleur: String(item?.kleur ?? ""),
    batterijConditie: String(item?.batterijConditie ?? ""),
    status: String(item?.status ?? ""),
    imei: String(item?.imei ?? ""),
    voorraadStatus: String(item?.voorraadStatus ?? "beschikbaar"),
    fotos: fotos.join(", "),
    beschrijving: String(item?.beschrijving ?? ""),
  }
}

export default function VitrineEditForm({ item, onSave, onCancel }) {
  const handleSubmit = async (payload) => {
    if (typeof onSave === "function") {
      await onSave(payload)
    }
  }

  return (
    <VitrineForm
      title={`Bewerken: ${item?.merk || ""} ${item?.model || ""}`.trim()}
      submitLabel="Opslaan"
      showCancel
      onCancel={onCancel}
      generateId={false}
      defaultValues={itemToForm(item)}
      onSubmit={handleSubmit}
    />
  )
}
