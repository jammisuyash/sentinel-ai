import React from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Database, 
  MapPin, 
  Trash2, 
  WifiOff, 
  Clock, 
  SendHorizontal,
  Flame,
  Droplets,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { Button } from './ui/Button';
import { clearOfflineIncidents, getOfflineIncidents } from '../utils/offline';

export default function LocalIncidentQueueCard() {
  const { offlineQueue, deleteIncident, clearOfflineQueue } = useCommandStore();

  const handleClearQueue = () => {
    clearOfflineIncidents();
    clearOfflineQueue();
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'flood':
        return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case 'medical':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (offlineQueue.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-slate-950 border border-slate-900 overflow-hidden shadow-lg shadow-slate-950/40">
      {/* Header */}
      <div className="h-11 border-b border-slate-900 bg-slate-950/95 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span className="font-display font-semibold text-xs tracking-wider uppercase text-slate-200">Local Staged Queue ({offlineQueue.length})</span>
        </div>
        <button 
          onClick={handleClearQueue}
          className="font-mono text-[9px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-300 flex items-center gap-1 bg-rose-950/10 border border-rose-500/20 px-2 py-0.5 rounded transition-all"
        >
          <Trash2 className="w-3 h-3" /> Clear Cached Queue
        </button>
      </div>

      {/* List content of local cache items */}
      <div className="p-3 max-h-60 overflow-y-auto flex flex-col gap-2 bg-slate-950/50">
        {offlineQueue.map((inc) => {
          return (
            <div 
              key={inc.id}
              className="p-3 rounded border border-slate-900 bg-slate-900/30 flex justify-between items-center gap-4 hover:border-slate-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getIncidentIcon(inc.type)}
                  <span className="font-sans font-bold text-xs text-slate-200 truncate">{inc.title}</span>
                  <span className={`font-mono text-[8px] font-bold uppercase px-1.5 rounded border ${
                    inc.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    inc.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                    'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[11px] font-sans text-slate-400 truncate pr-4">{inc.description}</p>
                
                <div className="flex items-center gap-2.5 mt-2 font-mono text-[9px] text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-600" /> {inc.location.address || 'Address Lock'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-600" /> Staged: Just now</span>
                </div>
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded font-mono text-[9px] font-bold uppercase">
                  <WifiOff className="w-3 h-3" /> Staged
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
