import { useState, useCallback } from 'react'

export function useDymoPrint() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const printLabel = useCallback(async (productData, quantity = 1) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/dymo/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productData,
          quantity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij printen')
      }

      setSuccess(data)
      return data
    } catch (err) {
      const errorMsg = err.message || 'Fout bij printen'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const printMultipleLabels = useCallback(async (products) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const results = []
      for (const { product, quantity } of products) {
        const result = await printLabel(product, quantity)
        results.push(result)
      }
      setSuccess({ message: `${results.length} print(s) voltooid` })
      return results
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [printLabel])

  return {
    printLabel,
    printMultipleLabels,
    loading,
    error,
    success,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null)
  }
}

export default useDymoPrint
