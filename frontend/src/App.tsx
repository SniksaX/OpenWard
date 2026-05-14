/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Square,
  Terminal,
  Users,
  Settings,
  ShieldCheck,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RoutingMatrixView from './components/RoutingMatrixView';
import TelemetryView from './components/TelemetryView';
import { api } from './services/api';

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await api.register(username, email, password);
      }
      const data = await api.login(email, password);
      if (data.token) {
        onLogin(data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      setError(err.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-overlay selection:bg-neon-mint selection:text-black flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-tr from-cyber-bg via-transparent to-neon-mint/5 opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md border border-cyber-border bg-cyber-bg/80 backdrop-blur-md p-8 rounded-sm shadow-2xl shadow-neon-mint/5"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-neon-mint p-2 rounded-sm">
            <Square className="w-6 h-6 text-cyber-bg fill-cyber-bg" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-slate-100">
            OPENWARD <span className="text-neon-mint/80">{isRegistering ? 'REGISTER' : 'ACCESS'}</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] text-neon-mint font-bold tracking-widest block uppercase">Operator_Name (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isRegistering}
                className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint focus:neon-glow-mint transition-all placeholder:text-slate-700 font-mono"
                placeholder="neo"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] text-neon-mint font-bold tracking-widest block uppercase">User_Ident (Email)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint focus:neon-glow-mint transition-all placeholder:text-slate-700 font-mono"
              placeholder="operator@openward.sys"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-neon-mint font-bold tracking-widest block uppercase">Passphrase</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/40 border border-cyber-border px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-neon-mint focus:neon-glow-mint transition-all placeholder:text-slate-700 font-mono"
              placeholder="••••••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-red-500 font-mono flex items-center gap-2 bg-red-500/10 p-2 border border-red-500/20 rounded-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-neon-mint/50 bg-neon-mint/10 text-neon-mint font-black text-sm py-4 rounded-sm hover:bg-neon-mint hover:text-black transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? '[ WAIT... ]' : (isRegistering ? '[ INITIATE_REGISTRATION ]' : '[ INITIATE_LOGIN_SEQUENCE ]')}
          </button>

          <div className="flex justify-center mt-4 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-[10px] text-slate-500 hover:text-neon-mint font-bold tracking-widest uppercase transition-colors"
            >
              {isRegistering ? 'SWITCH_TO_LOGIN_MODE' : 'CREATE_NEW_OPERATOR_ACCESS'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [peers, setPeers] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState('PEERS_CONTROLLER');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [selectedPeerId, setSelectedPeerId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [view, setView] = useState<'MATRIX' | 'TELEMETRY'>('MATRIX');

  const selectedPeer = peers.find(p => p.id === selectedPeerId) || peers[0] || null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPeers([]);
  };

  useEffect(() => {
    if (!token) return;


api.getPeers()
      .then((data) => {
        const rawPeers = Array.isArray(data?.peers) ? data.peers : (Array.isArray(data) ? data :[]);
        
        // Map backend snake_case fields to frontend expected fields
        const mappedPeers = rawPeers.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          ip: p.ip_address,
          pubKey: p.public_key || '',
          role: p.network_role,
          device: p.device_type,
          rx: p.transfer_rx || 0,
          tx: p.transfer_tx || 0,
          lastSeen: p.last_handshake === 0 ? 'NEVER' : 'ACTIVE',
          endpoint: 'AWAITING_CONNECTION',
          handshake: p.last_handshake || 0,
          latency: '0ms'
        }));

        setPeers(mappedPeers);
        if (mappedPeers.length > 0 && !selectedPeerId) {
          setSelectedPeerId(mappedPeers[0].id);
        }
      })
      .catch(console.error);

    const evtSource = new EventSource(`/api/streamStats?token=${token}`);

    evtSource.onmessage = (event) => {
      try {
        const statsArray = JSON.parse(event.data);
        setPeers(currentPeers => currentPeers.map(peer => {
          const updateResult = statsArray.find((s: any) => s.public_key === peer.pubKey);
          if (updateResult) {
            return {
              ...peer,
              rx: updateResult.transfer_rx,
              tx: updateResult.transfer_tx,
              handshake: updateResult.last_handshake,
              endpoint: updateResult.endpoint,
            };
          }
          return peer;
        }));
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => evtSource.close();
  }, [token]);

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const handleCopy = () => {
    if (!selectedPeer) return;
    navigator.clipboard.writeText(selectedPeer.pubKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen grid-overlay selection:bg-neon-mint selection:text-black">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-tr from-cyber-bg via-transparent to-neon-mint/5 opacity-50" />

      <div className="relative flex flex-col h-screen">
        {/* Header */}
        <header className="h-16 border-b border-cyber-border flex items-center justify-between px-6 bg-cyber-bg/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="bg-neon-mint p-1.5 rounded-sm">
              <Square className="w-5 h-5 text-cyber-bg fill-cyber-bg" />
            </div>
            <h1 className="text-xl font-bold tracking-widest text-slate-100">
              OPENWARD <span className="text-neon-mint/80">V1.0</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[10px]">
            <div className="flex flex-col items-end">
              <span className="text-slate-500">SERVER STATUS / HTTP 4444</span>
              <span className="text-neon-mint flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-mint blink" />
                ACTIVE
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-cyber-border pl-8">
              <span className="text-slate-500">DATABASE / SQLITE3</span>
              <span className="text-neon-cyan flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                CONNECTED
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-cyber-border pl-8">
              <span className="text-slate-500 underline underline-offset-4 decoration-neon-mint/30">SYSTEM_TIME</span>
              <span className="text-slate-300 font-mono tabular-nums">{currentTime.split('T')[1].split('.')[0]} UTC</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-cyber-border flex flex-col bg-cyber-bg/40 backdrop-blur-sm">
            <div className="p-6 space-y-8">
              {/* Modules section */}
              <section>
                <div className="text-[10px] text-slate-500 mb-4 tracking-[0.2em] font-bold">MODULES</div>
                <nav className="space-y-1">
                  {[
                    { id: 'PEERS_CONTROLLER', icon: <Terminal className="w-4 h-4" /> },
                    { id: 'USERS_CONTROLLER', icon: <Users className="w-4 h-4" /> },
                    { id: 'SYSTEM_CONFIG', icon: <Settings className="w-4 h-4" /> },
                  ].map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-all border border-transparent ${activeModule === module.id
                        ? 'bg-neon-mint/10 text-neon-mint border-neon-mint/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                        }`}
                    >
                      <span className={activeModule === module.id ? 'text-neon-mint' : 'text-slate-500'}>
                        {activeModule === module.id ? '>_' : module.icon}
                      </span>
                      {module.id}
                    </button>
                  ))}
                </nav>
              </section>

              {/* Network Environment section */}
              <section>
                <div className="text-[10px] text-slate-500 mb-4 tracking-[0.2em] font-bold">NETWORK ENVIRONMENT</div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">KERNEL LATENCY</span>
                      <span className="text-neon-mint">1.2ms</span>
                    </div>
                    <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '15%' }}
                        className="h-full bg-neon-mint"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">TUNNEL UPTIME</span>
                      <span className="text-neon-cyan">99.9%</span>
                    </div>
                    <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '99.9%' }}
                        className="h-full bg-neon-cyan"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-auto p-4 border-t border-cyber-border bg-cyber-bg">
              <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-neon-mint rounded-full" />
                <div className="text-[10px]">
                  <div className="text-slate-500 leading-none mb-1">API HEALTH</div>
                  <div className="text-neon-mint font-bold">STABLE</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-black/20 flex flex-col">
            <AnimatePresence mode="wait">
              {view === 'MATRIX' ? (
                <RoutingMatrixView
                  key="MATRIX"
                  peers={peers}
                  selectedPeerId={selectedPeerId}
                  setSelectedPeerId={setSelectedPeerId}
                  onNavigateToTelemetry={(id) => {
                    setSelectedPeerId(id);
                    setView('TELEMETRY');
                  }}
                  onCopy={handleCopy}
                  isCopied={isCopied}
                  onRevokePeer={(id: string) => {
                    setPeers(current => current.filter(p => p.id !== id));
                    if (selectedPeerId === id) setSelectedPeerId('');
                  }}
                />
              ) : (
                selectedPeer && <TelemetryView
                  key="TELEMETRY"
                  peer={selectedPeer}
                  onBack={() => setView('MATRIX')}
                  onCopy={handleCopy}
                  isCopied={isCopied}
                />
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Footer / Status Bar */}
        <footer className="h-8 border-t border-cyber-border bg-cyber-bg flex items-center justify-between px-4 text-[9px] text-slate-600 tracking-widest font-bold">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-mint/30" />
              PROCESSOR IDENT: 0x88F2
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan/30" />
              MEM_ALLOC: 42.4MB
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              CONNECTION ENCRYPTED (AES-256-GCM)
              <ShieldCheck className="w-2.5 h-2.5 text-neon-mint" />
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 hover:text-red-500 transition-colors border-l border-cyber-border pl-4"
            >
              LOGOUT <LogOut className="w-2.5 h-2.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
