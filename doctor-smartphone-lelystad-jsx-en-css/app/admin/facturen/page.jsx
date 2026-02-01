export const dynamic = "force-dynamic"

import { Lock } from "lucide-react"
import { cookies } from "next/headers"
import InvoiceAdminPage from "@/components/admin/invoice-admin-page"
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session"

export const metadata = {
  title: "Admin Facturen",
}

export default async function AdminFacturenPage({ searchParams }) {
  const params = await searchParams

  const email = params?.email
  const password = params?.password
  const isLoginAttempt = params?.loggedin === "true"

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminSessionCookieName())?.value
  const hasValidSession = verifyAdminSessionToken(sessionToken)

  const isAuthenticatedByQuery = isLoginAttempt && email === "test@test.com" && password === "test123"
  const isAuthenticated = hasValidSession || isAuthenticatedByQuery
  const showLoginError = params?.error === "1"

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white border rounded-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#3ca0de] rounded-lg flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-3">Admin Login</h1>
          <p className="text-sm text-gray-600 text-center mb-6">Log in om facturen te beheren.</p>

          {showLoginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              Verkeerde inloggegevens. Probeer het opnieuw.
            </div>
          )}

          <form action="/api/admin/login" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="test@test.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wachtwoord</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="••••••••"
              />
            </div>

            <input type="hidden" name="redirect" value="/admin/facturen" />

            <button
              type="submit"
              className="w-full bg-[#3ca0de] text-white py-3 rounded-lg hover:bg-[#2d8bc7] font-medium"
            >
              Inloggen
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">Gebruik: test@test.com / test123</p>
          <div className="text-center mt-4">
            <a href="/admin" className="underline text-sm text-gray-700">Naar admin dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  return <InvoiceAdminPage />
}
