'use client'

import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'online' | 'warning' | 'offline' | 'idle'
  pulse?: boolean
  className?: string
}

export function StatusDot({ status, pulse = true, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        status === 'online' && 'bg-primary',
        status === 'warning' && 'bg-warning',
        status === 'offline' && 'bg-destructive',
        status === 'idle' && 'bg-muted-foreground',
        pulse && status === 'online' && 'animate-pulse shadow-[0_0_5px_#20C997]',
        pulse && status === 'warning' && 'animate-pulse shadow-[0_0_5px_#F97316]',
        className
      )}
    />
  )
}
