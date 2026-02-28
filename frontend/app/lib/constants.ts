// app/lib/constants.ts
import { Zone } from '../types';

export const ZONES: Zone[] = [
    { id: 'all', label: 'Global', color: 'bg-gray-800', text: 'text-white', border: 'border-gray-700' },
    { id: 'admin', label: 'Admins', range: '.2 - .15', capacity: 14, color: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    { id: 'hidden_server', label: 'Hidden Servers', range: '.16 - .49', capacity: 34, color: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
    { id: 'shared_server', label: 'Shared Servers', range: '.50 - .99', capacity: 50, color: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    { id: 'employee', label: 'Employees', range: '.100 - .149', capacity: 50, color: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    { id: 'gamer', label: 'Gamers', range: '.150 - .199', capacity: 50, color: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
    { id: 'guest', label: 'Guests', range: '.200 - .254', capacity: 55, color: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
];

export const DEVICE_TYPES = [
    { id: 'ios', label: 'iOS / iPadOS', icon: '📱' },
    { id: 'android', label: 'Android', icon: '📱' },
    { id: 'mac', label: 'macOS', icon: '💻' },
    { id: 'windows', label: 'Windows', icon: '🖥️' },
    { id: 'linux', label: 'Linux', icon: '🐧' },
    { id: 'server', label: 'Server / Router', icon: '🖧' }
];

export const DEVICE_ICONS: Record<string, string> = DEVICE_TYPES.reduce((acc, curr) => {
    acc[curr.id] = curr.icon;
    return acc;
}, {} as Record<string, string>);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';