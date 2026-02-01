import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionMaxAgeSeconds,
  ensureAdminUserExists,
  validateAdminCredentials,
} from "@/lib/admin-session"

function getNotifyRecipient() {
  return (
    process.env.ADMIN_LOGIN_NOTIFY_EMAIL ||
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

async function sendLoginNotification(request, email) {
  const to = String(getNotifyRecipient() || "").trim()
  if (!to) return

  const transporter = getTransporter()
  if (!transporter) return

  const headers = request.headers
  const forwardedFor = headers.get("x-forwarded-for") || ""
  const ip = (forwardedFor.split(",")[0] || headers.get("x-real-ip") || "").trim()
  const userAgent = headers.get("user-agent") || "-"
  const country = headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "-"
  const city = headers.get("x-vercel-ip-city") || "-"
  const now = new Date()
  const timestamp = now.toLocaleString("nl-NL", { hour12: false })

  const subject = `Admin login • ${timestamp}`
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
      <h2 style="margin:0 0 10px 0;">Admin login</h2>
      <p style="margin:0 0 12px 0;">Er is ingelogd op het admin-paneel.</p>
      <table style="border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">E-mail</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${email}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Tijd</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${timestamp}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">IP</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${ip || "-"}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Locatie</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${city} ${country}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">User-Agent</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${userAgent}</td></tr>
      </table>
    </div>
  `

  await transporter.sendMail({
    from: process.env.SMTP_USER || process.env.GMAIL_USER || "no-reply@doctorsmartphone.nl",
    to,
    subject,
    html,
  })
}

function redirectTo(path, requestUrl) {
  return NextResponse.redirect(new URL(path, requestUrl))
}

function setSessionCookie(res, user) {
  res.cookies.set(getAdminSessionCookieName(), createAdminSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getAdminSessionMaxAgeSeconds(),
  })
}

function getRedirect(searchParams, fallback) {
  const redir = searchParams?.get("redirect") || fallback
  if (typeof redir !== "string") return fallback
  if (!redir.startsWith("/")) return fallback
  return redir
}

export async function GET(request) {
  const url = new URL(request.url)
  const email = url.searchParams.get("email") || ""
  const password = url.searchParams.get("password") || ""
  const redirect = getRedirect(url.searchParams, "/admin")

  await ensureAdminUserExists()
  const user = await validateAdminCredentials(email, password)
  if (!user) {
    return redirectTo(`${redirect}?error=1`, request.url)
  }

  const res = redirectTo(redirect, request.url)
  setSessionCookie(res, user)
  try {
    await sendLoginNotification(request, email)
  } catch {}
  return res
}

export async function POST(request) {
  const form = await request.formData()
  const email = String(form.get("email") || "")
  const password = String(form.get("password") || "")
  const redirect = String(form.get("redirect") || "/admin")

  const safeRedirect = redirect.startsWith("/") ? redirect : "/admin"

  await ensureAdminUserExists()
  const user = await validateAdminCredentials(email, password)
  if (!user) {
    return redirectTo(`${safeRedirect}?error=1`, request.url)
  }

  const res = redirectTo(safeRedirect, request.url)
  setSessionCookie(res, user)
  try {
    await sendLoginNotification(request, email)
  } catch {}
  return res
}
