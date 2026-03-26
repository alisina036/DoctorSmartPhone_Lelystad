'use client'

import { useEffect, useState } from 'react'
import InventoryAdminPage from '@/components/admin/inventory-admin-page'

export default function VoorraadPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <InventoryAdminPage />
}

