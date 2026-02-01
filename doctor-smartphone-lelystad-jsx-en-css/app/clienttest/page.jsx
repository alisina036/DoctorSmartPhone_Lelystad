"use client"

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function ClientTest() {
  const { toast } = useToast()
  useEffect(() => {
    console.log("useEffect ran! Client-side React is working!")
    toast({ title: "Client-side React", description: "useEffect ran! Client-side React is working!" })
  }, [])

  return (
    <div style={{ padding: '40px' }}>
      <h1>Client Component Test</h1>
      <p>If you see an alert, client-side React works!</p>
      <button 
        onClick={() => {
          console.log("Button clicked!")
          toast({ title: "Button clicked", description: "Button clicked!" })
        }}
        style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Click Me
      </button>
    </div>
  )
}
