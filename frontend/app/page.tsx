// app/page.tsx
"use client"

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Peer, SortOption } from './types';
import { api } from './lib/api';
import AddPeerModal from './components/AddPeerModal';
import EditPeerModal from './components/EditPeerModal';
import PeerTable from './components/PeerTable';
import ZoneTabs from './components/ZoneTabs';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';

export default function DashboardPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const [peers, setPeers] = useState<Peer[]>([]);

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent-desc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPeer, setEditingPeer] = useState<Peer | null>(null);

  const filteredPeers = peers.filter(p => {
    const isArchived = p.status === 'archived' || p.status === 'revoked';
    if (activeTab === 'active' && isArchived) return false;
    if (activeTab === 'archived' && !isArchived) return false;
    if (selectedZone !== 'all' && p.network_role !== selectedZone) return false;
    if (deviceFilter !== 'all' && p.device_type !== deviceFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.ip_address.includes(q) || p.public_key.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'ip-asc': return a.ip_address.localeCompare(b.ip_address);
      case 'rx-desc': return b.transfer_rx - a.transfer_rx;
      case 'tx-desc': return b.transfer_tx - a.transfer_tx;
      case 'recent-desc': return b.last_handshake - a.last_handshake;
      default: return 0;
    }
  });

  const fetchPeers = async () => {
    if (status !== 'connected' || !passphrase) return;
    try {
      const data = await api.syncPeers(passphrase);
      if (data.peers) setPeers(data.peers);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPeers();
    const intervalId = setInterval(fetchPeers, 15000);
    return () => clearInterval(intervalId);
  }, [status, passphrase]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const data = await api.checkStatus(passphrase);
      if (data.status === 'connected') {
        setStatus('connected');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Unknown error occurred.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Backend is unreachable.');
    }
  };

  const handleRevoke = async (peer: Peer) => {
    if (!confirm(`Are you sure you want to revoke access for ${peer.name}?`)) return;
    try {
      const res = await api.revokePeer(peer.public_key, passphrase);
      if (res.ok) fetchPeers();
    } catch (e) {
      alert('Internal server error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-gray-800/80 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4V4m-6 8v8M9 4H4v16h16V4h-5" /></svg>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">OpenWard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Zero Trust</span></h1>
              <p className="text-gray-400 mt-1 font-medium">Enterprise Gateway Orchestrator</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-900/50 px-5 py-3 rounded-2xl border border-gray-800 backdrop-blur-sm">
            {status === 'idle' && <><div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div><span className="text-sm font-semibold text-gray-400 tracking-wide">LOCKED</span></>}
            {status === 'loading' && <><div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div><span className="text-sm font-semibold text-amber-500 tracking-wide">CONNECTING</span></>}
            {status === 'connected' && <><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div><span className="text-sm font-semibold text-emerald-400 tracking-wide">ONLINE</span></>}
            {status === 'error' && <><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-sm font-semibold text-rose-500 tracking-wide">OFFLINE</span></>}
          </div>
        </header>

        {generatedConfig && (
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl shadow-emerald-900/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-3"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Identity Provisioned</h2>
              <button onClick={() => navigator.clipboard.writeText(generatedConfig)} className="text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg transition-all">Copy to Clipboard</button>
            </div>
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-6 font-mono text-sm text-emerald-50/80 overflow-y-auto max-h-72 shadow-inner">
                <pre>{generatedConfig}</pre>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-xl flex-shrink-0 flex items-center justify-center h-fit">
                <QRCodeSVG value={generatedConfig} size={220} level="H" includeMargin={false} />
              </div>
            </div>
            <button onClick={() => setGeneratedConfig(null)} className="mt-6 text-sm font-semibold text-gray-500 hover:text-white transition-colors">Dismiss</button>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {status !== 'connected' && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-10 shadow-2xl text-center py-20 backdrop-blur-xl">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Gateway Authentication</h2>
                  <p className="text-gray-400">Unlock the cryptographic vault to manage Zero Trust identities and routing rules.</p>
                  <form onSubmit={handleConnect} className="flex flex-col gap-4 mt-8">
                    <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Enter Vault Passphrase" className="bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-center text-lg text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner tracking-widest" autoFocus />
                    <button type="submit" disabled={status === 'loading'} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                      {status === 'loading' ? 'Decrypting Vault...' : 'Unlock Gateway'}
                    </button>
                  </form>
                  {message && <p className={`text-sm font-bold mt-4 ${status === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</p>}
                </div>
              </div>
            )}

            {status === 'connected' && (
              <div className="animate-fade-in">
                <ZoneTabs peers={peers} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
                <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} deviceFilter={deviceFilter} setDeviceFilter={setDeviceFilter} sortBy={sortBy} setSortBy={setSortBy} />
                <PeerTable peers={filteredPeers} activeTab={activeTab} setActiveTab={setActiveTab} onEdit={(p) => { setEditingPeer(p); setIsEditModalOpen(true); }} onRevoke={handleRevoke} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Sidebar status={status} peers={peers} onAddIdentity={() => setIsAddModalOpen(true)} />
          </div>
        </main>
      </div>

      <AddPeerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} passphrase={passphrase} onSuccess={(config) => { setGeneratedConfig(config); fetchPeers(); }} />
      <EditPeerModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingPeer(null); }} passphrase={passphrase} peer={editingPeer} onSuccess={fetchPeers} />
    </div>
  );
}