'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ children, variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-mono uppercase tracking-wider transition-all duration-200',
          'border rounded-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
          // Variants
          variant === 'primary' && [
            'bg-primary text-primary-foreground border-primary',
            'hover:shadow-[0_0_10px_#20C997] hover:bg-primary/90',
            'focus:ring-primary',
          ],
          variant === 'secondary' && [
            'bg-transparent text-foreground border-border',
            'hover:bg-secondary hover:border-muted-foreground',
            'focus:ring-muted-foreground',
          ],
          variant === 'danger' && [
            'bg-destructive text-destructive-foreground border-destructive',
            'hover:shadow-[0_0_10px_#EF4444] hover:bg-destructive/90',
            'focus:ring-destructive',
          ],
          variant === 'ghost' && [
            'bg-transparent text-muted-foreground border-transparent',
            'hover:text-foreground hover:bg-secondary',
            'focus:ring-muted-foreground',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

CyberButton.displayName = 'CyberButton'
