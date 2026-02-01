export const runtime = "nodejs"

import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { addDays, addMonths, format, isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns'
import { resolveMx } from 'dns/promises'
import connectDB from '@/lib/mongodb'
import { Appointment, ensureAppointmentIndexes } from '@/lib/models/Appointment'

function mongoHintFromError(err) {
  const fallback =
    'Database connectie faalde. Controleer MONGODB_URI en (bij MongoDB Atlas) de IP Access List (whitelist) en gebruikersnaam/wachtwoord.'

  const message = String(err?.message || err || '').toLowerCase()
  const name = String(err?.name || '').toLowerCase()

  // Duplicate key errors (indexes)
  if (message.includes('e11000 duplicate key') || name.includes('mongoservererror')) {
    if (message.includes('index: id_1') || message.includes(' id_1 ') || message.includes('dup key: { id: null')) {
      return 'Database index-conflict (legacy `id_1`). Verwijder de `id_1` index op de appointments collectie (of herstart na auto-fix).'
    }
    return 'Database fout door duplicate key/index. Controleer MongoDB indexes op de appointments collectie.'
  }

  // Missing env/config
  if (message.includes('mongodb_uri') && message.includes('ontbreekt')) {
    return 'MONGODB_URI ontbreekt. Zet MONGODB_URI in .env.local en herstart de dev server.'
  }

  // DNS/SRV issues (common with mongodb+srv)
  if (
    message.includes('querysrv') ||
    message.includes('enotfound') ||
    message.includes('eai_again') ||
    message.includes('failed to resolve')
  ) {
    return 'Kan de MongoDB host niet vinden (DNS/SRV). Controleer je MONGODB_URI (cluster host) en netwerk/DNS.'
  }

  // IP Access List / network blocked
  if (
    message.includes('access list') ||
    message.includes('whitelist') ||
    message.includes('not allowed')
  ) {
    return 'MongoDB Atlas blokkeert je IP. Voeg je IP toe in Atlas → Network Access (IP Access List), of sta tijdelijk 0.0.0.0/0 toe voor testen.'
  }

  // Auth errors
  if (
    message.includes('authentication failed') ||
    message.includes('bad auth') ||
    message.includes('auth failed') ||
    message.includes('requires authentication') ||
    message.includes('unauthorized')
  ) {
    return 'Authenticatie naar MongoDB faalde. Controleer Atlas gebruikersnaam/wachtwoord en encodeer speciale tekens in je wachtwoord (URL-encoding).'
  }

  // TLS/handshake/cert
  if (message.includes('tls') || message.includes('ssl') || message.includes('handshake')) {
    return 'TLS/SSL connectie probleem met MongoDB. Controleer je connection string en of je netwerk TLS verkeer toestaat.'
  }

  // Generic selection/network timeout
  if (
    name.includes('mongoserverselectionerror') ||
    message.includes('server selection') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    message.includes('econnrefused')
  ) {
    return 'Kan geen verbinding maken met MongoDB (timeout/refused). Controleer Atlas IP Access List en of de cluster actief is.'
  }

  return fallback
}

function getAdminRecipientEmail() {
  return process.env.APPOINTMENTS_TO_EMAIL || 'alisinamohammadi32@gmail.com'
}

function getFromEmail() {
  return (
    process.env.APPOINTMENTS_FROM_EMAIL ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    'no-reply@doctorsmartphone.nl'
  )
}

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  }

  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
  if (gmailUser && gmailAppPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    })
  }

  return null
}

function validateAppointmentDate(dateStr) {
  // Expect yyyy-MM-dd
  const parsed = startOfDay(parseISO(dateStr))
  if (!isValid(parsed)) {
    return { ok: false, error: 'Datum is ongeldig. Kies een geldige datum.' }
  }

  const today = startOfDay(new Date())
  const min = addDays(today, 1)
  const max = addMonths(today, 1)

  if (isBefore(parsed, min)) {
    return { ok: false, error: 'Kies een datum met minimaal 1 dag ertussen.' }
  }

  if (isAfter(parsed, max)) {
    return { ok: false, error: 'Kies een datum maximaal 1 maand vooruit.' }
  }

  return { ok: true, date: parsed }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isValidEmail(value) {
  const v = String(value || '').trim()
  // Simple sanity check; client still enforces type=email.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function hasValidEmailDomain(email) {
  const domain = String(email || '').split('@')[1] || ''
  if (!domain) return false

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 2000)
  )

  try {
    const records = await Promise.race([resolveMx(domain), timeout])
    return Array.isArray(records) && records.length > 0
  } catch {
    return false
  }
}

function emailLayout({ title, preheader, bodyHtml }) {
  const safeTitle = escapeHtml(title)
  const safePreheader = escapeHtml(preheader || '')
  const brand = '#3ca0de'
  const font =
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:${font};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
            <tr>
              <td style="padding:18px 20px;border-radius:16px 16px 0 0;background:${brand};color:#ffffff;">
                <div style="font-size:18px;font-weight:800;line-height:1.2;letter-spacing:0.2px;">Doctor Smartphone Lelystad</div>
                <div style="font-size:12px;opacity:0.92;margin-top:6px;">Afspraak aanvraag via de website</div>
              </td>
            </tr>

            <tr>
              <td style="padding:22px;border-radius:0 0 16px 16px;background:#ffffff;color:#111827;">
                ${bodyHtml}

                <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
                  <div style="font-weight:700;color:#111827;">Contact</div>
                  <div>Telefoon: <a href="tel:+31320410140" style="color:${brand};text-decoration:none;">0320 – 410 140</a> • WhatsApp: <a href="https://wa.me/31649990444" style="color:${brand};text-decoration:none;">06 49 99 04 44</a></div>
                  <div>Adres: De Wissel 15, 8232 DM Lelystad</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function kvRow(label, value) {
  const safeLabel = escapeHtml(label)
  const safeValue = escapeHtml(value || '-')
  return `
    <tr>
      <td style="padding:10px 12px;border-top:1px solid #eef2f7;color:#6b7280;font-size:13px;width:170px;vertical-align:top;">${safeLabel}</td>
      <td style="padding:10px 12px;border-top:1px solid #eef2f7;color:#111827;font-size:13px;">${safeValue}</td>
    </tr>`
}

function renderAdminEmailHtml({ naam, email, telefoon, apparaat, probleem, formattedDateNl, bericht }) {
  const message = escapeHtml(bericht || '').replace(/\r?\n/g, '<br />')

  const bodyHtml = `
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;">Nieuwe afspraak aanvraag</h1>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;line-height:1.6;">
      Er is een nieuwe afspraak aanvraag ingediend via de website.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #eef2f7;border-radius:12px;overflow:hidden;">
      ${kvRow('Naam', naam)}
      ${kvRow('Email', email)}
      ${kvRow('Telefoon', telefoon)}
      ${kvRow('Apparaat', apparaat)}
      ${kvRow('Merk/Model', probleem)}
      ${kvRow('Datum', formattedDateNl)}
    </table>

    <div style="margin-top:16px;padding:14px 14px;border:1px solid #eef2f7;border-radius:12px;background:#fafafa;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Bericht</div>
      <div style="font-size:14px;line-height:1.7;color:#111827;white-space:normal;">${message}</div>
    </div>
  `

  return emailLayout({
    title: `Nieuwe afspraak aanvraag (${formattedDateNl})`,
    preheader: `Nieuwe afspraak aanvraag van ${naam} voor ${formattedDateNl}`,
    bodyHtml,
  })
}

function renderCustomerEmailHtml({ naam, apparaat, probleem, formattedDateNl }) {
  const bodyHtml = `
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;">Bevestiging afspraak aanvraag</h1>
    <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;line-height:1.6;">
      Hoi ${escapeHtml(naam)},<br />
      Bedankt voor je aanvraag. We hebben je verzoek ontvangen en nemen zo snel mogelijk contact met je op.
    </p>

    <div style="padding:14px 14px;border:1px solid #eef2f7;border-radius:12px;background:#fafafa;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:10px;">Samenvatting</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px;">Datum</td>
          <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${escapeHtml(formattedDateNl)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">Apparaat</td>
          <td style="padding:6px 0;color:#111827;font-size:13px;">${escapeHtml(apparaat || '-')}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">Merk/Model</td>
          <td style="padding:6px 0;color:#111827;font-size:13px;">${escapeHtml(probleem || '-')}</td>
        </tr>
      </table>
    </div>

    <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Tip: heb je haast? Bel ons even, dan kijken we meteen wat mogelijk is.
    </p>
  `

  return emailLayout({
    title: 'Bevestiging afspraak aanvraag - Doctor Smartphone',
    preheader: `We hebben je aanvraag ontvangen voor ${formattedDateNl}`,
    bodyHtml,
  })
}

export async function POST(request) {
  let body = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON body.' }, { status: 400 })
  }

  const naam = String(body?.naam || '').trim()
  const email = String(body?.email || '').trim()
  const telefoon = String(body?.telefoon || '').trim()
  const apparaat = String(body?.apparaat || '').trim()
  const probleem = String(body?.probleem || '').trim()
  const bericht = String(body?.bericht || '').trim()
  const appointmentDate = String(body?.appointmentDate || '').trim()

  if (!naam || !email || !telefoon || !apparaat || !appointmentDate || !bericht) {
    return NextResponse.json(
      {
        error:
          'Vul alle verplichte velden in (naam, email, telefoon, apparaat, datum en bericht).',
      },
      { status: 400 },
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'E-mailadres is ongeldig.' }, { status: 400 })
  }

  const domainOk = await hasValidEmailDomain(email)
  if (!domainOk) {
    return NextResponse.json({ error: 'E-mail domein bestaat niet of heeft geen mailrecords.' }, { status: 400 })
  }

  const dateCheck = validateAppointmentDate(appointmentDate)
  if (!dateCheck.ok) {
    return NextResponse.json({ error: dateCheck.error }, { status: 400 })
  }

  const formattedDateNl = format(dateCheck.date, 'dd-MM-yyyy')

  // Persist in DB (so it shows up in admin panel), independent from email config.
  let appointmentId = null
  try {
    await connectDB()

    // Ensure collection indexes are in a good state (best-effort).
    try {
      await ensureAppointmentIndexes()
    } catch {
      // ignore
    }

    const expireAfter = addDays(startOfDay(dateCheck.date), 7)

    const created = await Appointment.create({
      naam,
      email,
      telefoon,
      apparaat,
      probleem,
      bericht,
      appointmentDate: startOfDay(dateCheck.date),
      expireAfter,
    })

    appointmentId = String(created?._id || '')
  } catch (dbErr) {
    const debugId = Math.random().toString(36).slice(2, 10)
    console.error(`Failed to persist appointment [${debugId}]:`, dbErr)
    return NextResponse.json(
      {
        error: 'Opslaan van de afspraak is mislukt. Probeer opnieuw.',
        hint: mongoHintFromError(dbErr),
        ...(process.env.NODE_ENV !== 'production'
          ? {
              debugId,
              details: dbErr?.message ? String(dbErr.message) : String(dbErr),
              dbErrorName: dbErr?.name ? String(dbErr.name) : undefined,
            }
          : { debugId }),
      },
      { status: 500 }
    )
  }

  const adminTo = getAdminRecipientEmail()
  const from = getFromEmail()

  const transporter = getTransporter()
  if (!transporter) {
    return NextResponse.json(
      {
        error:
          'Afspraak is opgeslagen, maar e-mail is nog niet geconfigureerd. Zet SMTP_* of GMAIL_USER/GMAIL_APP_PASSWORD in .env.local.',
        hint:
          'Voor Gmail: maak een App Password aan en zet GMAIL_USER en GMAIL_APP_PASSWORD. (Gewoon wachtwoord werkt meestal niet.)',
        appointmentId,
      },
      { status: 500 },
    )
  }

  let adminEmailSent = true
  let customerEmailSent = true
  let adminEmailError = null
  let customerEmailError = null

  const adminSubject = `Nieuwe afspraak aanvraag (${formattedDateNl}) - ${naam}`
  const adminText = [
    'Nieuwe afspraak aanvraag:',
    '',
    `Naam: ${naam}`,
    `Email: ${email}`,
    `Telefoon: ${telefoon}`,
    `Apparaat: ${apparaat}`,
    `Merk/Model: ${probleem || '-'}`,
    `Datum: ${formattedDateNl}`,
    '',
    'Bericht:',
    bericht,
  ].join('\n')

  const customerSubject = `Bevestiging afspraak aanvraag - Doctor Smartphone`
  const customerText = [
    `Hoi ${naam},`,
    '',
    'Bedankt voor je afspraak aanvraag. We hebben je verzoek ontvangen.',
    '',
    `Datum: ${formattedDateNl}`,
    `Apparaat: ${apparaat}`,
    `Merk/Model: ${probleem || '-'}`,
    '',
    'We nemen zo snel mogelijk contact met je op om de afspraak te bevestigen.',
    '',
    'Met vriendelijke groet,',
    'Doctor Smartphone Lelystad',
  ].join('\n')

  const adminHtml = renderAdminEmailHtml({
    naam,
    email,
    telefoon,
    apparaat,
    probleem,
    formattedDateNl,
    bericht,
  })

  const customerHtml = renderCustomerEmailHtml({
    naam,
    apparaat,
    probleem,
    formattedDateNl,
  })

  try {
    await transporter.sendMail({
      from,
      to: adminTo,
      replyTo: email,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    })
  } catch (err) {
    adminEmailSent = false
    adminEmailError = err?.message ? String(err.message) : 'Onbekende fout'
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    })
  } catch (err) {
    customerEmailSent = false
    customerEmailError = err?.message ? String(err.message) : 'Onbekende fout'
  }

  return NextResponse.json(
    {
      ok: true,
      adminEmailSent,
      customerEmailSent,
      adminEmailError,
      customerEmailError,
      appointmentId,
    },
    { status: 200 },
  )
}
