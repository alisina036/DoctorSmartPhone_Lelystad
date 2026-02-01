'use client'

import { useState, useEffect } from 'react'
import { Printer, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import DymoService from '@/lib/dymo-service'

export function DymoPrintButton({ product, quantity = 1, disabled = false, className = '' }) {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [printQuantity, setPrintQuantity] = useState(quantity)
  const [result, setResult] = useState(null)

  const handlePrint = async () => {
    setLoading(true)
    setResult(null)

    try {
      const result = await DymoService.printLabel(product, printQuantity)
      setResult(result)
      if (result.success) {
        setTimeout(() => setShowDialog(false), 2000)
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Fout: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={disabled || loading}
        variant="outline"
        size="sm"
        className={`gap-2 ${className}`}
      >
        <Printer className="w-4 h-4" />
        {loading ? 'Printen...' : 'DYMO Label Printen'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DYMO Label Printen</DialogTitle>
            <DialogDescription>
              Product: {product.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {result ? (
              <div className={`flex gap-3 p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className={result.success ? 'text-green-800' : 'text-red-800'}>
                  <p className="font-medium">{result.message}</p>
                  {result.quantity && (
                    <p className="text-sm">Aantal labels: {result.quantity}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Aantal labels</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={quantity * 10}
                      value={printQuantity}
                      onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                  <p className="text-blue-900">
                    <strong>Voorraad:</strong> {quantity} stuks beschikbaar
                  </p>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Productnaam:</strong> {product.name}</p>
                  <p><strong>Barcode:</strong> {product.barcode}</p>
                  <p><strong>Prijs:</strong> €{parseFloat(product.price).toFixed(2)}</p>
                </div>
              </>
            )}
          </div>

          {!result && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Annuleren
              </Button>
              <Button
                onClick={handlePrint}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Printen...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Label Printen
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DymoStatusCard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const result = await DymoService.checkDymoStatus()
      setStatus(result)
    } catch (error) {
      setStatus({
        connected: false,
        message: 'Fout bij status check'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            DYMO Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            Controleren...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={status?.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          DYMO Status
        </CardTitle>
        <CardDescription>
          LabelWriter 550 Printer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Verbonden
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  Niet verbonden
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-700">{status?.message}</p>

          {status?.printers && status.printers.length > 0 && (
            <div className="mt-3 pt-3 border-t text-sm">
              <p className="font-medium text-gray-700 mb-1">Beschikbare printers:</p>
              <ul className="text-gray-600 text-xs">
                {status.printers.map((printer, idx) => (
                  <li key={idx}>• {printer.name || printer}</li>
                ))}
              </ul>
            </div>
          )}

          {!status?.connected && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm font-medium text-red-700 mb-2">
                Probleemoplosser:
              </p>
              <ol className="text-xs text-red-700 list-decimal list-inside space-y-1">
                <li>Zorg dat DYMO LabelWriter 550 aangesloten is</li>
                <li>Start DYMO Connect software</li>
                <li>Web Service moet draaien op poort 41951</li>
                <li>Vernieuw de pagina</li>
              </ol>
            </div>
          )}

          <Button
            onClick={checkStatus}
            variant="outline"
            size="sm"
            className="w-full mt-4"
          >
            Opnieuw controleren
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DymoPrintButton
