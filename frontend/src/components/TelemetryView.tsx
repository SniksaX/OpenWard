import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ChevronLeft,
  ShieldCheck,
  Terminal,
  Zap,
  Download,
  QrCode,
  Power,
  Skull,
  AlertTriangle,
  Check,
  Copy
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface TelemetryViewProps {
  peer: any;
  onBack: () => void;
  onCopy: () => void;
  isCopied: boolean;
}

export default function TelemetryView({ peer, onBack, onCopy, isCopied }: TelemetryViewProps) {
  const [graphData, setGraphData] = useState<any[]>([]);

  useEffect(() => {
    if (!peer) return;
    setGraphData(prev => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // Parse float handles strings like '1.4GB' (returns 1.4) or raw numbers
      let rxVal = parseFloat(peer.rx);
      let txVal = parseFloat(peer.tx);

      if (isNaN(rxVal)) rxVal = 0;
      if (isNaN(txVal)) txVal = 0;

      const newData = [...prev, { time: timeStr, rx: rxVal, tx: txVal }];
      if (newData.length > 30) {
        return newData.slice(newData.length - 30);
      }
      return newData;
    });
  }, [peer?.rx, peer?.tx]);
  return (
    <motion.div
      key="telemetry"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 flex flex-col gap-6 h-full"
    >
      {/* Top Navigation & Identity Header */}
      <div className="flex flex-col gap-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-neon-mint transition-colors group tracking-widest"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          [&lt;] RETURN_TO_ROUTING_MATRIX
        </button>

        <div className="border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm p-4 flex items-center justify-between rounded-sm">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-black tracking-[0.2em]">TARGET_NODE</div>
              <div className="text-2xl font-black text-slate-100 tracking-tighter">{peer.name}</div>
            </div>
            <div className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-sm">
              <span className="text-neon-cyan font-mono text-sm font-bold tracking-widest">
                [ {peer.ip}/32 ]
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-neon-mint blink shadow-[0_0_10px_#20C997]" />
            <span className="text-[10px] font-black text-neon-mint tracking-[0.2em]">STATE: ENCRYPTED_TUNNEL_ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Row 1, Left Panel: Oscilloscope */}
        <div className="lg:col-span-2 border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <Activity className="w-3.5 h-3.5 text-neon-mint" />
              <span>~ DECRYPTED_PACKET_FLOW</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 blink" />
              LIVE
            </div>
          </div>
          <div className="flex-1 p-6 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  fontSize={9}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={9}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}MB/S`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E17',
                    border: '1px solid #1E293B',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ padding: '0px' }}
                />
                <Area
                  type="monotone"
                  dataKey="rx"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRx)"
                  animationDuration={0}
                />
                <Area
                  type="monotone"
                  dataKey="tx"
                  stroke="#F97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTx)"
                  animationDuration={0}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-8 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-neon-cyan" />
                <span className="text-[10px] font-black text-neon-cyan tracking-widest">RX_INBOUND: 14.2 MB/S</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-orange-500" />
                <span className="text-[10px] font-black text-orange-500 tracking-widest">TX_OUTBOUND: 3.1 MB/S</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 1, Right Panel: Crypto Vectors */}
        <div className="border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col">
          <div className="px-4 py-3 border-b border-cyber-border bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-neon-mint" />
              <span>[#] PEER_CONFIGURATION</span>
            </div>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              {[
                { label: 'PUBLIC_KEY', value: peer.pubKey, copyable: true },
                { label: 'ENDPOINT_IP', value: peer.endpoint },
                { label: 'ALLOWED_IPS', value: '0.0.0.0/0, ::/0' },
                { label: 'LATEST_HANDSHAKE', value: '02 SECONDS AGO', highlight: 'text-neon-mint' },
                { label: 'PERSISTENT_KEEPALIVE', value: '25 SECONDS' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-slate-500 font-black tracking-widest uppercase">{item.label}</label>
                    {item.copyable && (
                      <button onClick={onCopy} className="text-[8px] text-neon-mint hover:underline font-bold">
                        [COPY]
                      </button>
                    )}
                  </div>
                  <div className={`bg-black/40 border border-cyber-border p-2.5 rounded-sm text-[10px] font-mono break-all leading-relaxed ${item.highlight || 'text-slate-200'}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2, Left Panel: Audit Log */}
        <div className="border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col min-h-[200px]">
          <div className="px-4 py-3 border-b border-cyber-border bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>&gt;_ CONNECTION_EVENTS</span>
            </div>
          </div>
          <div className="p-4 flex-1 font-mono text-[10px] overflow-y-auto">
            <div className="space-y-2">
              <div className="text-slate-500/[0.8]">
                <span className="text-slate-600">[14:02:01]</span> HANDSHAKE_COMPLETED - <span className="text-neon-mint">SECURE_KEY_EXCHANGE_OK</span>
              </div>
              <div className="text-slate-500/[0.8]">
                <span className="text-slate-600">[13:45:11]</span> ROAMING_EVENT - ENDPOINT_IP_CHANGED TO <span className="text-neon-cyan">{peer.endpoint.split(':')[0]}</span>
              </div>
              <div className="text-slate-500/[0.8]">
                <span className="text-slate-600">[12:00:00]</span> TUNNEL_INITIALIZED
              </div>
              <div className="text-neon-mint blink">_</div>
            </div>
          </div>
        </div>

        {/* Row 2, Right Panel: Command Module */}
        <div className="border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col min-h-[200px]">
          <div className="px-4 py-3 border-b border-cyber-border bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <Zap className="w-3.5 h-3.5 text-neon-mint" />
              <span>[!] NODE_OPERATIONS</span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 h-full">
            <button className="border border-neon-cyan/50 text-neon-cyan font-black text-[10px] py-3 rounded-sm hover:bg-neon-cyan hover:text-black transition-all flex flex-col items-center justify-center gap-2 tracking-tighter">
              <Download className="w-4 h-4" />
              [↓] EXPORT_WG0.CONF
            </button>
            <button className="border border-neon-mint/50 text-neon-mint font-black text-[10px] py-3 rounded-sm hover:bg-neon-mint hover:text-black transition-all flex flex-col items-center justify-center gap-2 tracking-tighter">
              <QrCode className="w-4 h-4" />
              [▣] RENDER_QR_CODE
            </button>
            <button className="border border-orange-500/50 text-orange-500 font-black text-[10px] py-3 rounded-sm hover:bg-orange-500 hover:text-black transition-all flex flex-col items-center justify-center gap-2 tracking-tighter">
              <Power className="w-4 h-4" />
              [X] FORCE_DISCONNECT
            </button>
            <button className="col-span-2 bg-red-950/40 border border-red-500/50 text-red-500 font-black text-[10px] py-4 rounded-sm hover:bg-red-600 hover:text-black transition-all flex items-center justify-center gap-2 tracking-tighter">
              <Skull className="w-4 h-4" />
              [!!!] PERMANENT_REVOCATION_SEQUENCE
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
