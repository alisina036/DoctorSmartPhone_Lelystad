'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { printLabel } from '@/lib/dymoService'

export default function PrintLabelDialog({ product, onClose }) {
  const [quantity, setQuantity] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)
  const [certError, setCertError] = useState(false)
  const handlePrint = async () => {
    if (isPrinting) return
    setCertError(false)

    const labelName = product.deviceModelId?.name
      ? `${product.deviceModelId.name} - ${product.name}`
      : product.name
    const labelSku = [
      product.sku,
      product.barcode,
      product.barcodeNumber,
      product.ean,
      product.imei,
      product._id,
    ]
      .map((value) => String(value || '').trim())
      .find((value) => value.length > 0)

    if (!labelSku) {
      alert('Geen SKU of barcode beschikbaar voor dit product.')
      return
    }

    setIsPrinting(true)
    try {
      for (let i = 0; i < quantity; i++) {
        const result = await printLabel({
          name: labelName,
          price: Number(product.salePrice || 0),
          sku: labelSku,
        })

        if (!result?.success) {
          const isCertIssue = /NetworkError|Failed to fetch|Load failed|null/i.test(result?.message || '')
          if (isCertIssue) {
            setCertError(true)
          } else {
            alert(result?.message || 'Print mislukt')
          }
          return
        }
      }

      alert(`Succes: ${quantity} label${quantity > 1 ? 's' : ''} geprint.`)
      onClose()
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Label Printen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          {certError && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4 text-sm">
              <p className="font-bold text-yellow-800 mb-1">🔒 Certificaat niet vertrouwd</p>
              <p className="text-yellow-700 mb-3">
                Firefox blokkeert de lokale printservice. Klik op de knop hieronder, accepteer het certificaat in de nieuwe tab, sluit die tab en probeer opnieuw.
              </p>
              <a
                href="https://127.0.0.1:5001/health"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-700 transition-colors"
              >
                Certificaat accepteren →
              </a>
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="font-semibold text-sm text-gray-700 mb-2">Product:</p>
            <p className="font-bold">
              {product.deviceModelId?.name ? `${product.deviceModelId.name} - ` : ''}
              {product.name}
            </p>
            <p className="text-sm text-gray-600 mt-2">Barcode: {product.barcode || '-'}</p>
            {product.sku && <p className="text-sm text-gray-600">SKU: {product.sku}</p>}
            <p className="text-sm text-gray-600">Verkoopprijs: €{Number(product.salePrice || 0).toFixed(2)}</p>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aantal labels:
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 bg-[#3ca0de] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2d8bc7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPrinting ? 'Printen...' : `Print ${quantity} label${quantity > 1 ? 's' : ''}`}
          </button>
          <button
            onClick={onClose}
            disabled={isPrinting}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  )
}
