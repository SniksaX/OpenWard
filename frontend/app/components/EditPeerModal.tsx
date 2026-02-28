// app/components/EditPeerModal.tsx
import React, { useState, useEffect } from 'react';
import { Peer } from '../types';
import { api } from '../lib/api';
import { DEVICE_TYPES } from '../lib/constants';

interface EditPeerModalProps {
    isOpen: boolean;
    onClose: () => void;
    passphrase: string;
    peer: Peer | null;
    onSuccess: () => void;
}

export default function EditPeerModal({ isOpen, onClose, passphrase, peer, onSuccess }: EditPeerModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState('server');
    const [networkRole, setNetworkRole] = useState('guest');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (peer && isOpen) {
            setName(peer.name || '');
            setDeviceType(peer.device_type || 'server');
            setNetworkRole(peer.network_role || 'guest');
            setError('');
        }
    }, [peer, isOpen]);

    if (!isOpen || !peer) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.updatePeer(peer.public_key, {
                name, device_type: deviceType, network_role: networkRole, passphrase
            });
            const data = await response.json();

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to update peer.');
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
                        <h2 className="text-2xl font-bold text-white tracking-tight">Modify Identity</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
                            <p className="text-rose-400 text-sm font-medium">{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Device Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" required disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Device Class</label>
                            <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none" disabled={loading}>
                                {DEVICE_TYPES.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                            </select>
                        </div>
                        <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-5 mt-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50"></div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-rose-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Immutable Cryptographic Constraints
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Network zones and DNS configs are burned into the client QR code and WireGuard interface. To change these, revoke and provision a new identity.</p>
                            <div className="opacity-50 grayscale pointer-events-none">
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Network Zone</label>
                                <select value={networkRole} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none" disabled>
                                    <option value="admin">Admin</option>
                                    <option value="hidden_server">Hidden Server</option>
                                    <option value="shared_server">Shared Server</option>
                                    <option value="employee">Employee</option>
                                    <option value="gamer">Gamer</option>
                                    <option value="guest">Guest</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                            <button type="submit" disabled={loading || !name.trim()} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2">
                                {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> : 'Update Identity'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}