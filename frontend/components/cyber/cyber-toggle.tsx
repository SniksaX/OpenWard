'use client'

import { cn } from '@/lib/utils'

interface CyberToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function CyberToggle({ label, description, checked, onChange, className }: CyberToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center justify-between w-full p-4',
        'bg-black/40 border border-border rounded-sm',
        'hover:border-muted-foreground transition-all duration-200',
        checked && 'border-primary',
        className
      )}
    >
      <div className="text-left">
        <div className="text-sm font-mono uppercase tracking-wider text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <div
        className={cn(
          'w-12 h-6 rounded-sm border transition-all duration-200 relative',
          checked 
            ? 'bg-primary border-primary shadow-[0_0_10px_#20C997]' 
            : 'bg-secondary border-border'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 rounded-sm transition-all duration-200',
            checked 
              ? 'right-1 bg-primary-foreground' 
              : 'left-1 bg-muted-foreground'
          )}
        />
      </div>
    </button>
  )
}
