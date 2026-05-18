'use client'

import { CyberPanel, CyberPanelHeader } from '@/components/cyber'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Activity } from 'lucide-react'

interface TrafficChartProps {
  data: any[]
}

export function TrafficChart({ data }: TrafficChartProps) {
  // Use fallback if empty so the chart doesn't collapse
  const chartData = data && data.length > 0 ? data : [{ time: '0s', rx: 0, tx: 0 }]

  return (
    <CyberPanel className="h-full min-h-[300px] flex flex-col">
      <CyberPanelHeader 
        title="~ DECRYPTED_PACKET_FLOW" 
        icon={<Activity className="w-4 h-4 text-accent" />} 
      />
      
      <div className="p-4 flex-1 flex flex-col min-h-0">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent shadow-[0_0_5px_#00D4FF]" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">RX (MB/s)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-warning shadow-[0_0_5px_#F97316]" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">TX (MB/s)</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 relative min-h-0">
          {/* Grid overlay effect */}
          <div className="absolute inset-0 cyber-grid opacity-30 rounded-sm pointer-events-none" />
          
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E17',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#64748B' }}
                formatter={(value: number) => [`${value} MB/s`]}
              />
              <Area
                isAnimationActive={false} // Disable animation so live data doesn't rubber-band
                type="monotone"
                dataKey="rx"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="url(#rxGradient)"
                dot={false}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="tx"
                stroke="#F97316"
                strokeWidth={2}
                fill="url(#txGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CyberPanel>
  )
}