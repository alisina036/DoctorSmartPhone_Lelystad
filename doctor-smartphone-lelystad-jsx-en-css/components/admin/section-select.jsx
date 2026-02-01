"use client"

import { useState, useEffect } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function SectionSelect({ sections = [], defaultValue = '', name = 'sectionId', className = '' }) {
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
          <SelectValue placeholder="Kies sectie" />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-md">
          <SelectItem value={NONE}>Zonder sectie</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
