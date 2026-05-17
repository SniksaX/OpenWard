import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Shield, Smartphone, Monitor, Server, AlertTriangle } from 'lucide-react';

interface CreatePeerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CreatePeerModal({ isOpen, onClose, onSubmit }: CreatePeerModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [device, setDevice] = useState('mobile');
  const [fullTunnel, setFullTunnel] = useState(true);
  const [useAdguard, setUseAdguard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('IDENTIFIER_REQUIRED');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await onSubmit({
        name,
        network_role: role,
        device_type: device,
        full_tunnel: fullTunnel,
        use_adguard: useAdguard,
        passphrase: 'auto-generated' // Backend accepts it but we don't strict enforce it yet
      });
      // Reset form
      setName('');
      setRole('employee');
      setDevice('mobile');
      setFullTunnel(true);
      setUseAdguard(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'DEPLOYMENT_FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg border border-neon-mint/30 bg-cyber-bg shadow-2xl shadow-neon-mint/10 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-cyber-border bg-neon-mint/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-neon-mint font-bold tracking-widest text-xs">
              <Terminal className="w-4 h-4" />
              <span>[+] DEPLOY_NEW_PEER_NODE</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-neon-mint transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold tracking-widest block uppercase">Node_Identifier (Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint focus:neon-glow-mint transition-all placeholder:text-slate-700 font-mono"
                placeholder="e.g. neos-iphone"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role Select */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold tracking-widest block uppercase">Network_Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint transition-all font-mono uppercase cursor-pointer appearance-none"
                >
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="hidden_server">Hidden Server</option>
                  <option value="shared_server">Shared Server</option>
                  <option value="gamer">Gamer</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Device Select */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold tracking-widest block uppercase">Hardware_Profile</label>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint transition-all font-mono uppercase cursor-pointer appearance-none"
                >
                  <option value="mobile">Mobile / Tablet</option>
                  <option value="desktop">Desktop / Laptop</option>
                  <option value="server">Headless Server</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 border border-cyber-border p-4 bg-white/[0.01]">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${fullTunnel ? 'border-neon-mint bg-neon-mint/20' : 'border-cyber-border bg-black/40'}`}>
                  {fullTunnel && <div className="w-2 h-2 bg-neon-mint" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-200 font-bold tracking-wider group-hover:text-neon-mint transition-colors">ROUTE_ALL_TRAFFIC (0.0.0.0/0)</div>
                  <div className="text-[9px] text-slate-500">Force all internet traffic through the secure tunnel</div>
                </div>
                <input type="checkbox" className="hidden" checked={fullTunnel} onChange={(e) => setFullTunnel(e.target.checked)} />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${useAdguard ? 'border-neon-cyan bg-neon-cyan/20' : 'border-cyber-border bg-black/40'}`}>
                  {useAdguard && <div className="w-2 h-2 bg-neon-cyan" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-200 font-bold tracking-wider group-hover:text-neon-cyan transition-colors">ENABLE_ADGUARD_DNS</div>
                  <div className="text-[9px] text-slate-500">Route DNS queries through internal blocklist resolver</div>
                </div>
                <input type="checkbox" className="hidden" checked={useAdguard} onChange={(e) => setUseAdguard(e.target.checked)} />
              </label>
            </div>

            {error && (
              <div className="text-[10px] text-red-500 font-mono flex items-center gap-2 bg-red-500/10 p-2 border border-red-500/20 rounded-sm uppercase font-bold tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 mt-4 border-t border-cyber-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border border-cyber-border text-slate-400 font-black text-xs py-3 rounded-sm hover:bg-slate-800 hover:text-white transition-all tracking-widest"
              >
                [ ABORT ]
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] border border-neon-mint/50 bg-neon-mint/10 text-neon-mint font-black text-xs py-3 rounded-sm hover:bg-neon-mint hover:text-black transition-all tracking-widest disabled:opacity-50"
              >
                {loading ? '[ INITIATING_DEPLOYMENT... ]' : '[ EXECUTE_DEPLOYMENT ]'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}