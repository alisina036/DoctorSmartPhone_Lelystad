"use client"

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function TestAdminPage() {
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  console.log("Component render - isLoggedIn:", isLoggedIn)

  const handleLogin = (e) => {
    e.preventDefault()
    console.log("Login clicked", { email, password })
    if (email === "test@test.test" && password === "test12345") {
      console.log("Credentials correct, setting isLoggedIn to true")
      setIsLoggedIn(true)
    } else {
      toast({ variant: "destructive", title: "Inloggen mislukt", description: "Wrong credentials" })
    }
  }

  console.log("About to check isLoggedIn:", isLoggedIn)

  if (!isLoggedIn) {
    console.log("Rendering login form")
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Simple Login Test</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="test@test.test"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="test12345"
            />
          </div>
          <button
            type="submit"
            style={{ padding: '10px 20px', backgroundColor: '#3ca0de', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Force login clicked")
              setIsLoggedIn(true)
            }}
            style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer', marginLeft: '10px' }}
          >
            Force Login
          </button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Current state: {isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN'}
        </p>
      </div>
    )
  }

  console.log("Rendering dashboard")
  return (
    <div style={{ padding: '40px' }}>
      <h1>✅ DASHBOARD - YOU ARE LOGGED IN!</h1>
      <button
        onClick={() => setIsLoggedIn(false)}
        style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  )
}
