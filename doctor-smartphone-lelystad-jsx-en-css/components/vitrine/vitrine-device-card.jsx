"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

function statusVariant(status) {
  switch (status) {
    case "Nieuw Sealed":
      return "default"
    case "Nieuw Open":
      return "secondary"
    case "Tweedehands":
      return "outline"
    default:
      return "secondary"
  }
}

export default function VitrineDeviceCard({ item }) {
  const fotos = useMemo(() => {
    if (Array.isArray(item?.fotos) && item.fotos.length) return item.fotos
    return ["/placeholder.jpg"]
  }, [item])

  const [index, setIndex] = useState(0)
  // We animate ratio via padding-top (animatable), not via aspect-ratio classes.
  const [paddingTop, setPaddingTop] = useState(75) // 4/3 => 75%
  const [imgLoaded, setImgLoaded] = useState(false)
  const canNavigate = fotos.length > 1

  const prev = () => setIndex((i) => (i - 1 + fotos.length) % fotos.length)
  const next = () => setIndex((i) => (i + 1) % fotos.length)

  useEffect(() => {
    setImgLoaded(false)
  }, [index])

  const handleImgLoad = (e) => {
    const w = e?.currentTarget?.naturalWidth
    const h = e?.currentTarget?.naturalHeight
    if (!w || !h) return

    const ratio = w / h // width / height
    const nextPadding = (1 / ratio) * 100 // height / width in %

    // Clamp to keep layout sane (prevents super tall photos blowing up the grid)
    const clamped = Math.max(56.25, Math.min(140, nextPadding))
    setPaddingTop(clamped)
    setImgLoaded(true)
  }

  return (
    <div className="bg-background border rounded-xl overflow-hidden shadow-sm">
      <div
        className="relative bg-muted overflow-hidden"
        style={{ paddingTop: `${paddingTop}%`, transition: "padding-top 180ms ease-out" }}
      >
        <img
          src={fotos[index]}
          alt={`${item?.merk ?? ""} ${item?.model ?? ""}`.trim() || "Toestel"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={handleImgLoad}
        />

        {canNavigate && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-sm"
              aria-label="Vorige foto"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-sm"
              aria-label="Volgende foto"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge
            variant={statusVariant(item?.status)}
            className="bg-background/90 text-foreground border-border/50 shadow-sm"
          >
            {item?.status}
          </Badge>
          {Number.isFinite(item?.batterijConditie) && (
            <Badge variant="secondary">Batterij {item.batterijConditie}%</Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{item?.merk}</div>
            <h3 className="text-lg font-semibold leading-tight">{item?.model}</h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Prijs</div>
            <div className="text-2xl font-bold text-primary">€ {item?.prijs}</div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{item?.type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Opslag</dt>
            <dd className="font-medium">{item?.opslag || "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kleur</dt>
            <dd className="font-medium">{item?.kleur}</dd>
          </div>
        </dl>

        {item?.beschrijving && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {item.beschrijving}
          </p>
        )}
      </div>
    </div>
  )
}
