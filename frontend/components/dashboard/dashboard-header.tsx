'use client'

import { StatusDot } from '@/components/cyber'
import { Database, Clock } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function DashboardHeader() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-14 border-b border-border bg-black/40 backdrop-blur-md flex items-center justify-between px-6">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/openward-mark-gradient.svg"
          alt="OpenWard"
          width={32}
          height={32}
          className="h-8 w-8"
          priority
        />
        <span className="text-sm font-mono uppercase tracking-wider text-foreground">
          OPENWARD <span className="text-primary">V1.0</span>
        </span>
      </div>

      {/* Right - Status Indicators */}
      <div className="flex items-center gap-6">
        {/* Server Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            SERVER_STATUS
          </span>
          <StatusDot status="online" pulse />
        </div>

        {/* Database */}
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            SQLITE
          </span>
        </div>

        {/* UTC Timer */}
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-mono text-accent">{time}</span>
        </div>
      </div>
    </header>
  )
}
