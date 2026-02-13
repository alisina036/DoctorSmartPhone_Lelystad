"use client"

import { useEffect, useState } from "react"
import MotionCarousel from "./motion-carousel"

export default function HeroCarousel() {
  const [items, setItems] = useState([])

  useEffect(() => {
    // Laad carousel items van API
    const loadItems = async () => {
      try {
        const res = await fetch("/api/hero-carousel")
        const data = await res.json()
        setItems(Array.isArray(data) && data.length > 0 ? data : [])
      } catch (e) {
        console.error("Failed to load carousel items:", e)
        setItems([])
      }
    }
    loadItems()
  }, [])

  return (
    <div className="flex items-center justify-center">
      <MotionCarousel
        items={items}
        baseWidth={500}
        autoplay={true}
        autoplayDelay={4000}
        pauseOnHover={true}
        loop={true}
        round={true}
      />
    </div>
  )
}
