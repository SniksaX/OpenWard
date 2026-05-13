// app/components/PeerTable.tsx
import React from 'react';
import { Peer } from '../types';
import { ZONES, DEVICE_ICONS } from '../lib/constants';
import { formatBytes, timeSince, getConnectionStatus } from '../lib/utils';

interface PeerTableProps {
  peers: Peer[];
  activeTab: 'active' | 'archived';
  setActiveTab: (tab: 'active' | 'archived') => void;
  onEdit: (peer: Peer) => void;
  onRevoke: (peer: Peer) => void;
}

export default function PeerTable({ peers, activeTab, setActiveTab, onEdit, onRevoke }: PeerTableProps) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
      <div className="flex border-b border-gray-800 bg-gray-950/50 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all ${activeTab === 'active' ? 'bg-gray-800/80 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
        >
          Active Identities
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all ${activeTab === 'archived' ? 'bg-gray-800/80 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
        >
          Revoked & History
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950/80 text-xs uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-5 rounded-tl-lg">Status</th>
              <th className="px-6 py-5">Identity</th>
              <th className="px-6 py-5">Network IP</th>
              {activeTab === 'active' && <th className="px-6 py-5">Bandwidth</th>}
              <th className="px-6 py-5 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {peers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-60">
                    <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-400 text-lg">No identities found.</p>
                  </div>
                </td>
              </tr>
            ) : peers.map((peer) => {
              const zoneConfig = ZONES.find(z => z.id === peer.network_role) || ZONES[0];
              const connStatus = getConnectionStatus(peer.last_handshake);
              return (
                <tr key={peer.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full border ${connStatus.dot}`}></div>
                      <span className={`text-xs font-semibold tracking-wide ${connStatus.color}`}>{connStatus.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-lg shadow-inner">
                        {DEVICE_ICONS[peer.device_type] || '💻'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-100 text-base">{peer.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${zoneConfig.color} ${zoneConfig.text} ${zoneConfig.border}`}>
                            {zoneConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <a href={`http://10.200.200.1:8080/#logs?response_status=all&search=%22${peer.ip_address}%22`} target="_blank" rel="noopener noreferrer" className="group/ip flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer font-mono text-sm bg-gray-950/50 px-3 py-1.5 rounded-lg border border-gray-800/50 w-fit">
                      {peer.ip_address}
                      <svg className="w-3.5 h-3.5 opacity-0 group-hover/ip:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  {activeTab === 'active' && (
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-400/90 w-20"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>{formatBytes(peer.transfer_rx)}</span>
                          <span className="flex items-center gap-1 text-blue-400/90 w-20"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>{formatBytes(peer.transfer_tx)}</span>
                        </div>
                        <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {timeSince(peer.last_handshake)}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-5 text-right">
                    {activeTab === 'active' ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(peer)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => onRevoke(peer)} className="p-2 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all" title="Revoke">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-gray-600 bg-gray-900 px-3 py-1 rounded-md">Archived</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}