import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import StoreMapGuard from "@/components/store-map-guard"
import { Phone } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: {
    default: "Doctor Smartphone Lelystad",
    template: "%s - Doctor Smartphone Lelystad",
  },
  description:
    "Professionele reparatie van telefoons, tablets en laptops in Lelystad. Snel, betrouwbaar en betaalbaar.",
  icons: {
    icon: "/icon-doc.svg",
    shortcut: "/icon-doc.svg",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <StoreMapGuard />
        <Footer />
        <Toaster />
        <a
          href="tel:0320410140"
          aria-label="Bel Doctor Smartphone"
          className="group fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_12px_30px_rgba(60,160,222,0.45)] flex items-center justify-center transition-all duration-300 hover:shadow-[0_18px_40px_rgba(60,160,222,0.6)] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl" aria-hidden="true" />
          <span className="absolute inset-0 rounded-full border-2 border-white/60 opacity-0 group-hover:opacity-100 group-hover:animate-spin" aria-hidden="true" />
          <Phone className="w-6 h-6 relative" />
        </a>
        <a
          href="https://wa.me/31649990444"
          aria-label="WhatsApp Doctor Smartphone"
          className="group fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#1aa34a] text-white shadow-[0_12px_30px_rgba(37,211,102,0.45)] flex items-center justify-center transition-all duration-300 hover:shadow-[0_18px_40px_rgba(37,211,102,0.6)] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
          target="_blank"
          rel="noreferrer"
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366]/20 blur-xl" aria-hidden="true" />
          <span className="absolute inset-0 rounded-full border-2 border-white/60 opacity-0 group-hover:opacity-100 group-hover:animate-spin" aria-hidden="true" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-6 h-6 relative"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M16.02 3.2c-6.97 0-12.63 5.5-12.63 12.27 0 2.16.6 4.2 1.76 5.98L3.3 28.8l7.58-2.37a12.9 12.9 0 0 0 5.14 1.07h.01c6.97 0 12.63-5.5 12.63-12.27S22.99 3.2 16.02 3.2Zm0 22.16h-.01c-1.7 0-3.36-.45-4.82-1.3l-.35-.2-4.5 1.4 1.47-4.32-.23-.34a10.25 10.25 0 0 1-1.74-5.67c0-5.61 4.72-10.17 10.17-10.17 5.61 0 10.17 4.56 10.17 10.17 0 5.61-4.56 10.43-10.16 10.43Zm5.67-7.79c-.31-.15-1.83-.9-2.11-1-.28-.1-.48-.15-.68.15-.2.31-.78 1-1 1.21-.2.2-.4.23-.72.08-.31-.15-1.32-.49-2.52-1.56-.93-.83-1.56-1.86-1.74-2.17-.18-.31-.02-.48.14-.63.15-.15.31-.4.46-.6.15-.2.2-.35.31-.58.1-.23.05-.44-.02-.6-.08-.15-.68-1.64-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.08-.79.38-.27.31-1.04 1-1.04 2.44 0 1.44 1.07 2.83 1.22 3.02.15.2 2.1 3.2 5.1 4.48.71.31 1.26.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.83-.75 2.09-1.47.26-.72.26-1.33.18-1.47-.08-.15-.28-.23-.59-.38Z" />
          </svg>
        </a>
      </body>
    </html>
  )
}
