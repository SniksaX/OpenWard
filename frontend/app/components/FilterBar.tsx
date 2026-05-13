// app/components/FilterBar.tsx
import React from 'react';
import { DEVICE_TYPES } from '../lib/constants';
import { SortOption } from '../types';

interface FilterBarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    deviceFilter: string;
    setDeviceFilter: (d: string) => void;
    sortBy: SortOption;
    setSortBy: (s: SortOption) => void;
}

export default function FilterBar({ searchQuery, setSearchQuery, deviceFilter, setDeviceFilter, sortBy, setSortBy }: FilterBarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-900/40 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search by Name, IP, or Public Key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                />
            </div>

            <div className="flex gap-4">
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <select
                        value={deviceFilter}
                        onChange={(e) => setDeviceFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                    >
                        <option value="all">All Devices</option>
                        {DEVICE_TYPES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                </div>

                <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full pl-10 pr-8 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                    >
                        <option value="recent-desc">Most Active</option>
                        <option value="rx-desc">Highest Download</option>
                        <option value="tx-desc">Highest Upload</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="ip-asc">IP Address</option>
                    </select>
                </div>
            </div>
        </div>
    );
}