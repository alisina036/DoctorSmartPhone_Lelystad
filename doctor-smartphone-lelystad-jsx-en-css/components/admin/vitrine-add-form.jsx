"use client"

import { useState } from "react"
import VitrineForm from "@/components/admin/vitrine-form"

export default function VitrineAddForm({ onAdd }) {
  const [lastCreated, setLastCreated] = useState(null)

  const handleSubmit = async (payload) => {
    if (typeof onAdd !== "function") return null
    const created = await onAdd(payload)
    if (created) setLastCreated(created)
    return created
  }

  return (
    <div>
      <VitrineForm
        title="Toestel toevoegen (Vitrine)"
        description="Dit component formatteert de data direct als een nieuw vitrine-object."
        submitLabel="Toevoegen"
        generateId={false}
        resetOnSubmit
        onSubmit={handleSubmit}
      />

      {lastCreated && (
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Laatst aangemaakt object</div>
          <pre className="text-xs bg-gray-50 border rounded-lg p-4 overflow-auto">
{JSON.stringify(lastCreated, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
