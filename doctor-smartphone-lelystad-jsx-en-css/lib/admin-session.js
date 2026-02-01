import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import { User } from "@/lib/models/User"

const COOKIE_NAME = "dsl_admin_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ""
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""

function secret() {
  return process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me"
}

export function getAdminSessionCookieName() {
  return COOKIE_NAME
}

export function getAdminSessionMaxAgeSeconds() {
  return MAX_AGE_SECONDS
}

export async function ensureAdminUserExists() {
  await connectDB()
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL of ADMIN_PASSWORD ontbreekt in env.")
  }
  const existing = await User.findOne({ email: ADMIN_EMAIL }).lean()
  if (existing) return existing
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const user = await User.create({
    id: `user-${Date.now()}`,
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
  })
  return user.toObject ? user.toObject() : user
}

export async function validateAdminCredentials(email, password) {
  await connectDB()
  const user = await User.findOne({ email: String(email || "").trim() }).lean()
  if (!user) return null
  const match = await bcrypt.compare(String(password || ""), String(user.passwordHash || ""))
  if (!match) return null
  return user
}

export function createAdminSessionToken(user) {
  const payload = {
    sub: String(user?.id || ""),
    email: String(user?.email || ""),
    role: String(user?.role || "admin"),
  }
  return jwt.sign(payload, secret(), { expiresIn: MAX_AGE_SECONDS })
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== "string") return false
  try {
    jwt.verify(token, secret())
    return true
  } catch {
    return false
  }
}
