// app/components/AddPeerModal.tsx
import React, { useState } from 'react';
import { api } from '../lib/api';
import { DEVICE_TYPES } from '../lib/constants';

interface AddPeerModalProps {
    isOpen: boolean;
    onClose: () => void;
    passphrase: string;
    onSuccess: (clientConfig: string) => void;
}

export default function AddPeerModal({ isOpen, onClose, passphrase, onSuccess }: AddPeerModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [useAdguard, setUseAdguard] = useState(true);
    const [fullTunnel, setFullTunnel] = useState(true);
    const [deviceType, setDeviceType] = useState('server');
    const [networkRole, setNetworkRole] = useState('guest');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.createPeer({
                name, passphrase, useAdguard, fullTunnel, device_type: deviceType, network_role: networkRole
            });
            const data = await response.json();

            if (response.ok) {
                onSuccess(data.clientConfig);
                setName('');
                onClose();
            } else {
                setError(data.error || 'Failed to create peer.');
            }
        } catch (err) {
            setError('Unable to reach the backend server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Provision Identity</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-rose-400 text-sm font-medium">{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="peerName" className="block text-sm font-semibold text-gray-300 mb-2">Device Name</label>
                            <input type="text" id="peerName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CEO MacBook Pro" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" required disabled={loading} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="deviceType" className="block text-sm font-semibold text-gray-300 mb-2">Device Class</label>
                                <select id="deviceType" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none" disabled={loading}>
                                    {DEVICE_TYPES.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="networkRole" className="block text-sm font-semibold text-gray-300 mb-2">Access Zone</label>
                                <select id="networkRole" value={networkRole} onChange={(e) => setNetworkRole(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none" disabled={loading}>
                                    <option value="guest">Guest (Internet)</option>
                                    <option value="gamer">Gamer</option>
                                    <option value="employee">Employee</option>
                                    <option value="shared_server">Shared Server</option>
                                    <option value="hidden_server">Hidden Server</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                        </div>
                        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-200">Enforce AdGuard DNS</span>
                                    <span className="text-xs text-gray-500">Route resolution through 10.200.200.1</span>
                                </div>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={useAdguard} onChange={(e) => setUseAdguard(e.target.checked)} />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${useAdguard ? 'bg-blue-600' : 'bg-gray-800'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${useAdguard ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                            </label>
                            <div className="h-px w-full bg-gray-800"></div>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-200">Global Tunnel (0.0.0.0/0)</span>
                                    <span className="text-xs text-gray-500">Route all internet traffic via gateway</span>
                                </div>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={fullTunnel} onChange={(e) => setFullTunnel(e.target.checked)} />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${fullTunnel ? 'bg-blue-600' : 'bg-gray-800'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${fullTunnel ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                            <button type="submit" disabled={loading || !name.trim()} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2">
                                {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> : 'Deploy Identity'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}