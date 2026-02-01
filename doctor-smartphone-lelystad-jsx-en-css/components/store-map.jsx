import { Card } from "@/components/ui/card"

export default function StoreMap() {
  // Embedded map (interactive pan/zoom) with a pin for the store location.
  // Uses Google Maps embed so users can drag + zoom directly in the map.
  const query = encodeURIComponent("Doctor Smartphone Lelystad De Wissel 15 8232 DM Lelystad")
  const src = `https://www.google.com/maps?q=${query}&output=embed`

  return (
    <section className="bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Locatie</h2>
            <p className="text-sm text-muted-foreground">
              Doctor Smartphone Lelystad — De Wissel 15, 8232 DM Lelystad
            </p>
          </div>

          <div className="p-3">
            <div className="rounded-xl overflow-hidden border bg-muted">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  title="Locatie Doctor Smartphone Lelystad"
                  src={src}
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
