"use client"

import { usePathname } from "next/navigation"
import StoreMap from "@/components/store-map"

export default function StoreMapGuard() {
  const pathname = usePathname() || ""

  // Hide the public store map on the admin panel.
  if (pathname.startsWith("/admin")) return null

  return <StoreMap />
}
