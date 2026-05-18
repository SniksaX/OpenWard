'use client'

import { useState } from 'react'
import { CyberPanel, CyberPanelHeader } from '@/components/cyber'
import { Hash, Copy, Check } from 'lucide-react'

interface ConfigItem {
  label: string
  value: string
}

interface PeerConfigProps {
  config: ConfigItem[]
}

function CopyableValue({ label, value }: ConfigItem) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-2 p-2 bg-background/50 rounded-sm border border-border hover:border-primary/50 transition-colors text-left"
      >
        <code className="text-xs text-foreground font-mono truncate">{value}</code>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </button>
    </div>
  )
}

export function PeerConfig({ config }: PeerConfigProps) {
  return (
    <CyberPanel className="h-full">
      <CyberPanelHeader 
        title="[#] PEER_CONFIGURATION" 
        icon={<Hash className="w-4 h-4 text-primary" />} 
      />
      
      <div className="p-4 space-y-3">
        {config.map((item) => (
          <CopyableValue key={item.label} {...item} />
        ))}
      </div>
    </CyberPanel>
  )
}
