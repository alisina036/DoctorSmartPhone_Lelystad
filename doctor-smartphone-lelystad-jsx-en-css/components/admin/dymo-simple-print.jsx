'use client'

import { useState } from 'react'
import { Printer, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { printLabel, testPrint, checkDymoStatus } from '@/lib/dymoService'

export default function DymoPrintComponent() {
  const [productName, setProductName] = useState('iPhone 16 Plus Case')
  const [price, setPrice] = useState(29.99)
  const [sku, setSku] = useState('24082133930')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handlePrint = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const result = await printLabel({
        name: productName,
        price: parseFloat(price),
        sku: sku
      })

      setStatus({
        success: result.success,
        message: result.message,
        title: result.success ? '✅ Label Geprint!' : '⚠️ Debug Modus'
      })
    } catch (error) {
      setStatus({
        success: false,
        message: `Fout: ${error.message}`,
        title: '❌ Fout'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestPrint = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const result = await testPrint()

      setStatus({
        success: result.success,
        message: result.message || 'Test label verzonden',
        title: result.success ? '✅ Test Geslaagd!' : '⚠️ Debug Modus'
      })
    } catch (error) {
      setStatus({
        success: false,
        message: `Fout: ${error.message}`,
        title: '❌ Test Fout'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const result = await checkDymoStatus()

      setStatus({
        success: result.available,
        message: result.available ? `DYMO Service bereikbaar op ${result.url}` : 'DYMO Service niet bereikt. Check DYMO software!',
        title: result.available ? '✅ Connected' : '❌ Not Connected'
      })
    } catch (error) {
      setStatus({
        success: false,
        message: `Fout: ${error.message}`,
        title: '❌ Check Failed'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          DYMO Label Printer
        </CardTitle>
        <CardDescription>
          Print labels naar DYMO 450. Zonder printer? XML verschijnt in modal!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePrint} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Productnaam
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="iPhone 16 Plus Case"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prijs (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="29.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="24082133930"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {loading ? 'Printing...' : 'Print Label'}
            </Button>

            <Button
              type="button"
              onClick={handleTestPrint}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Test Print
            </Button>

            <Button
              type="button"
              onClick={handleCheckStatus}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Check Status
            </Button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg border ${
              status.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-orange-50 border-orange-200 text-orange-800'
            }`}>
              <div className="flex items-start gap-2">
                {status.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{status.title}</div>
                  <div className="text-sm mt-1">{status.message}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <div className="font-semibold mb-2">💡 Debug Info:</div>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Open DevTools (F12) → Console tab voor XML output</li>
              <li>Zonder printer? XML verschijnt in modal overlay</li>
              <li>Met printer? Label wordt direct geprint</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
