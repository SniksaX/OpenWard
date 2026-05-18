'use client'

import { CyberInput, CyberSelect, CyberButton } from '@/components/cyber'
import { Search, Filter, Plus } from 'lucide-react'
import Link from 'next/link'

interface ActionBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  roleFilter: string
  onRoleFilterChange: (role: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

const roleOptions = [
  { value: 'all', label: 'ALL ROLES' },
  { value: 'admin', label: 'ADMIN' },
  { value: 'employee', label: 'EMPLOYEE' },
  { value: 'guest', label: 'GUEST' },
]

const sortOptions = [
  { value: 'last_seen', label: 'LAST SEEN' },
  { value: 'name', label: 'NAME' },
  { value: 'traffic', label: 'TRAFFIC' },
  { value: 'status', label: 'STATUS' },
]

export function ActionBar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  sortBy,
  onSortChange,
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-black/20 border-b border-border">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search peers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="bg-input border border-border rounded-sm px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-input border border-border rounded-sm px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Deploy Button */}
      <Link href="/dashboard/deploy">
        <CyberButton size="md">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            [+] DEPLOY_NEW_PEER
          </span>
        </CyberButton>
      </Link>
    </div>
  )
}
