'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Package, TrendingDown } from 'lucide-react'
import AdminNav from './admin-nav'
import AdminHeader from './admin-header'

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unresolved') // 'all', 'unresolved', 'resolved'

  useEffect(() => {
    loadAlerts()
  }, [filter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filter === 'unresolved') params.append('isResolved', 'false')
      if (filter === 'resolved') params.append('isResolved', 'true')
      
      const res = await fetch(`/api/inventory/alerts?${params}`)
      const data = await res.json()
      setAlerts(data || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId) => {
    try {
      const res = await fetch('/api/inventory/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId })
      })
      
      if (res.ok) {
        loadAlerts()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const unresolvedCount = alerts.filter(a => !a.isResolved).length
  const stockAlerts = alerts.filter(a => a.alertKind !== 'vitrine_missing_info')
  const vitrineAlerts = alerts.filter(a => a.alertKind === 'vitrine_missing_info')

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Voorraadwaarschuwingen" count={`${unresolvedCount} actieve waarschuwingen`} isPending={loading} />
        
        <AdminNav />
        
        {/* Filter buttons */}
        <div className="flex justify-end gap-2 mb-6">
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unresolved'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Actief ({alerts.filter(a => !a.isResolved).length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Opgelost ({alerts.filter(a => a.isResolved).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#3ca0de] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Alles
            </button>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Actieve Waarschuwingen</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">
                  {alerts.filter(a => !a.isResolved).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Kritiek (voorraad = 0)</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {stockAlerts.filter(a => !a.isResolved && a.currentStock === 0).length}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Opgelost Vandaag</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stockAlerts.filter(a => {
                    if (!a.isResolved || !a.resolvedAt) return false
                    const today = new Date()
                    const resolved = new Date(a.resolvedAt)
                    return resolved.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ca0de] mx-auto"></div>
              <p className="text-gray-600 mt-4">Waarschuwingen laden...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Geen waarschuwingen gevonden</p>
              <p className="text-gray-500 text-sm mt-2">
                {filter === 'unresolved' && 'Alle voorraad is op peil 🎉'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    alert.isResolved ? 'opacity-60' : ''
                  }`}
                >
                  {(() => {
                    const isVitrine = alert.alertKind === 'vitrine_missing_info'
                    const title = isVitrine
                      ? `${alert.vitrineItem?.merk || 'Onbekend'} ${alert.vitrineItem?.model || ''}`.trim()
                      : (alert.productId?.name || 'Product verwijderd')
                    const productLink = isVitrine
                      ? `/admin/vitrine?itemId=${alert.vitrineItem?.id || ''}`
                      : `/admin/voorraad?productId=${alert.productId?._id || ''}`

                    return (
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      alert.isResolved
                        ? 'bg-green-100'
                        : isVitrine
                          ? 'bg-yellow-100'
                          : alert.currentStock === 0
                            ? 'bg-red-100'
                            : 'bg-orange-100'
                    }`}>
                      {alert.isResolved ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : isVitrine ? (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      ) : alert.currentStock === 0 ? (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                          </h3>
                          <p className="text-gray-600 mt-1">{alert.message}</p>
                          {!isVitrine && (
                            <div className="flex items-center gap-6 mt-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Huidige voorraad: <span className={`font-semibold ${
                                    alert.currentStock === 0 ? 'text-red-600' : 'text-orange-600'
                                  }`}>{alert.currentStock}</span>
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                Minimum: <span className="font-semibold">{alert.minStock}</span>
                              </div>
                              
                              {alert.productId?.categoryId && (
                                <div className="text-sm text-gray-500">
                                  {alert.productId.categoryId.name}
                                  {alert.productId.subCategoryId && ` • ${alert.productId.subCategoryId.name}`}
                                </div>
                              )}
                            </div>
                          )}
                          {isVitrine && alert.missingFields?.length > 0 && (
                            <div className="text-sm text-gray-500 mt-3">
                              Ontbreekt: <span className="font-semibold">{alert.missingFields.join(', ')}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              Aangemaakt: {new Date(alert.createdAt).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            
                            {alert.isResolved && alert.resolvedAt && (
                              <span className="text-green-600">
                                Opgelost: {new Date(alert.resolvedAt).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <a
                            href={productLink}
                            className="px-4 py-2 bg-[#3ca0de] text-white rounded-lg font-medium hover:bg-[#2d8bc7] transition-colors whitespace-nowrap"
                          >
                            Ga naar product
                          </a>
                          {!alert.isResolved && !isVitrine && (
                            <button
                              onClick={() => resolveAlert(alert._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Markeer als opgelost
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
