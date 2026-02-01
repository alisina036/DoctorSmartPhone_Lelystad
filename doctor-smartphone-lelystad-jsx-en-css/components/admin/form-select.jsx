"use client"

import { useState, useEffect } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function FormSelect({ name, options = [], defaultValue = '', placeholder = 'Maak een keuze', className = '' }) {
  const NONE = '__none__'
  const [value, setValue] = useState(defaultValue || '')

  useEffect(() => {
    setValue(defaultValue || '')
  }, [defaultValue])

  return (
    <div className={className}>
      <input type="hidden" name={name} value={value === NONE ? '' : value} />
      <Select value={value} onValueChange={(v) => setValue(v)}>
        <SelectTrigger className="rounded-xl ring-1 ring-gray-200 bg-white shadow-sm hover:shadow-md px-3 py-2 text-sm min-w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-md">
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
