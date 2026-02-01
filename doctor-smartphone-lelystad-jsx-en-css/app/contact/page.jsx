"use client"

import { useEffect, useState } from "react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, Calendar as CalendarIcon } from "lucide-react"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { addDays, addMonths, format, isAfter, isBefore, startOfDay } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export default function ContactPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    naam: "",
    email: "",
    telefoon: "",
    apparaat: "",
    probleem: "",
    bericht: "",
  })

  const [appointmentDate, setAppointmentDate] = useState(null)

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitWarning, setSubmitWarning] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.apparaat) {
      toast({
        variant: 'destructive',
        title: 'Apparaat ontbreekt',
        description: 'Kies een apparaat type.'
      })
      return
    }
    if (!appointmentDate) {
      toast({
        variant: 'destructive',
        title: 'Datum ontbreekt',
        description: 'Kies een datum voor de afspraak.'
      })
      return
    }

    // Client-side date rules (server checks too): at least tomorrow, max 1 month ahead
    const today = startOfDay(new Date())
    const min = addDays(today, 1)
    const max = addMonths(today, 1)
    const selected = startOfDay(appointmentDate)

    if (isBefore(selected, min)) {
      toast({
        variant: 'destructive',
        title: 'Datum te vroeg',
        description: 'Kies een datum met minimaal 1 dag ertussen.'
      })
      return
    }
    if (isAfter(selected, max)) {
      toast({
        variant: 'destructive',
        title: 'Datum te ver',
        description: 'Kies een datum maximaal 1 maand vooruit.'
      })
      return
    }

    setSubmitWarning(null)

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          appointmentDate: format(selected, 'yyyy-MM-dd'),
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const extra = data?.hint ? ` Tip: ${data.hint}` : ''
        toast({
          variant: 'destructive',
          title: 'Versturen mislukt',
          description: (data?.error || 'Er ging iets mis bij het versturen. Probeer opnieuw.') + extra
        })
        return
      }

      // If SMTP isn't configured (or sending fails), show a clear warning.
      if (data && (data.adminEmailSent === false || data.customerEmailSent === false)) {
        const parts = []
        if (data.adminEmailSent === false) parts.push(`Admin e-mail niet verstuurd: ${data.adminEmailError || 'onbekend'}`)
        if (data.customerEmailSent === false) parts.push(`Bevestiging niet verstuurd: ${data.customerEmailError || 'onbekend'}`)
        const msg = parts.join(' • ')
        console.warn('E-mail waarschuwing:', msg)
        setSubmitWarning(msg)
      }

      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }

    // Keep success/warning visible; no auto-reset.
  }

  const [calendarLimits, setCalendarLimits] = useState(null)

  useEffect(() => {
    const today = startOfDay(new Date())
    setCalendarLimits({
      min: addDays(today, 1),
      max: addMonths(today, 1),
    })
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact</h1>
          <p className="text-xl text-primary-light leading-relaxed max-w-2xl">
            Heeft u vragen of wilt u een afspraak maken? Neem contact met ons op!
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Telefoon</h3>
              <div className="space-y-1">
                <a href="tel:+31320410140" className="text-primary hover:text-primary-dark transition-colors block">
                  0320 – 410 140
                </a>
                <a
                  href="https://wa.me/31649990444"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:text-primary-dark transition-colors block"
                >
                  WhatsApp: 06 49 99 04 44
                </a>
              </div>
              <p className="text-muted-foreground text-xs mt-2">U kunt ons ook bereiken via Whatsapp!</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Email</h3>
              <a
                href="mailto:info@doctorsmartphone.nl"
                className="text-primary hover:text-primary-dark transition-colors"
              >
                info@doctorsmartphone.nl
              </a>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Adres</h3>
              <p className="text-muted-foreground text-sm">
                Doctor Smartphone Lelystad
                <br />
                De Wissel 15
                <br />
                8232 DM Lelystad
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Openingstijden</h3>
              <p className="text-muted-foreground text-sm">
                Maandag: 12:00 – 18:00
                <br />
                Dinsdag: 10:00 – 18:00
                <br />
                Woensdag: 10:00 – 18:00
                <br />
                Donderdag: 10:00 – 20:00
                <br />
                Vrijdag: 10:00 – 18:00
                <br />
                Zaterdag: 10:00 – 17:00
                <br />
                Zondag: gesloten
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Afspraak Maken</h2>
            <p className="text-xl text-muted-foreground">Kies een datum en stuur je aanvraag in</p>
          </div>

          <div className="bg-white border border-border rounded-xl p-8">
            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-green-600">Bericht Verzonden!</h3>
                <p className="text-muted-foreground">We nemen zo snel mogelijk contact met u op.</p>
                {submitWarning ? (
                  <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    {submitWarning}
                  </p>
                ) : null}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Naam <span className="text-red-500">*</span>
                    </label>
                    <Input type="text" name="naam" value={formData.naam} onChange={handleChange} required placeholder="Uw naam" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="uw@email.nl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Telefoon <span className="text-red-500">*</span>
                    </label>
                    <Input type="tel" name="telefoon" value={formData.telefoon} onChange={handleChange} required placeholder="Bijv. 06 12345678" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apparaat Type <span className="text-red-500">*</span>
                    </label>
                    {/* Styled dropdown matching site design */}
                    <div className="w-full">
                      <ApparaatSelect value={formData.apparaat} onChange={(v) => setFormData({ ...formData, apparaat: v })} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Merk en Model</label>
                  <Input type="text" name="probleem" value={formData.probleem} onChange={handleChange} placeholder="Bijv. iPhone 15 Pro, Samsung Galaxy S24" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gewenste Afspraak <span className="text-red-500">*</span>
                  </label>
                  <div className="max-w-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {appointmentDate ? format(appointmentDate, 'dd-MM-yyyy') : <span>Kies een datum</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={appointmentDate}
                          onSelect={setAppointmentDate}
                          disabled={(date) => {
                            if (!calendarLimits) return true
                            const d = startOfDay(date)
                            return isBefore(d, calendarLimits.min) || isAfter(d, calendarLimits.max)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Minimaal 1 dag van tevoren, maximaal 1 maand vooruit.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bericht <span className="text-red-500">*</span>
                  </label>
                  <Textarea name="bericht" value={formData.bericht} onChange={handleChange} required rows={5} placeholder="Beschrijf uw probleem of vraag..." />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full font-bold text-lg py-6">
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Versturen…' : 'Verstuur Afspraak Aanvraag'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}

function ApparaatSelect({ value, onChange }) {
  const NONE = '__none__'
  const current = value || ''
  return (
    <Select value={current} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger className="rounded-xl ring-1 ring-gray-200 bg-white shadow-sm hover:shadow-md px-3 py-2 text-sm w-full">
        <SelectValue placeholder="Selecteer een type" />
      </SelectTrigger>
      <SelectContent className="rounded-xl shadow-md">
        <SelectItem value={NONE}>Selecteer een type</SelectItem>
        <SelectItem value="telefoon">Telefoon</SelectItem>
        <SelectItem value="tablet">Tablet</SelectItem>
        <SelectItem value="laptop">Laptop</SelectItem>
      </SelectContent>
    </Select>
  )
}

// (oude datum/tijd helpers verwijderd; kalender + server-validatie gebruikt)
