'use client'

import { useState } from 'react'
import { Printer, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DymoStatusCard } from '@/components/admin/dymo-print-button'
import DymoService from '@/lib/dymo-service'

/**
 * DYMO Test & Demo Page
 * Voor testen van DYMO printer en label templates
 */
export function DymoTestPage() {
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [testProducts, setTestProducts] = useState([
    {
      id: 1,
      name: 'iPhone 15 Pro Case',
      price: 29.99,
      barcode: '5902587654321',
      sku: 'IPHONE15-CASE-001'
    },
    {
      id: 2,
      name: 'Samsung Galaxy A54 Screen',
      price: 149.99,
      barcode: '8901234567890',
      sku: 'SAMSNGA54-SCR-001'
    },
    {
      id: 3,
      name: 'Xssive Anti Shock Back Cover',
      price: 19.99,
      barcode: '24082133930',
      sku: 'XSSIVE-001'
    },
    {
      id: 4,
      name: 'USB-C Fast Charger 65W',
      price: 34.99,
      barcode: '6789012345678',
      sku: 'CHARGER-USB-C-65W'
    }
  ])

  const runTest = async (testName, testFn) => {
    setLoading(true)
    setTestResult(null)

    try {
      const result = await testFn()
      setTestResult({
        name: testName,
        success: true,
        message: result.message || 'Test geslaagd',
        details: result
      })
    } catch (error) {
      setTestResult({
        name: testName,
        success: false,
        message: error.message || 'Test mislukt',
        error: error
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusCheck = async () => {
    await runTest('DYMO Status Check', async () => {
      return await DymoService.checkDymoStatus()
    })
  }

  const handlePrintTest = async () => {
    await runTest('Test Label Printen', async () => {
      return await DymoService.printTestLabel()
    })
  }

  const handlePrintProduct = async (product) => {
    await runTest(`Print: ${product.name}`, async () => {
      return await DymoService.printLabel(product, 1)
    })
  }

  const handleBarcodeValidation = async (barcode) => {
    const validation = DymoService.validateBarcode(barcode)
    setTestResult({
      name: 'Barcode Validatie',
      success: validation.valid,
      message: validation.valid ? 'Barcode is geldig' : validation.error,
      details: { barcode, validation }
    })
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">DYMO Test & Demo</h1>
        <p className="text-gray-600">Test DYMO LabelWriter 450 verbinding en label printing</p>
      </div>

      {/* DYMO Status */}
      <DymoStatusCard />

      {/* Test Results */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {testResult.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={testResult.success ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
              {testResult.message}
            </p>
            {testResult.details && (
              <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-64 border">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verbindings Tests</CardTitle>
            <CardDescription>Test DYMO service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleStatusCheck}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? 'Controleren...' : 'Status Controleren'}
            </Button>

            <Button
              onClick={handlePrintTest}
              disabled={loading}
              className="w-full gap-2"
            >
              <Printer className="w-4 h-4" />
              {loading ? 'Printen...' : 'Test Label Printen'}
            </Button>
          </CardContent>
        </Card>

        {/* Barcode Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Barcode Tests</CardTitle>
            <CardDescription>Valideer barcode formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleBarcodeValidation('1234567890')}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              ✓ Geldig: 1234567890
            </Button>

            <Button
              onClick={() => handleBarcodeValidation('ab')}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              ✗ Ongeldig: ab (te kort)
            </Button>

            <Button
              onClick={() => handleBarcodeValidation('24082133930')}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              ✓ EAN-13: 24082133930
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Products */}
      <Card>
        <CardHeader>
          <CardTitle>Test Producten</CardTitle>
          <CardDescription>Print labels voor test data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testProducts.map(product => (
              <div
                key={product.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition"
              >
                <h3 className="font-medium">{product.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Barcode:</strong>
                    <br />
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {product.barcode}
                    </code>
                  </p>
                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>
                  <p>
                    <strong>Prijs:</strong> €{product.price.toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => handlePrintProduct(product)}
                  disabled={loading}
                  size="sm"
                  className="w-full gap-2"
                >
                  <Printer className="w-3 h-3" />
                  Label Printen
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Documentatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-2">📖 Setup Gids:</h4>
            <p className="text-gray-700 mb-2">
              Volg DYMO_SETUP.md voor complete setup instructies
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">🔧 Implementatie:</h4>
            <p className="text-gray-700 mb-2">
              Volg DYMO_IMPLEMENTATION.md voor integratie in je admin pages
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">⚙️ Configuratie:</h4>
            <p className="text-gray-700">
              Wijzig instellingen in lib/dymo-config.js
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-blue-200 mt-3">
            <p className="font-mono text-xs">
              <strong>DYMO Service URL:</strong>
              <br />
              http://localhost:41951
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Snelle Referentie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">📦 Components</h4>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                DymoPrintButton
                <br />
                DymoStatusCard
                <br />
                KassaDymoIntegration
              </code>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔌 API Endpoints</h4>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                POST /api/dymo/print
                <br />
                POST /api/dymo/print-batch
                <br />
                GET /api/dymo/status
              </code>
            </div>

            <div>
              <h4 className="font-medium mb-2">🪝 Hooks</h4>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                useDymoPrint()
                <br />
                DymoService.printLabel()
                <br />
                DymoService.validateBarcode()
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DymoTestPage
