// app/components/ZoneTabs.tsx
import React from 'react';
import { Peer } from '../types';
import { ZONES } from '../lib/constants';

interface ZoneTabsProps {
    peers: Peer[];
    selectedZone: string;
    setSelectedZone: (zoneId: string) => void;
}

export default function ZoneTabs({ peers, selectedZone, setSelectedZone }: ZoneTabsProps) {
    return (
        <div className= "flex flex-wrap gap-2" >
        {
            ZONES.map(zone => {
                const count = peers.filter(p => p.status !== 'archived' && (zone.id === 'all' || p.network_role === zone.id)).length;
                const isActive = selectedZone === zone.id;
                return (
                    <button
            key= { zone.id }
                onClick = {() => setSelectedZone(zone.id)
            }
            className = {`
              group relative px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200
              ${isActive ? `${zone.color} ${zone.text} ${zone.border} ring-1 ring-white/10 shadow-lg` : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
            `}
        >
        <div className="flex flex-col items-start gap-0.5" >
            <div className="flex items-center gap-2" >
                <span>{ zone.label } </span>
                < span className = {`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/30' : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700'}`
}> { count } </span>
    </div>
{ zone.range && <span className="text-[10px] opacity-60 font-mono tracking-tight" > { zone.range } </span> }
</div>
    </button>
        )
      })}
</div>
  );
}