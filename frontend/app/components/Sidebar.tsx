// app/components/Sidebar.tsx
import React from 'react';
import { Peer } from '../types';
import { ZONES } from '../lib/constants';
import { formatBytes } from '../lib/utils';

interface SidebarProps {
    status: string;
    peers: Peer[];
    onAddIdentity: () => void;
}

export default function Sidebar({ status, peers, onAddIdentity }: SidebarProps) {
    const activePeers = peers.filter(p => p.status === 'active');
    const totalRx = activePeers.reduce((acc, p) => acc + p.transfer_rx, 0);
    const totalTx = activePeers.reduce((acc, p) => acc + p.transfer_tx, 0);

    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 shadow-2xl sticky top-6 backdrop-blur-xl">
            <button
                onClick={onAddIdentity}
                disabled={status !== 'connected'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:grayscale mb-8 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Provision Identity
            </button>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Capacity Matrix
                    </h3>
                </div>

                {ZONES.filter(z => z.id !== 'all').map(zone => {
                    const count = activePeers.filter(p => p.network_role === zone.id).length;
                    const max = zone.capacity || 50;
                    const percent = Math.min((count / max) * 100, 100);
                    return (
                        <div key={zone.id} className="group">
                            <div className="flex justify-between text-xs mb-2">
                                <span className={`font-semibold transition-colors ${zone.text}`}>{zone.label}</span>
                                <span className="text-gray-500 font-mono tracking-wider">{count}<span className="text-gray-700">/{max}</span></span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-700 ease-out ${zone.color.replace('/10', '/80').replace('/20', '/80')}`} style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-800/80">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Global Traffic
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-950 rounded-xl p-3 border border-gray-800">
                        <div className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Download</div>
                        <div className="text-emerald-400 font-mono text-sm">{formatBytes(totalRx)}</div>
                    </div>
                    <div className="bg-gray-950 rounded-xl p-3 border border-gray-800">
                        <div className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Upload</div>
                        <div className="text-blue-400 font-mono text-sm">{formatBytes(totalTx)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}