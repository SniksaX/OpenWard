import { useState } from 'react';
import { Square, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
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