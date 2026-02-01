import DymoPrintComponent from '@/components/admin/dymo-simple-print'

export const metadata = {
  title: 'DYMO 550 Print Test',
}

export default function DymoPrintPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🖨️ DYMO 550 Print Test</h1>
          <p className="text-gray-600">
            Test de DYMO printer functie. Zonder printer? De XML verschijnt in een modal!
          </p>
        </div>

        <DymoPrintComponent />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔍 Thuis Testen</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ XML verschijnt in mooie modal</li>
              <li>✓ Console.log toont volledige XML</li>
              <li>✓ Copy XML knop</li>
              <li>✓ Product info preview</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              Open DevTools: F12 → Console tab
            </p>
          </div>

          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <h2 className="text-xl font-bold mb-4">🖨️ Met Printer</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. DYMO Connect installeren</li>
              <li>2. DYMO 550 USB aansluiten</li>
              <li>3. Service draait op poort 41951</li>
              <li>4. Klik Print → Label komt uit printer!</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              Download: dymo.com/downloads
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h2 className="text-xl font-bold mb-4">🛠️ Hoe Het Werkt</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Printer beschikbaar?</strong> Direct printen</li>
              <li><strong>Printer niet beschikbaar?</strong> XML modal verschijnt</li>
              <li><strong>Console logs?</strong> Altijd beschikbaar</li>
              <li><strong>Thuis testen?</strong> Modal toont exact wat geprint wordt</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
            <h2 className="text-xl font-bold mb-4">🏷️ Label Format</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Template:</strong> DYMO 11354</p>
              <p><strong>Size:</strong> 54mm × 101mm</p>
              <p><strong>Barcode:</strong> Code128</p>
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
  console.log('⚠️ Debug modus - XML in modal')
}`}
          </pre>
        </div>

        <div className="mt-8 bg-gray-900 text-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Wat Gebeurt Er Nu?</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <strong>Thuis (zonder printer):</strong>
                <p className="text-gray-300 mt-1">Klik Print → Modal met XML → Console logs</p>
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
