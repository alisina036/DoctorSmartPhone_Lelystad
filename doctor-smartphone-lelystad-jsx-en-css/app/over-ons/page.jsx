import Link from "next/link"
import { Phone, MessageCircle, MapPin, ShieldCheck, Wrench, Zap, HeartHandshake } from "lucide-react"

export const metadata = {
  title: "Over ons",
  description:
    "Lees meer over Doctor Smartphone Lelystad: snelle reparaties, eerlijk advies en service met garantie.",
}

export default function OverOnsPage() {
  const werkwijze = [
    {
      title: "Ruime ervaring",
      description: "Al meer dan 10 jaar een bekend gezicht in de regio.",
      icon: Wrench,
    },
    {
      title: "Goede garantie",
      description: "Je krijgt bij ons standaard 6 maanden garantie op de reparatie.",
      icon: ShieldCheck,
    },
    {
      title: "Duidelijke afspraken",
      description: "Heldere prijzen zonder verrassingen achteraf.",
      icon: Zap,
    },
  ]

  const waarden = [
    {
      title: "Betrouwbaar",
      description: "We doen wat we beloven en geven eerlijk advies.",
      icon: HeartHandshake,
    },
    {
      title: "Kwaliteit",
      description: "We werken netjes en gebruiken onderdelen die lang meegaan.",
      icon: ShieldCheck,
    },
    {
      title: "Snelheid",
      description: "We proberen je toestel altijd dezelfde dag nog klaar te hebben.",
      icon: Zap,
    },
    {
      title: "Service",
      description: "We nemen de tijd voor je en leggen graag uit wat er moet gebeuren.",
      icon: HeartHandshake,
    },
  ]

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-widest text-primary-light mb-3">Over ons</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Over Doctor Smartphone Lelystad
            </h1>
            <p className="text-lg md:text-xl text-primary-light leading-relaxed">
              Bij Doctor Smartphone Lelystad helpen we je gewoon goed en snel als je een probleem hebt met je telefoon,
              tablet of laptop. We weten hoe lastig het is om je toestel een dag te moeten missen, en daarom doen we er
              alles aan om je zo snel mogelijk weer op weg te helpen.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="grid grid-cols-1 gap-4 auto-rows-fr">
              <div className="rounded-2xl border bg-card p-6 shadow-sm h-full">
                <h2 className="text-2xl font-semibold mb-4">Kwaliteit en eerlijkheid</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kwaliteit en eerlijkheid staan bij ons voorop. Als je bij ons binnenloopt, kijken we samen naar het
                  probleem en vertellen we je direct wat de kosten zijn. We geven je altijd een eerlijk advies: als een
                  reparatie het geld niet meer waard is, zeggen we dat ook. Zo weet je precies waar je aan toe bent.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-sm h-full">
                <h2 className="text-2xl font-semibold mb-4">Hoe wij werken</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Onze reparateurs hebben jarenlange ervaring en gebruiken goede onderdelen en professioneel gereedschap.
                  De meeste reparaties, zoals een kapot scherm of een accu die snel leegloopt, voeren we direct uit in
                  onze winkel in Lelystad. Vaak kun je er zelfs op wachten.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
              {werkwijze.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm h-full">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Onze waarden</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">Waar wij voor staan</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              We vinden het belangrijk dat je met een goed gevoel de deur uitloopt. Daarom zijn dit de waarden waar we
              elke dag op terugvallen.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {waarden.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm h-full">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              )}
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-card p-8 md:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Heb je een vraag of wil je weten of we een onderdeel op voorraad hebben? Bel ons, stuur een WhatsApp of
                  loop gewoon even binnen.
                </p>
                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Contact opnemen
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold">Telefoon</p>
                    <p className="text-muted-foreground">0320 - 410 140</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-muted-foreground">06 49 99 04 44</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </span>
                <div>
                  <p className="font-semibold">Locatie</p>
                  <p className="text-muted-foreground">Lelystad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
