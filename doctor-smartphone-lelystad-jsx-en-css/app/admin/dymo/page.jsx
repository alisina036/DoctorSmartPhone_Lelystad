import DymoPrintComponent from '@/components/admin/dymo-simple-print'

export const metadata = {
  title: 'DYMO GDI Print Test',
}

export default function DymoPrintPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🖨️ DYMO GDI Print Test</h1>
          <p className="text-gray-600">
            Test de DYMO printer via de Python GDI bridge.
          </p>
        </div>

        <DymoPrintComponent />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔍 Lokaal Testen</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Formulier verstuurt productName, price, sku</li>
              <li>✓ Next proxy forward naar Python backend</li>
              <li>✓ Backend print via win32ui (GDI)</li>
              <li>✓ Duidelijke success/error feedback</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              Open DevTools: F12 → Console tab
            </p>
          </div>

          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <h2 className="text-xl font-bold mb-4">🖨️ Met Printer</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. DYMO LabelWriter 450 USB aansluiten</li>
              <li>2. Start scripts/dymo_native_flask_server.py</li>
              <li>3. Controleer status op poort 5001</li>
              <li>4. Klik Print → Label komt uit printer!</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              Frontend gebruikt alleen de Python bridge
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h2 className="text-xl font-bold mb-4">🛠️ Hoe Het Werkt</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Frontend:</strong> POST naar /api/admin/dymo/python-native-proxy</li>
              <li><strong>Proxy:</strong> stuurt JSON door naar http://127.0.0.1:5001/print</li>
              <li><strong>Backend:</strong> print via GDI (win32ui)</li>
              <li><strong>Fallback:</strong> geen XML of DYMO Web Service</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
            <h2 className="text-xl font-bold mb-4">🏷️ Label Format</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Methode:</strong> GDI canvas print</p>
              <p><strong>Rotatie:</strong> 90 graden</p>
              <p><strong>Printer:</strong> DYMO LabelWriter 450</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">💻 Code Voorbeeld</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { printLabel } from '@/lib/dymoService'

const result = await printLabel({
  name: 'iPhone 16 Plus Case',
  price: 29.99,
  sku: '24082133930'
})

if (result.success) {
  console.log('✅ Geprint!')
} else {
  console.log('⚠️ Print mislukt:', result.message)
}`}
          </pre>
        </div>

        <div className="mt-8 bg-gray-900 text-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Wat Gebeurt Er Nu?</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <strong>Lokaal (zonder server):</strong>
                <p className="text-gray-300 mt-1">Status toont dat Python server gestart moet worden</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏪</span>
              <div>
                <strong>In winkel (met printer):</strong>
                <p className="text-gray-300 mt-1">Klik Print → Label komt direct uit printer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
