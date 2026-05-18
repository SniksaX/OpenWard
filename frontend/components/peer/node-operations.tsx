'use client'

import { CyberPanel, CyberPanelHeader, CyberButton } from '@/components/cyber'
import { AlertTriangle, FileDown, QrCode, Unplug, Trash2 } from 'lucide-react'

interface NodeOperationsProps {
  onExportConfig: () => void
  onRenderQR: () => void
  onDisconnect: () => void
  onRevoke: () => void
}

export function NodeOperations({ 
  onExportConfig, 
  onRenderQR, 
  onDisconnect, 
  onRevoke 
}: NodeOperationsProps) {
  return (
    <CyberPanel className="h-full">
      <CyberPanelHeader 
        title="[!] NODE_OPERATIONS" 
        icon={<AlertTriangle className="w-4 h-4 text-warning" />} 
      />
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExportConfig}
            className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-sm hover:border-primary/50 hover:bg-secondary transition-all"
          >
            <FileDown className="w-5 h-5 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-foreground">
              Export WG0.CONF
            </span>
          </button>

          <button
            onClick={onRenderQR}
            className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-sm hover:border-accent/50 hover:bg-secondary transition-all"
          >
            <QrCode className="w-5 h-5 text-accent" />
            <span className="text-[10px] uppercase tracking-widest text-foreground">
              Render QR Code
            </span>
          </button>

          <button
            onClick={onDisconnect}
            className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-sm hover:border-warning/50 hover:bg-secondary transition-all"
          >
            <Unplug className="w-5 h-5 text-warning" />
            <span className="text-[10px] uppercase tracking-widest text-foreground">
              Force Disconnect
            </span>
          </button>

          <button
            onClick={onRevoke}
            className="flex flex-col items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-sm hover:bg-destructive/20 hover:border-destructive/50 transition-all"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <span className="text-[10px] uppercase tracking-widest text-destructive">
              [!!!] REVOKE
            </span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="mt-4 pt-4 border-t border-destructive/30">
          <CyberButton 
            variant="danger" 
            className="w-full"
            onClick={onRevoke}
          >
            [!!!] PERMANENT_REVOCATION_SEQUENCE
          </CyberButton>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            This action cannot be undone. The peer will be permanently removed.
          </p>
        </div>
      </div>
    </CyberPanel>
  )
}
