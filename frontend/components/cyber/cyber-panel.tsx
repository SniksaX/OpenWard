'use client'

import { cn } from '@/lib/utils'

interface CyberPanelProps {
  children: React.ReactNode
  className?: string
  glow?: 'mint' | 'cyan' | 'orange' | 'none'
}

export function CyberPanel({ children, className, glow = 'none' }: CyberPanelProps) {
  return (
    <div
      className={cn(
        'bg-black/40 backdrop-blur-md border border-border rounded-sm',
        glow === 'mint' && 'hover:shadow-[0_0_10px_#20C997] transition-shadow',
        glow === 'cyan' && 'hover:shadow-[0_0_10px_#00D4FF] transition-shadow',
        glow === 'orange' && 'hover:shadow-[0_0_10px_#F97316] transition-shadow',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CyberPanelHeaderProps {
  title: string
  icon?: React.ReactNode
  className?: string
}

export function CyberPanelHeader({ title, icon, className }: CyberPanelHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3 border-b border-border', className)}>
      {icon}
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
    </div>
  )
}
