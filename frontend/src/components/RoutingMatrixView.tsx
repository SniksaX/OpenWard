import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Terminal,
  Activity,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

interface RoutingMatrixViewProps {
  peers: any[];
  selectedPeerId: string;
  setSelectedPeerId: (id: string) => void;
  onNavigateToTelemetry: (id: string) => void;
  onCopy: () => void;
  isCopied: boolean;
  onRevokePeer?: (id: string) => void;
  onOpenCreate: () => void;
}

export default function RoutingMatrixView({
  peers,
  selectedPeerId,
  setSelectedPeerId,
  onNavigateToTelemetry,
  onCopy,
  isCopied,
  onRevokePeer,
  onOpenCreate
}: RoutingMatrixViewProps) {
  const selectedPeer = peers.find(p => p.id === selectedPeerId) || peers[0];

  return (
    <motion.div
      key="matrix"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full"
    >
      {/* Top Action Bar */}
      <div className="border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-md px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-neon-mint transition-colors" />
            <input
              type="text"
              placeholder="[?] QUERY_IDENTIFIER..."
              className="w-full bg-transparent border border-cyber-border/50 px-10 py-2 text-xs text-slate-100 focus:outline-none focus:border-neon-mint focus:neon-glow-mint transition-all placeholder:text-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold">FILTER_ROLE:</span>
            <select className="bg-transparent border border-cyber-border px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-neon-mint cursor-pointer font-mono uppercase">
              <option value="ALL">ALL</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="ADMIN">ADMIN</option>
              <option value="NODE">NODE</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold">SORT:</span>
            <select className="bg-transparent border border-cyber-border px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-neon-mint cursor-pointer font-mono uppercase">
              <option value="LAST_SEEN">LAST_SEEN</option>
              <option value="ID">ID</option>
              <option value="LATENCY">LATENCY</option>
            </select>
          </div>

          {/* New Deploy Button Here */}
          <div className="pl-4 border-l border-cyber-border ml-2">
            <button 
              onClick={onOpenCreate}
              className="bg-neon-mint/10 border border-neon-mint/40 text-neon-mint px-4 py-1.5 text-[10px] font-black tracking-widest hover:bg-neon-mint hover:text-black transition-colors rounded-sm"
            >
              [+] DEPLOY_NEW_PEER
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-full min-h-0">
        {/* Left Column: Peer Data Matrix */}
        <div className="lg:col-span-2 border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <LayoutDashboard className="w-3.5 h-3.5 text-neon-cyan" />
              <span>[=] LIVE_ROUTING_TABLE</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-neon-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan blink" />
              DATA_STREAM: ACTIVE
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-cyber-border text-[9px] text-slate-600 font-black tracking-widest bg-white/[0.01]">
                  <th className="px-4 py-3 w-8">STAT</th>
                  <th className="px-4 py-3">IDENTIFIER / IP</th>
                  <th className="px-4 py-3">PUB_KEY</th>
                  <th className="px-4 py-3">TOPOLOGY</th>
                  <th className="px-4 py-3">TRAFFIC (RX / TX)</th>
                  <th className="px-4 py-3">LAST_SEEN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border">
                {peers.map((peer) => (
                  <tr
                    key={peer.id}
                    onClick={() => setSelectedPeerId(peer.id)}
                    className={`group cursor-pointer transition-all border-l-2 ${selectedPeerId === peer.id
                      ? 'bg-neon-mint/5 border-neon-mint'
                      : 'border-transparent hover:bg-neon-mint/5 hover:border-neon-mint'
                      }`}
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className={`w-2 h-2 rounded-full ${peer.status === 'active' ? 'bg-neon-mint shadow-[0_0_8px_#20C997]' :
                        peer.status === 'inactive' ? 'bg-orange-500 shadow-[0_0_8px_#F97316]' : 'bg-red-600'
                        }`} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold tracking-tight ${selectedPeerId === peer.id ? 'text-neon-mint' : 'text-slate-100'}`}>
                          {peer.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTelemetry(peer.id);
                          }}
                          className="text-[10px] text-neon-cyan font-bold hover:underline w-fit text-left"
                        >
                          {peer.ip}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                        {peer.pubKey.substring(0, 4)}...{peer.pubKey.substring(peer.pubKey.length - 3)}=
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-sm w-fit font-bold border border-slate-700 uppercase">
                          {peer.role}
                        </span>
                        <span className="text-[9px] bg-cyan-950/40 text-neon-cyan px-1.5 py-0.5 rounded-sm w-fit font-bold border border-neon-cyan/20 uppercase">
                          {peer.device}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                            <span>RX: {peer.rx}</span>
                          </div>
                          <div className="h-1 bg-cyber-border rounded-full overflow-hidden w-24">
                            <div className="h-full bg-neon-cyan" style={{ width: '45%' }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                            <span>TX: {peer.tx}</span>
                          </div>
                          <div className="h-1 bg-cyber-border rounded-full overflow-hidden w-24">
                            <div className="h-full bg-orange-500" style={{ width: '30%' }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] text-slate-400 font-black tracking-widest">{peer.lastSeen}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Node Inspector Panel */}
        <div className="border border-cyber-border bg-cyber-bg/60 backdrop-blur-sm rounded-sm flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-neon-mint" />
              <span>&gt;_ KERNEL_INSPECTOR</span>
            </div>
            <div className={`flex items-center gap-2 text-[9px] font-bold px-2 py-0.5 border rounded-sm ${selectedPeer ? 'bg-neon-mint/10 text-neon-mint border-neon-mint/20' : 'bg-slate-800/50 text-slate-500 border-cyber-border'}`}>
              {selectedPeer ? 'TARGET_LOCKED' : 'NO_TARGET'}
            </div>
          </div>

          {selectedPeer ? (

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Ident Block */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <motion.h2
                    key={selectedPeer.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-black text-neon-mint tracking-tighter"
                  >
                    {selectedPeer.name}
                  </motion.h2>
                  <div className="inline-flex items-center gap-2 border border-neon-cyan/40 bg-neon-cyan/5 px-2 py-1 rounded-sm">
                    <Activity className="w-3 h-3 text-neon-cyan" />
                    <span className="text-xs font-bold text-neon-cyan tracking-wider">{selectedPeer.ip}</span>
                  </div>
                </div>

                {/* Cryptographic Data */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 font-black tracking-widest block">PUBLIC_KEY (ED25519)</label>
                    <div className="bg-slate-900/80 border border-cyber-border p-3 rounded-sm flex items-start gap-3 group relative">
                      <div className="text-[10px] font-mono text-slate-300 break-all leading-relaxed">
                        {selectedPeer.pubKey}
                      </div>
                      <button
                        onClick={onCopy}
                        className="mt-1 transition-colors hover:text-neon-mint shrink-0"
                      >
                        <AnimatePresence mode="wait">
                          {isCopied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <Check className="w-4 h-4 text-neon-mint" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <Copy className="w-4 h-4 text-slate-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                      {isCopied && (
                        <div className="absolute -top-6 right-0 text-[8px] font-bold text-neon-mint bg-neon-mint/10 px-1 py-0.5 border border-neon-mint/20 rounded-sm">
                          COPIED
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 font-black tracking-widest block">ENDPOINT_IP</label>
                    <div className="text-xs font-bold text-slate-200 border-l border-neon-cyan/40 pl-3">
                      {selectedPeer.endpoint}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Telemetry */}
              <div className="space-y-4">
                <label className="text-[10px] text-slate-600 font-black tracking-widest block">LIVE_TELEMETRY</label>

                {/* Mock visual bandwidth grid */}
                <div className="grid grid-cols-10 gap-1 h-12">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.1 }}
                      animate={{
                        opacity: [0.1, Math.random() > 0.5 ? 0.8 : 0.1, 0.1],
                        backgroundColor: Math.random() > 0.8 ? '#20C997' : '#00D4FF'
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2 + Math.random() * 3,
                        delay: Math.random() * 2
                      }}
                      className="rounded-[1px]"
                    />
                  ))}
                </div>

                <div className="space-y-2 border-t border-cyber-border pt-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">TOTAL_RX</span>
                    <span className="text-neon-cyan font-black tabular-nums tracking-widest">
                      {(selectedPeer.rx / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">TOTAL_TX</span>
                    <span className="text-orange-500 font-black tabular-nums tracking-widest">
                      {(selectedPeer.tx / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection Data */}
              <div className="grid grid-cols-2 gap-4 border-t border-cyber-border pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-600 font-black tracking-widest block">HANDSHAKE_TICK</label>
                  <div className="text-[10px] font-mono text-slate-300">{selectedPeer.handshake}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-600 font-black tracking-widest block">LATENCY</label>
                  <div className="text-[10px] font-mono text-neon-mint">{selectedPeer.latency}</div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-8 mt-auto">
                <div className="border border-red-500/20 bg-red-500/5 p-4 space-y-4 rounded-sm">
                  <div className="flex items-center gap-2 text-[10px] text-red-500 font-black tracking-[0.2em]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    CRITICAL_OPERATIONS
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedPeer) return;
                      try {
                        await api.revokePeer(selectedPeer.pubKey);
                        if (onRevokePeer) onRevokePeer(selectedPeer.id);
                      } catch (err) {
                        console.error("Revoke failed", err);
                      }
                    }}
                    className="w-full bg-transparent border border-red-500/50 text-red-500 font-black py-4 text-xs tracking-tighter hover:bg-red-500 hover:text-black transition-all"
                  >
                    [!] INITIATE_REVOKE_SEQUENCE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center flex-1 text-slate-500 font-bold text-[10px] tracking-widest text-center leading-relaxed">
              [ NO_TARGET_SELECTED ]<br />AWAITING_PEER_CONNECTION...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}