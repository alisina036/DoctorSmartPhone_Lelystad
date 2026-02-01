'use client'

import { useState } from 'react'
import { ChevronDown, X, Smartphone } from 'lucide-react'

export default function DeviceSelectorDropdown({ value, onChange, devices = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedDevice = devices.find((d) => d._id === value)

  const handleSelectDevice = (deviceId) => {
    onChange(deviceId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    onChange('')
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedDevice ? (
            <>
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedDevice.imageUrl ? (
                  <img
                    src={selectedDevice.imageUrl}
                    alt={selectedDevice.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Smartphone className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <span className="font-medium">{selectedDevice.name}</span>
            </>
          ) : (
            <span className="text-gray-500">Selecteer toestel</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedDevice && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleClearSelection()
              }}
            />
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Zoek toestel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ca0de] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {filteredDevices.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredDevices.map((device) => (
                  <button
                    key={device._id}
                    type="button"
                    onClick={() => handleSelectDevice(device._id)}
                    className={`p-3 border-2 rounded-lg transition-all text-center cursor-pointer ${
                      value === device._id
                        ? 'border-[#3ca0de] bg-[#e3f2fd] shadow-md'
                        : 'border-gray-200 hover:border-[#3ca0de] hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-full h-20 rounded bg-gray-100 flex items-center justify-center overflow-hidden mb-2 transition-all">
                      {device.imageUrl ? (
                        <img
                          src={device.imageUrl}
                          alt={device.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Smartphone className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 line-clamp-2 block">
                      {device.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Geen toestellen gevonden</div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
