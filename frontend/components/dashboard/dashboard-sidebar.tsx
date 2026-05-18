'use client'

import { CyberProgress } from '@/components/cyber'
import { cn } from '@/lib/utils'
import { Network, Users, Settings, Activity } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Peers Controller',
    icon: Network,
    prefix: '>_',
  },
  {
    href: '/dashboard/users',
    label: 'Users Controller',
    icon: Users,
    prefix: '>_',
  },
  {
    href: '/dashboard/config',
    label: 'System Config',
    icon: Settings,
    prefix: '>_',
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-black/20 flex flex-col">
      {/* Navigation Section */}
      <div className="flex-1 p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          [ MODULES ]
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname.startsWith('/dashboard') && pathname !== '/dashboard/users' && pathname !== '/dashboard/config')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false} 
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200',
                  'text-sm font-mono uppercase tracking-wider',
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(32,201,151,0.1)]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
                )}
              >
                <span className="text-xs opacity-50">{item.prefix}</span>
                <item.icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Network Environment Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            NETWORK_ENVIRONMENT
          </span>
        </div>

        <div className="space-y-4">
          <CyberProgress
            label="Latency"
            value={12}
            max={100}
            color="accent"
            showValue
          />
          <CyberProgress
            label="Uptime"
            value={99.8}
            max={100}
            color="primary"
            showValue
          />
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground/50 font-mono">
            <div>KERNEL: WG-5.15.0</div>
            <div>INTERFACE: wg0</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
