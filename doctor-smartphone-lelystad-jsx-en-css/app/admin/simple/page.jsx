"use client"

import { useEffect, useState } from 'react'
import { Lock, LogOut, Smartphone } from 'lucide-react'

export default function SimpleAdminPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const loggedIn = new URLSearchParams(window.location.search).get('loggedin') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-gray-600">Bezig met laden…</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white border rounded-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

          <form action="/admin/simple" method="get" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test@test.test"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wachtwoord</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <input type="hidden" name="loggedin" value="true" />

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Inloggen
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">Vul willekeurige gegevens in en klik op Inloggen</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">✅ Admin Dashboard</h1>
              <p className="text-gray-600">Je bent ingelogd!</p>
            </div>
            <a
              href="/admin/simple"
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </a>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">🎉 Het werkt!</h2>
          <p className="text-green-700">
            Als je dit ziet, werkt de basis van de website. Het probleem is dat client-side React (useState, onClick, etc.) 
            niet werkt in deze Next.js setup.
          </p>
        </div>

        {/* Data Link */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Database Beheer</h2>
          <p className="text-gray-600 mb-4">
            Bekijk alle data in de database:
          </p>
          
          <a href="/database" className="inline-block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-bold">Bekijk Database</h3>
                <p className="text-sm text-gray-600">Alle merken, toestellen en reparaties</p>
              </div>
            </div>
          </a>
        </div>

        {/* Problem Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">⚠️ Probleem: Client-side React werkt niet</h2>
          <p className="text-yellow-700 mb-2">
            In jouw setup werkt client-side React niet (useState, onClick, useEffect). Dit komt waarschijnlijk door:
          </p>
          <ul className="list-disc list-inside text-yellow-700 space-y-1 ml-4">
            <li>Next.js 16 + Turbopack heeft hydration bugs</li>
            <li>React 18/19 compatibility issue</li>
            <li>Browser extensie die scripts blokkeert</li>
          </ul>
          <p className="text-yellow-700 mt-3 font-bold">
            Oplossing: Downgrade naar Next.js 14 of gebruik server components alleen.
          </p>
        </div>
      </div>
    </div>
  )
}
