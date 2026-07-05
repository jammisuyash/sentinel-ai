import React from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  LayoutDashboard, 
  Map, 
  FileSpreadsheet, 
  Settings, 
  Home, 
  PlusCircle, 
  Hotel, 
  Flame,
  Activity,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ActiveView } from '../types';

export default function Sidebar() {
  const { activeView, setActiveView, incidents, shelters, hospitals } = useCommandStore();

  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const availableShelters = shelters.filter(s => s.status === 'open').length;
  const busyHospitals = hospitals.filter(h => h.status === 'critical' || h.status === 'busy').length;

  const navItems = [
    { id: 'landing' as ActiveView, label: 'Control Center', icon: Home },
    { id: 'dashboard' as ActiveView, label: 'Tactical Dashboard', icon: LayoutDashboard, badge: activeIncidents, badgeColor: 'bg-red-500/10 border-red-500/30 text-red-400' },
    { id: 'incident-report' as ActiveView, label: 'Report Emergency', icon: PlusCircle, isAction: true },
    { id: 'live-map' as ActiveView, label: 'Tactical GIS Map', icon: Map, badge: activeIncidents > 0 ? 'LIVE' : null, badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' },
    { id: 'hospitals' as ActiveView, label: 'Hospital Resources', icon: Activity, badge: busyHospitals, badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    { id: 'shelters' as ActiveView, label: 'Shelter Capacities', icon: Hotel, badge: availableShelters, badgeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    { id: 'reports' as ActiveView, label: 'Situation Reports', icon: FileSpreadsheet },
    { id: 'settings' as ActiveView, label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between select-none shrink-0 z-30">
      {/* Top Section: Dashboard Links */}
      <div className="flex-1 py-4 flex flex-col gap-6">
        
        {/* Navigation Group Header */}
        <div className="px-4">
          <p className="font-mono text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-2.5">
            Mission Operations
          </p>
          
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    w-full px-3.5 py-2.5 rounded flex items-center justify-between border font-sans text-sm transition-all duration-200 group
                    ${isActive 
                      ? 'bg-red-950/20 border-red-500/40 text-red-400 font-semibold' 
                      : item.isAction 
                        ? 'bg-slate-900 hover:bg-red-950/10 border-slate-800 hover:border-red-900/40 text-slate-300 hover:text-red-300'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badge */}
                  {item.badge !== undefined && item.badge !== null && (
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Icon indicator for action */}
                  {!item.badge && isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical status sidebar widgets */}
        <div className="px-4 mt-auto">
          <div className="bg-slate-900/40 border border-slate-850 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sector Alert Status</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-red-600/10 text-red-400 border border-red-500/20 uppercase font-bold">ALARM</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Active Dispatches:</span>
                <span className="font-semibold text-red-400">{activeIncidents}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Critical Threats:</span>
                <span className={`font-semibold ${criticalIncidents > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                  {criticalIncidents}
                </span>
              </div>
              {/* Simple grid container progress indicator */}
              <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1.5">
                <div 
                  className={`h-full transition-all duration-500 ${criticalIncidents > 0 ? 'bg-rose-500 animate-pulse' : 'bg-red-500'}`} 
                  style={{ width: `${Math.min(100, (activeIncidents / 10) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom User Info & Session Controls */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
            {/* Online notification dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-slate-200 truncate leading-tight">Commander Rachel Stone</p>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-1">Staging Lead</p>
          </div>
          
          <button 
            className="w-7 h-7 rounded hover:bg-slate-900 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors"
            title="Lock Staging Command Console"
            onClick={() => setActiveView('landing')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
