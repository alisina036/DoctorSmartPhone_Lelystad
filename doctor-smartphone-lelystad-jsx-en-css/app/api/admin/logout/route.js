import { NextResponse } from "next/server"
import { getAdminSessionCookieName } from "@/lib/admin-session"

export async function GET(request) {
  const url = new URL(request.url)
  const redirect = url.searchParams.get("redirect") || "/admin"
  const safeRedirect = typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/admin"

  const res = NextResponse.redirect(new URL(safeRedirect, request.url))
  res.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  })
  return res
}
