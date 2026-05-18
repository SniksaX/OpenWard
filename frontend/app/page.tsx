'use client'

import { CyberInput, CyberButton } from '@/components/cyber'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const data = await api.login(email, password)
      if (data.token) {
        localStorage.setItem('token', data.token)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="relative bg-black/60 backdrop-blur-xl border border-border rounded-sm overflow-hidden shadow-[0_0_30px_rgba(32,201,151,0.15)]">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <div className="p-8 relative">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 mx-auto text-primary mb-4 p-4 bg-primary/10 border border-primary/30 rounded-sm" />
              <h1 className="text-2xl font-mono uppercase tracking-tighter text-glow-mint">OPENWARD</h1>
              <p className="text-xs uppercase tracking-widest text-primary mt-1">[ ACCESS ]</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <CyberInput 
                label="User_Ident (Email)" 
                placeholder="Enter email..." 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
              <CyberInput 
                label="Passphrase" 
                type="password" 
                placeholder="Enter passphrase..." 
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />

              {error && <div className="text-destructive text-xs uppercase tracking-widest font-bold border border-destructive/30 bg-destructive/10 p-2">{error}</div>}

              <CyberButton type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? 'AUTHENTICATING...' : '[ INITIATE_LOGIN_SEQUENCE ]'}
              </CyberButton>
            </form>
          </div>
        </div>
      </motion.div>
    </main>
  )
}