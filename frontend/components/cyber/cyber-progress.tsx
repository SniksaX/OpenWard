'use client'

import { cn } from '@/lib/utils'

interface CyberProgressProps {
  value: number
  max?: number
  label?: string
  color?: 'primary' | 'accent' | 'warning' | 'danger'
  showValue?: boolean
  className?: string
}

export function CyberProgress({ 
  value, 
  max = 100, 
  label, 
  color = 'primary',
  showValue = false,
  className 
}: CyberProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span className="font-mono text-foreground">{value.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className="h-1.5 bg-secondary rounded-sm overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-sm',
            color === 'primary' && 'bg-primary shadow-[0_0_5px_#20C997]',
            color === 'accent' && 'bg-accent shadow-[0_0_5px_#00D4FF]',
            color === 'warning' && 'bg-warning shadow-[0_0_5px_#F97316]',
            color === 'danger' && 'bg-destructive shadow-[0_0_5px_#EF4444]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
