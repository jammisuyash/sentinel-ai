import React, { useState, useEffect } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Bell, 
  CloudSun, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Activity, 
  ChevronDown, 
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Button } from './ui/Button';

export default function Navbar() {
  const { isOnline, setIsOnline, incidents } = useCommandStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Auto-updating tactical clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format UTC time for that mission-control aesthetic
  const formatTacticalTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} UTC`;
  };

  const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;

  return (
    <nav className="relative h-16 border-b border-slate-900 bg-slate-950 px-6 flex items-center justify-between z-40 select-none">
      {/* Absolute scanline effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-red-500/20 shadow-[0_1px_8px_rgba(239,68,68,0.3)]" />

      {/* Left side: Brand Logo / Active status indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded border border-red-500/30 bg-red-950/20 text-red-500">
            <Compass className="w-4.5 h-4.5 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 bg-red-500/5 blur-sm animate-pulse rounded" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold tracking-wider text-sm text-slate-100">SENTINEL AI</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-medium">TACTICAL ENG-1</span>
            </div>
            <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">Disaster Response Command Center</div>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-slate-900" />

        {/* Threat level warning sign */}
        <div className="hidden md:flex items-center gap-2 bg-rose-950/20 border border-rose-500/20 px-2.5 py-1 rounded">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="font-mono text-[10px] text-rose-400 font-semibold tracking-wider uppercase">Active Threat High</span>
        </div>
      </div>

      {/* Center metadata details: weather, location, real-time tracking clock */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>Zone: SF_METRO_BAY_A</span>
        </div>
        
        <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
          <CloudSun className="w-3.5 h-3.5 text-amber-500/80" />
          <span>64°F / Overcast • Wind WSW 14mph</span>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-bold">{formatTacticalTime(currentTime)}</span>
        </div>
      </div>

      {/* Right side controls: manual network status toggle, notifications alerts drawer, user info placeholder */}
      <div className="flex items-center gap-3">
        {/* Connection Toggle (Crucial for showing off Offline Replication capability) */}
        <div className="flex items-center">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`
              relative h-8 px-3 rounded flex items-center gap-2 border transition-all duration-300 font-mono text-xs font-semibold
              ${isOnline 
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400' 
                : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50 text-amber-400 animate-pulse'
              }
            `}
            title="Toggle Network Status (Simulate Offline State)"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </span>
          </button>
        </div>

        {/* Notifications Alert Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`
              relative w-8 h-8 rounded border flex items-center justify-center transition-all duration-200
              ${activeIncidentsCount > 0 
                ? 'bg-slate-900 hover:bg-slate-800 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400'
              }
            `}
          >
            <Bell className="w-4 h-4" />
            {activeIncidentsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 border border-slate-950 font-mono text-[9px] text-white flex items-center justify-center font-bold">
                {activeIncidentsCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-slate-950 border border-slate-900 rounded-lg shadow-2xl p-1 z-50">
              <div className="p-3 border-b border-slate-900 flex justify-between items-center">
                <span className="font-display font-semibold text-xs tracking-wider uppercase text-slate-300">Tactical Activity Log</span>
                <span className="font-mono text-[9px] text-slate-500 uppercase">{activeIncidentsCount} active events</span>
              </div>
              <div className="max-h-64 overflow-y-auto p-1.5 flex flex-col gap-1">
                {incidents.slice(0, 4).map((inc) => (
                  <div key={inc.id} className="p-2 rounded bg-slate-900/50 hover:bg-slate-900 border border-slate-850 flex gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                      inc.severity === 'critical' ? 'bg-red-500 animate-ping' :
                      inc.severity === 'high' ? 'bg-orange-500' :
                      inc.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200 line-clamp-1">{inc.title}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">{inc.status} • {inc.location.address || 'Unknown Loc'}</p>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="p-4 text-center font-mono text-xs text-slate-600">
                    No active dispatches.
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-900 text-center">
                <Button variant="ghost" size="sm" className="w-full text-[10px] font-mono tracking-wider uppercase" onClick={() => {
                  setNotificationsOpen(false);
                  useCommandStore.getState().setActiveView('dashboard');
                }}>
                  View All Reports
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
