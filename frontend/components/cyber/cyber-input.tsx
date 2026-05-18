'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-input border border-border rounded-sm px-4 py-3',
            'text-sm font-mono text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-all duration-200',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

CyberInput.displayName = 'CyberInput'

interface CyberSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const CyberSelect = forwardRef<HTMLSelectElement, CyberSelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-input border border-border rounded-sm px-4 py-3',
            'text-sm font-mono text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-all duration-200 cursor-pointer',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

CyberSelect.displayName = 'CyberSelect'
