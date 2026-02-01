import Link from "next/link"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-foreground text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Doctor Smartphone</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Professionele reparatie van telefoons, tablets en laptops in Lelystad. Snel, betrouwbaar en betaalbaar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Snelle Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vitrine" className="text-gray-300 hover:text-primary transition-colors">
                  Vitrine
                </Link>
              </li>
              {/* <li>
                <Link href="/telefoons" className="text-gray-300 hover:text-primary transition-colors">
                  Telefoons
                </Link>
              </li>
              <li>
                <Link href="/tablets" className="text-gray-300 hover:text-primary transition-colors">
                  Tablets
                </Link>
              </li>
              <li>
                <Link href="/laptops" className="text-gray-300 hover:text-primary transition-colors">
                  Laptops
                </Link>
              </li> */}
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">0320 – 410 140</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  WhatsApp: 06 49 99 04 44
                  <br />
                  <span className="text-gray-400">U kunt ons ook bereiken via Whatsapp!</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Doctor Smartphone Lelystad
                  <br />
                  De Wissel 15
                  <br />
                  8232 DM Lelystad
                </span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-bold mb-4">Openingstijden</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Maandag: 12:00 – 18:00</span>
              </li>
              <li className="pl-6">Dinsdag: 10:00 – 18:00</li>
              <li className="pl-6">Woensdag: 10:00 – 18:00</li>
              <li className="pl-6">Donderdag: 10:00 – 20:00</li>
              <li className="pl-6">Vrijdag: 10:00 – 18:00</li>
              <li className="pl-6">Zaterdag: 10:00 – 17:00</li>
              <li className="pl-6">Zondag: gesloten</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Doctor Smartphone Lelystad. Alle rechten voorbehouden.</p>
          <p className="mt-2">KvK nummer: 80570038 · BTW nummer: NL236855025B03</p>
        </div>
      </div>
    </footer>
  )
}
