export const runtime = "nodejs"

import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function getFromEmail() {
  return (
    process.env.INVOICE_FROM_EMAIL ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    "no-reply@doctorsmartphone.nl"
  )
}

function getCompanyRecipientEmail() {
  return (
    process.env.INVOICE_COMPANY_EMAIL ||
    process.env.APPOINTMENTS_TO_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    ""
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
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    })
  }

  return null
}

function isValidEmail(value) {
  const v = String(value || "").trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDateNl(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("nl-NL", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function warrantyNoteByDescription(description) {
  const text = String(description || "").toLowerCase()
  if (!text) return ""
  const noWarranty = [/achterkant\s*glas/i, /oplaadpoort/i, /cameralens/i]
  if (noWarranty.some((rx) => rx.test(text))) return ""

  const hasWarranty = [
    /scherm\s*(reparatie|vervangen)/i,
    /achterkant\s*behuizing/i,
    /batterij\s*vervangen/i,
    /achter\s*camera/i,
    /voor\s*camera/i,
    /oorspeaker/i,
  ]
  if (hasWarranty.some((rx) => rx.test(text))) {
    return "Garantie: 3 maanden op de werking van dit onderdeel. Val-, stoot-, breuk- en waterschade zijn uitgesloten van garantie."
  }

  return ""
}

function buildInvoiceHtml(payload) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "")
  const logoUrl = baseUrl ? `${baseUrl}/doctor-smartphone-logo..png` : ""
  const lines = Array.isArray(payload?.lines) ? payload.lines : []
  const rows = lines
    .map((line) => {
      const qty = Number(line?.quantity || 0)
      const price = Number(line?.price || 0)
      const total = qty * price
      const details = String(line?.details || "").trim()
      const warranty = warrantyNoteByDescription(line?.description)
      const detailsHtml = details
        ? `<div style="margin-top:4px;color:#6b7280;font-size:11px;">${escapeHtml(details)}</div>`
        : ""
      const warrantyHtml = warranty
        ? `<div style="margin-top:4px;color:#9ca3af;font-size:11px;">${escapeHtml(warranty)}</div>`
        : ""
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(line?.description || "-")}${warrantyHtml}${detailsHtml}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(price)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(total)}</td>
      </tr>`
    })
    .join("")

  const subtotal = Number(payload?.totals?.subtotal || 0)
  const vatAmount = Number(payload?.totals?.vatAmount || 0)
  const totalAmount = Number(payload?.totals?.total || 0)
  const paymentMethod = String(payload?.paymentMethod || "")
  const iban = String(payload?.iban || "").trim()

  return `
    <div style="border:1px solid #dbeafe;border-radius:14px;overflow:hidden;">
      <div style="background:#e0f2fe;padding:16px 18px;border-bottom:1px solid #bae6fd;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
          <div style="text-align:left;">
            <div style="font-size:18px;font-weight:800;color:#0f172a;">Factuur</div>
            <div style="font-size:12px;color:#2563eb;">${escapeHtml(payload?.typeLabel || "Factuur")}</div>
          </div>
          <div style="text-align:center;">
            ${logoUrl ? `<img src=\"${logoUrl}\" alt=\"Doctor Smartphone\" style=\"height:216px;\" />` : ""}
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:#1d4ed8;">Factuurnummer</div>
            <div style="font-size:20px;font-weight:800;color:#0f172a;">${escapeHtml(payload?.number || "-")}</div>
            <div style="font-size:12px;color:#1d4ed8;">Datum: ${escapeHtml(formatDateNl(payload?.invoiceDate))}</div>
          </div>
        </div>
      </div>

      <div style="padding:18px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#eff6ff;text-align:left;">
              <th style="padding:8px 10px;">Omschrijving</th>
              <th style="padding:8px 10px;text-align:right;">Aantal</th>
              <th style="padding:8px 10px;text-align:right;">Prijs (incl. BTW)</th>
              <th style="padding:8px 10px;text-align:right;">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="4" style="padding:8px 10px;color:#6b7280;">Geen regels</td></tr>`}
          </tbody>
        </table>

        <table style="width:100%;margin-top:14px;font-size:13px;">
          <tr>
            <td style="padding:4px 0;">Subtotaal (excl. BTW)</td>
            <td style="padding:4px 0;text-align:right;">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;">BTW</td>
            <td style="padding:4px 0;text-align:right;">${formatCurrency(vatAmount)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:700;border-top:1px solid #e5e7eb;">Totaal (incl. BTW)</td>
            <td style="padding:6px 0;text-align:right;font-weight:700;border-top:1px solid #e5e7eb;">${formatCurrency(totalAmount)}</td>
          </tr>
        </table>

        ${paymentMethod === "Bankoverschrijving" && iban ? `
          <div style="margin-top:10px;font-size:12px;color:#111827;">
            IBAN (bankoverschrijving): ${escapeHtml(iban)}
          </div>
        ` : ""}

        ${payload?.extraNote ? `<p style="margin-top:12px;color:#6b7280;font-size:12px;">${escapeHtml(payload.extraNote)}</p>` : ""}
      </div>
    </div>
  `
}

export async function POST(request) {
  try {
    const payload = await request.json()

    const useCompany = Boolean(payload?.toCompany)
    const recipient = useCompany
      ? String(getCompanyRecipientEmail() || "").trim()
      : String(payload?.to || "").trim()

    if (!isValidEmail(recipient)) {
      return NextResponse.json({ sent: false, error: "Ongeldig e-mailadres." }, { status: 400 })
    }

    const transporter = getTransporter()
    if (!transporter) {
      return NextResponse.json({ sent: false, error: "SMTP niet geconfigureerd." }, { status: 200 })
    }

    const subject = `Factuur ${payload?.number || ""} - Doctor Smartphone Lelystad`
    const html = buildInvoiceHtml(payload)

    await transporter.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject,
      html,
    })

    return NextResponse.json({ sent: true })
  } catch (error) {
    return NextResponse.json({ sent: false, error: String(error?.message || error) }, { status: 500 })
  }
}
