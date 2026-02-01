"use server"

import { revalidatePath } from "next/cache"
import connectDB from "@/lib/mongodb"
import { Appointment, ensureAppointmentIndexes } from "@/lib/models/Appointment"
import nodemailer from "nodemailer"

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatDateNl(date) {
  if (!date) return "-"
  try {
    return new Date(date).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return String(date)
  }
}

function getFromEmail() {
  return (
    process.env.APPOINTMENTS_FROM_EMAIL ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    "no-reply@doctorsmartphone.nl"
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
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    })
  }

  return null
}

function renderDeletedCustomerEmailHtml({ naam, appointmentDate, apparaat, probleem, kind }) {
  const brand = "#3ca0de"
  const safeName = escapeHtml(naam || "")
  const safeDevice = escapeHtml(apparaat || "-")
  const safeModel = escapeHtml(probleem || "-")
  const dateNl = formatDateNl(appointmentDate)
  const title = kind === "hard" ? "Afspraak definitief verwijderd" : "Afspraak verwijderd"
  const subtitle =
    kind === "hard"
      ? "Je afspraak aanvraag is definitief verwijderd uit ons systeem."
      : "Je afspraak aanvraag is verwijderd in ons systeem."

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
            <tr>
              <td style="padding:18px 20px;border-radius:16px 16px 0 0;background:${brand};color:#ffffff;">
                <div style="font-size:18px;font-weight:800;line-height:1.2;">Doctor Smartphone Lelystad</div>
                <div style="font-size:12px;opacity:0.92;margin-top:6px;">${escapeHtml(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;border-radius:0 0 16px 16px;background:#ffffff;color:#111827;">
                <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;line-height:1.6;">Hoi ${safeName || ""},<br />${escapeHtml(
    subtitle
  )}</p>

                <div style="padding:14px 14px;border:1px solid #eef2f7;border-radius:12px;background:#fafafa;">
                  <div style="font-size:13px;color:#6b7280;margin-bottom:10px;">Samenvatting</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px;">Datum</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${escapeHtml(dateNl)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Apparaat</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">${safeDevice}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Merk/Model</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">${safeModel}</td>
                    </tr>
                  </table>
                </div>

                <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                  Als dit niet klopt of je wilt een nieuwe afspraak maken, neem dan contact met ons op.
                </p>

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

async function sendAppointmentDeletedEmail({ appointment, kind }) {
  const to = String(appointment?.email || "").trim()
  if (!to) return

  const transporter = getTransporter()
  if (!transporter) {
    console.warn("Email not configured; cannot send delete confirmation")
    return
  }

  const from = getFromEmail()
  const dateNl = formatDateNl(appointment?.appointmentDate)
  const subject =
    kind === "hard"
      ? `Afspraak definitief verwijderd (${dateNl}) - Doctor Smartphone`
      : `Afspraak verwijderd (${dateNl}) - Doctor Smartphone`

  const text = [
    `Hoi ${String(appointment?.naam || "").trim()},`,
    "",
    kind === "hard"
      ? "Je afspraak aanvraag is definitief verwijderd uit ons systeem."
      : "Je afspraak aanvraag is verwijderd in ons systeem.",
    "",
    `Datum: ${dateNl}`,
    `Apparaat: ${String(appointment?.apparaat || "-").trim()}`,
    `Merk/Model: ${String(appointment?.probleem || "-").trim()}`,
    "",
    "Als dit niet klopt of je wilt een nieuwe afspraak maken, neem contact met ons op.",
    "",
    "Met vriendelijke groet,",
    "Doctor Smartphone Lelystad",
  ].join("\n")

  const html = renderDeletedCustomerEmailHtml({
    naam: appointment?.naam,
    appointmentDate: appointment?.appointmentDate,
    apparaat: appointment?.apparaat,
    probleem: appointment?.probleem,
    kind,
  })

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

export async function listAppointments() {
  await connectDB()

  // Ensure collection indexes are in a good state (best-effort)
  try {
    await ensureAppointmentIndexes()
  } catch {
    // ignore
  }

  const items = await Appointment.find({}).sort({ createdAt: -1 }).lean()
  return JSON.parse(JSON.stringify(items))
}

export async function softDeleteAppointment(id) {
  await connectDB()
  const now = new Date()
  const deleteAfter = addDays(now, 7)

  const existing = await Appointment.findById(id).lean()

  await Appointment.updateOne({ _id: id }, { $set: { deletedAt: now, deleteAfter } })

  // Notify customer (best-effort)
  try {
    if (existing && !existing.deletedAt) {
      await sendAppointmentDeletedEmail({ appointment: existing, kind: "soft" })
    }
  } catch (e) {
    console.error("Failed to send deleted email (soft):", e)
  }

  revalidatePath("/admin/afspraken")
}

export async function restoreAppointment(id) {
  await connectDB()

  await Appointment.updateOne(
    { _id: id },
    { $set: { deletedAt: null, deleteAfter: null } }
  )

  revalidatePath("/admin/afspraken")
}

export async function hardDeleteAppointment(id) {
  await connectDB()

  const existing = await Appointment.findById(id).lean()

  // Notify customer (best-effort) before deleting
  try {
    if (existing) {
      await sendAppointmentDeletedEmail({ appointment: existing, kind: "hard" })
    }
  } catch (e) {
    console.error("Failed to send deleted email (hard):", e)
  }

  await Appointment.deleteOne({ _id: id })

  revalidatePath("/admin/afspraken")
}
