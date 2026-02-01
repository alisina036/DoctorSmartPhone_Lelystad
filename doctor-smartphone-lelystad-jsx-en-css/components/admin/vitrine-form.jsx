"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  formatVitrineItem,
  vitrineKleuren,
  vitrineMerken,
  vitrineOpslag,
  vitrineStatussen,
  vitrineTypes,
  vitrineVoorraadStatussen,
} from "@/lib/vitrine-data"

const DEFAULT_VALUES = {
  id: "",
  type: "",
  merk: "",
  model: "",
  opslag: "",
  prijs: "",
  kleur: "",
  batterijConditie: "",
  status: "",
  imei: "",
  voorraadStatus: "beschikbaar",
  fotos: "",
  beschrijving: "",
}

export default function VitrineForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Opslaan",
  title,
  description,
  showCancel = false,
  resetOnSubmit = false,
  generateId = true,
  variant = "panel",
  onSuccess,
  hidePhotos = false,
}) {
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...(defaultValues || {}),
      voorraadStatus: defaultValues?.voorraadStatus || "beschikbaar",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = form

  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    setError("")
    setIsUploading(true)

    try {
      const fd = new FormData()
      Array.from(fileList).forEach((f) => fd.append("file", f))

      const res = await fetch("/api/vitrine-upload", { method: "POST", body: fd })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Upload mislukt")
      }

      const uploadedPaths = (data.files || [])
        .map((x) => x.publicPath || x.filename)
        .filter(Boolean)
      if (uploadedPaths.length) {
        const existing = String(form.getValues("fotos") || "").trim()
        const next = existing ? `${existing}, ${uploadedPaths.join(", ")}` : uploadedPaths.join(", ")
        setValue("fotos", next, { shouldDirty: true })
      }
    } catch (e) {
      setError(e?.message || "Upload mislukt")
    } finally {
      setIsUploading(false)
    }
  }

  const submit = async (values) => {
    setError("")
    const payload = formatVitrineItem(
      {
        ...values,
        prijs: Number(values.prijs || 0),
        batterijConditie: Number(values.batterijConditie || 0),
      },
      { generateId }
    )

    try {
      const result = await onSubmit?.(payload)
      if (resetOnSubmit) {
        reset({ ...DEFAULT_VALUES, voorraadStatus: "beschikbaar" })
      }
      if (typeof onSuccess === "function") {
        onSuccess(result)
      }
    } catch (e) {
      setError(e?.message || "Opslaan mislukt")
    }
  }

  const Wrapper = ({ children }) =>
    variant === "panel" ? (
      <div className="bg-white border rounded-xl p-6">{children}</div>
    ) : (
      <>{children}</>
    )

  return (
    <Wrapper>
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}

      {error && (
        <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(submit)} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" {...register("id")} />

        <SelectField label="Type" register={register("type", { required: true })} options={vitrineTypes} required />
        <SelectField label="Merk" register={register("merk", { required: true })} options={vitrineMerken} required />

        <TextField label="Model" register={register("model", { required: true })} placeholder="Bijv. iPhone 13" required />
        <SelectField label="Opslag" register={register("opslag")} options={vitrineOpslag} />
        <TextField label="Prijs (€)" register={register("prijs", { required: true })} inputMode="numeric" placeholder="449" required />

        <SelectField label="Kleur" register={register("kleur", { required: true })} options={vitrineKleuren} required />
        <TextField
          label="Batterijconditie (%)"
          register={register("batterijConditie", { required: true })}
          inputMode="numeric"
          placeholder="90"
          required
        />

        <SelectField label="Conditie" register={register("status", { required: true })} options={vitrineStatussen} required />
        <SelectField label="Voorraadstatus" register={register("voorraadStatus", { required: true })} options={vitrineVoorraadStatussen} required />

        <TextField label="IMEI" register={register("imei")} placeholder="IMEI nummer" />

        {!hidePhotos && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Upload foto</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => uploadFiles(e.target.files)}
                className="w-full px-4 py-3 border rounded-lg bg-white"
              />
              <div className="mt-2 text-xs text-gray-500">
                {isUploading ? "Uploaden..." : "Upload vult automatisch de bestandsnaam(en) hieronder in."}
              </div>
            </div>

            <TextField
              label="Bestandsnaam foto (komma-gescheiden)"
              register={register("fotos")}
              placeholder="foto1.jpg, foto2.jpg"
            />
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Beschrijving</label>
          <textarea
            {...register("beschrijving")}
            className="w-full px-4 py-3 border rounded-lg"
            rows={4}
            placeholder="Korte, duidelijke beschrijving..."
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark font-medium disabled:opacity-60"
            >
              {isSubmitting ? "Bezig..." : submitLabel}
            </button>
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-lg border hover:bg-gray-50 font-medium"
              >
                Annuleren
              </button>
            )}
          </div>
        </div>
      </form>
    </Wrapper>
  )
}

function SelectField({ label, register, options, required }) {
  const normalizedOptions = Array.isArray(options) ? options : []
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select {...register} required={required} className="w-full px-4 py-3 border rounded-lg bg-white">
        <option value="">{required ? "Kies..." : "Onbekend"}</option>
        {normalizedOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextField({ label, register, placeholder, required, inputMode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        {...register}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className="w-full px-4 py-3 border rounded-lg"
      />
    </div>
  )
}
