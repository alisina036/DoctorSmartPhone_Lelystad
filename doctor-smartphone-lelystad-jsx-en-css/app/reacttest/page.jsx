"use client"

import { useToast } from "@/hooks/use-toast"

export default function ReactTest() {
  const { toast } = useToast()
  return (
    <div style={{ padding: '40px' }}>
      <h1>React Event Test</h1>
      <button 
        onClick={() => toast({ title: "React onClick", description: "React onClick works!" })}
        style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Test React onClick
      </button>
    </div>
  )
}
