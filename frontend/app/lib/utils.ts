// app/lib/utils.ts
import { ConnectionStatus } from '../types';

export function formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function timeSince(date: number): string {
    if (date === 0) return 'Offline';
    const seconds = Math.floor((new Date().getTime() / 1000) - date);
    if (seconds < 60) return 'Just now';
    const interval = Math.floor(seconds / 60);
    if (interval < 60) return `${interval}m ago`;
    const hours = Math.floor(interval / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function getConnectionStatus(lastHandshake: number): ConnectionStatus {
    const hs = Number(lastHandshake) || 0;
    if (hs === 0) return { label: "Offline", color: "text-gray-500", dot: "bg-gray-600 border-gray-500" };
    const now = Math.floor(Date.now() / 1000);
    if (now - hs <= 180) return { label: "Online", color: "text-emerald-400", dot: "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" };
    if (now - hs <= 3600) return { label: "Away", color: "text-amber-400", dot: "bg-amber-500 border-amber-400" };
    return { label: "Offline", color: "text-gray-500", dot: "bg-gray-600 border-gray-500" };
}