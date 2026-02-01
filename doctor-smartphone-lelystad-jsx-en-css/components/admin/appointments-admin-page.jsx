"use client"

import { useMemo, useState, useTransition } from "react"
import { Trash2, RotateCcw, XCircle } from "lucide-react"
import { listAppointments, softDeleteAppointment, restoreAppointment, hardDeleteAppointment } from "@/app/admin/afspraken/actions"
import AdminNav from "@/components/admin/admin-nav"
import AdminHeader from "@/components/admin/admin-header"
import ConfirmDialog from "@/components/admin/confirm-dialog"

function formatDateNl(date) {
  if (!date) return "-"
  try {
    const d = new Date(date)
    return d.toLocaleDateString("nl-NL", { year: "numeric", month: "2-digit", day: "2-digit" })
  } catch {
    return String(date)
  }
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function AppointmentsAdminPage({ initialAppointments }) {
  const [items, setItems] = useState(Array.isArray(initialAppointments) ? initialAppointments : [])
  const [isPending, startTransition] = useTransition()
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Bevestigen",
    onConfirm: null,
  })

  const groups = useMemo(() => {
    const today = startOfDay(new Date())

    const upcoming = []
    const expired = []
    const trash = []

    for (const a of items) {
      const deletedAt = a?.deletedAt ? new Date(a.deletedAt) : null
      if (deletedAt) {
        trash.push(a)
        continue
      }

      const apptDate = a?.appointmentDate ? startOfDay(new Date(a.appointmentDate)) : null
      if (apptDate && apptDate < today) expired.push(a)
      else upcoming.push(a)
    }

    return { upcoming, expired, trash }
  }, [items])

  const refresh = () => {
    startTransition(async () => {
      const next = await listAppointments()
      setItems(next)
    })
  }

  const doSoftDelete = (id) => {
    if (!id) return
    setConfirmDialog({
      open: true,
      title: "Afspraak verwijderen",
      description: "Weet je zeker dat je deze afspraak wilt verwijderen? Hij blijft 7 dagen in de prullenbak.",
      confirmLabel: "Verwijderen",
      onConfirm: () => {
        startTransition(async () => {
          await softDeleteAppointment(id)
          const next = await listAppointments()
          setItems(next)
        })
      },
    })
  }

  const doRestore = (id) => {
    if (!id) return
    startTransition(async () => {
      await restoreAppointment(id)
      const next = await listAppointments()
      setItems(next)
    })
  }

  const doHardDelete = (id) => {
    if (!id) return
    setConfirmDialog({
      open: true,
      title: "Afspraak definitief verwijderen",
      description: "Dit verwijdert de afspraak PER DIRECT en kan niet ongedaan worden gemaakt.",
      confirmLabel: "Definitief verwijderen",
      onConfirm: () => {
        startTransition(async () => {
          await hardDeleteAppointment(id)
          const next = await listAppointments()
          setItems(next)
        })
      },
    })
  }

  const renderCard = (a, mode) => {
    const id = a?._id
    const apptDate = a?.appointmentDate ? startOfDay(new Date(a.appointmentDate)) : null
    const autoDeleteOn = apptDate ? addDays(apptDate, 7) : null
    const deleteAfter = a?.deleteAfter ? new Date(a.deleteAfter) : null

    return (
      <div key={String(id)} className="bg-white border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">{a?.naam || "-"}</div>
            <div className="text-sm text-gray-600">
              Datum: <span className="font-medium text-gray-900">{formatDateNl(a?.appointmentDate)}</span>
              {mode === "expired" ? (
                <span className="text-gray-500"> • Auto-verwijderen op {formatDateNl(autoDeleteOn)}</span>
              ) : null}
              {mode === "trash" ? (
                <span className="text-gray-500"> • Definitief verwijderen op {formatDateNl(deleteAfter)}</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode !== "trash" ? (
              <button
                type="button"
                onClick={() => doSoftDelete(id)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => doRestore(id)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Herstellen
              </button>
            )}

            <button
              type="button"
              onClick={() => doHardDelete(id)}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Verwijder direct
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <div className="text-gray-500">E-mail</div>
            <div className="font-medium break-all">{a?.email || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Telefoon</div>
            <div className="font-medium">{a?.telefoon || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Apparaat</div>
            <div className="font-medium">{a?.apparaat || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Merk/Model</div>
            <div className="font-medium">{a?.probleem || "-"}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-gray-500 text-sm">Bericht</div>
          <div className="mt-2 text-sm bg-gray-50 border rounded-lg p-3 whitespace-pre-wrap">{a?.bericht || ""}</div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Aangemaakt: {formatDateNl(a?.createdAt)}
          {a?.deletedAt ? ` • Verwijderd: ${formatDateNl(a.deletedAt)}` : ""}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Afspraken" count={items.length} isPending={isPending} />

        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">📅 Afspraken</h2>
          <p className="text-gray-600 text-sm mb-4">
            Hier vind je alle afspraak aanvragen. Verwijderen zet ze 7 dagen in de prullenbak; verlopen afspraken worden automatisch verwijderd.
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Vernieuwen
          </button>
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Komende afspraken</h2>
            <p className="text-sm text-gray-600">Afspraken met datum vanaf vandaag.</p>
          </div>
          <div className="text-sm text-gray-500">{groups.upcoming.length} items</div>
        </div>
        {groups.upcoming.length ? (
          <div className="grid gap-4">{groups.upcoming.map((a) => renderCard(a, "upcoming"))}</div>
        ) : (
          <div className="text-sm text-gray-500">Geen komende afspraken.</div>
        )}
          </section>

          <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Verlopen</h2>
            <p className="text-sm text-gray-600">Wordt automatisch definitief verwijderd 7 dagen na de afspraakdatum.</p>
          </div>
          <div className="text-sm text-gray-500">{groups.expired.length} items</div>
        </div>
        {groups.expired.length ? (
          <div className="grid gap-4">{groups.expired.map((a) => renderCard(a, "expired"))}</div>
        ) : (
          <div className="text-sm text-gray-500">Geen verlopen afspraken.</div>
        )}
          </section>

          <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Prullenbak</h2>
            <p className="text-sm text-gray-600">Verwijderde afspraken blijven 7 dagen herstelbaar.</p>
          </div>
          <div className="text-sm text-gray-500">{groups.trash.length} items</div>
        </div>
        {groups.trash.length ? (
          <div className="grid gap-4">{groups.trash.map((a) => renderCard(a, "trash"))}</div>
        ) : (
          <div className="text-sm text-gray-500">Prullenbak is leeg.</div>
        )}
          </section>
        </div>
      </div>
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
