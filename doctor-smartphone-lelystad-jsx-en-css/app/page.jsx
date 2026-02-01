import Link from "next/link"
import { Clock, Shield, Wrench, Star } from "lucide-react"
// import Wizard from "@/components/ui/wizard"
import DeviceSelector from "@/components/ui/device-selector"
import LogoMarquee from "@/components/ui/logo-marquee"
import HeroCarousel from "@/components/ui/hero-carousel"

export const metadata = {
  title: "Welkom",
}

export default function HomePage() {

  const features = [
    {
      icon: Clock,
      title: "Snelle Service",
      description: "Meeste reparaties binnen 30-45 minuten klaar",
    },
    {
      icon: Shield,
      title: "6 Maanden Garantie",
      description: "Op onderdelen en arbeid, volgens onze garantievoorwaarden.",
    },
    {
      icon: Wrench,
      title: "Vakmanschap",
      description: "Ervaren technici met kwalitatieve onderdelen",
    },
    {
      icon: Star,
      title: "100% Service",
      description: "Vriendelijke service, heldere uitleg en garantie op onze werkzaamheden.",
    },
    {
      icon: Clock,
      title: "Gratis Reparatiecheck",
      description: "We onderzoeken je toestel gratis en bespreken vooraf de kosten.",
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Snelle en Betrouwbare Reparaties in Lelystad
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-light leading-relaxed">
                Professionele reparatie van smartphones, tablets en laptops. Vaak binnen 1 uur klaar met 6 maanden
                garantie.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="bg-white text-primary px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg text-center"
                >
                  Afspraak Maken
                </Link>
                {/* <Link
                  href="/prijzen/telefoons"
                  className="bg-primary-dark border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-primary transition-colors font-bold text-lg text-center"
                >
                  Bekijk Prijzen
                </Link> */}
              </div>
            </div>
            <div>
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Wizard Section */}
      {/* <Wizard /> */}
      <DeviceSelector />

      {/* About Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Smartphone- en tabletreparatie in Lelystad
              </h2>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Bij Doctor Smartphone in Lelystad helpen we je snel met reparaties voor iPhone, Samsung en andere
                smartphones en tablets. Door onze jarenlange ervaring lossen we vrijwel elke klacht vakkundig op en
                denken we met je mee over de slimste keuze: repareren of vervangen. We werken met kwaliteitsonderdelen
                en duidelijke communicatie, zodat je precies weet waar je aan toe bent.
              </p>
              <h3 className="text-2xl font-bold mb-4">Scherpe prijzen en transparant advies</h3>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Onze tarieven zijn gebaseerd op de inkoop van onderdelen en de benodigde werktijd. Geen kleine lettertjes:
                je hoort de prijs vooraf en we repareren pas na akkoord. Populaire reparaties zoals iPhone schermen en
                batterijen zijn vaak direct uit voorraad leverbaar.
              </p>
              <h3 className="text-2xl font-bold mb-4">Je weet altijd waar je aan toe bent</h3>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Twijfel je over de staat van je toestel? Loop gerust binnen voor een gratis check. We onderzoeken het
                probleem, leggen de opties uit en geven eerlijk advies. Is repareren niet logisch, dan zeggen we dat ook.
              </p>
            </div>
            <div>
              <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">Onze Voordelen</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-lg">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Binnen 30-45 min. klaar:</span> Veelvoorkomende reparaties zijn vaak binnen een uur gereed.
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold">6 maanden garantie:</span> Op onderdelen en arbeid, volgens
                      onze garantievoorwaarden.
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <Wrench className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Gratis reparatiecheck:</span> We onderzoeken je toestel gratis
                      en bespreken vooraf de kosten.
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <Star className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold">100% service:</span> Vriendelijke service, heldere uitleg en
                      garantie op onze werkzaamheden.
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold">zes dagen per week geopend:</span> We zijn van maandag tot
                      en met zaterdag geopend.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Waarom Doctor Smartphone?</h2>
            <p className="text-xl text-muted-foreground">Kwaliteit en service staan bij ons voorop</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Klaar om Uw Apparaat te Laten Repareren?</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Kom langs in onze winkel in Lelystad of maak een afspraak. We helpen u graag!
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-dark transition-colors font-bold text-lg"
          >
            Contact Opnemen
          </Link>
        </div>
      </section>
    </div>
  )
}
