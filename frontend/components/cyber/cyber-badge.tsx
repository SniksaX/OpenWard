'use client'

import { cn } from '@/lib/utils'

interface CyberBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function CyberBadge({ children, variant = 'default', className }: CyberBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-sm border',
        variant === 'default' && 'bg-secondary/50 text-foreground border-border',
        variant === 'success' && 'bg-primary/10 text-primary border-primary/30',
        variant === 'warning' && 'bg-warning/10 text-warning border-warning/30',
        variant === 'danger' && 'bg-destructive/10 text-destructive border-destructive/30',
        variant === 'info' && 'bg-accent/10 text-accent border-accent/30',
        className
      )}
    >
      {children}
    </span>
  )
}
