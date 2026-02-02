"use client"

import { useEffect, useState } from "react"
import MotionCarousel from "./motion-carousel"

export default function HeroCarousel() {
  const [items, setItems] = useState([])
  const [baseWidth, setBaseWidth] = useState(500)

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

  useEffect(() => {
    // Responsive sizing voor carousel
    const updateSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        // Mobile portrait - gebruik 90vw
        setBaseWidth(width * 0.9)
      } else if (width < 768) {
        // Large mobile / small tablet
        setBaseWidth(400)
      } else if (width < 1024) {
        // Tablet
        setBaseWidth(450)
      } else {
        // Desktop
        setBaseWidth(500)
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <div className="flex items-center justify-center w-full">
      <MotionCarousel
        items={items}
        baseWidth={baseWidth}
        autoplay={true}
        autoplayDelay={4000}
        pauseOnHover={true}
        loop={true}
        round={true}
      />
    </div>
  )
}
