"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X, Star, StarHalf } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [animateButton, setAnimateButton] = useState(false)

  useEffect(() => {
    setAnimateButton(true)
  }, [])

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo + rating */}
          <div className="flex items-center">
            <Link href="/" aria-label="Doctor Smartphone" className="flex items-center">
              <Image
                src="/doctor-smartphone-logo..png"
                alt="Doctor Smartphone"
                width={225}
                height={43}
                priority
                className="h-[50px] w-auto select-none drop-shadow-sm"
              />
            </Link>
          </div>

          {/* Desktop Navigation + Rating Card */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-8">
              <Link href="/" className="header-link">
                Home
              </Link>
              <Link href="/over-ons" className="header-link">
                Over ons
              </Link>
              <Link href="/vitrine" className="header-link">
                Vitrine
              </Link>
              {/* Apparaten & Prijzen verwijderd op verzoek */}
              <Link href="/contact" className="header-link">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/20 bg-muted/50 px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1 text-amber-500" aria-label="4,8 sterren">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <StarHalf className="h-4 w-4 fill-amber-500" />
              </div>
              <div className="text-xs leading-tight">
                <div className="font-semibold text-foreground">4,8 sterren rating</div>
                <div className="text-muted-foreground">op Google</div>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/logos/google.svg" alt="Google" width={20} height={20} />
                <span className="text-xs font-medium text-foreground">Google</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/contact"
            className={`header-cta-button ${animateButton ? 'animate-pulse-once' : ''}`}
          >
            Afspraak Maken
          </Link>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-foreground">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slideDown">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="mobile-header-link">
                Home
              </Link>
              <Link href="/over-ons" className="mobile-header-link">
                Over ons
              </Link>
              <Link href="/vitrine" className="mobile-header-link">
                Vitrine
              </Link>
              {/* Apparaten & Prijzen verwijderd op verzoek */}
              <Link href="/contact" className="mobile-header-link">
                Contact
              </Link>
              <Link
                href="/contact"
                className="mobile-header-cta-button"
              >
                Afspraak Maken
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
