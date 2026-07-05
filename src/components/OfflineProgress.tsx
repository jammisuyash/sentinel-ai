import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { clearOfflineIncidents, getOfflineIncidents } from '../utils/offline';

export default function OfflineProgress() {
  const { isOnline, offlineQueue, incidents, addIncident, clearOfflineQueue } = useCommandStore();
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  const localCacheCount = offlineQueue.length;

  const handleForceSync = () => {
    if (localCacheCount === 0 || syncing) return;

    setSyncing(true);
    setSyncComplete(false);

    // Simulate synchronization network request latency
    setTimeout(() => {
      // Sync local incidents to global memory store
      offlineQueue.forEach((inc) => {
        addIncident({
          ...inc,
          isOffline: false,
          status: 'reported'
        });
      });

      // Clear queues
      clearOfflineIncidents();
      clearOfflineQueue();

      setSyncing(false);
      setSyncComplete(true);

      // Hide success tag shortly after
      setTimeout(() => setSyncComplete(false), 3000);
    }, 2000);
  };

  if (isOnline && localCacheCount === 0 && !syncComplete) {
    return null;
  }

  return (
    <div className="rounded bg-slate-950 border border-slate-900 p-4 relative overflow-hidden select-none">
      {/* Dynamic scan warning lights for offline status */}
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-500/20 shadow-[0_1px_8px_rgba(245,158,11,0.3)]" />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Connection Notification Info */}
        <div className="flex items-start gap-3">
          <div className={`w-8.5 h-8.5 rounded border flex items-center justify-center shrink-0 ${
            !isOnline 
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-400 animate-pulse' 
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
          }`}>
            {!isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-sans font-bold text-xs text-slate-100 uppercase tracking-wider">
                {!isOnline ? 'Local Offline Staging Active' : 'Network Connectivity Re-established'}
              </h5>
              <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none ${
                !isOnline ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {!isOnline ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
            
            <p className="text-[11px] font-sans text-slate-400 mt-1 leading-relaxed">
              {!isOnline 
                ? `You are in local-state emulation. All reported emergencies will be cached locally (${localCacheCount} pending).`
                : `${localCacheCount} incident reports currently staged in local memory queue. Synchronize to staging servers.`
              }
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {localCacheCount > 0 && (
            <Button
              variant={isOnline ? 'primary' : 'outline'}
              size="sm"
              isLoading={syncing}
              disabled={syncing || !isOnline}
              onClick={handleForceSync}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
              className="text-xs font-semibold uppercase tracking-wider font-mono px-3.5"
            >
              {syncing ? 'Syncing...' : 'Sync Local Queue'}
            </Button>
          )}

          {syncComplete && (
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5 bg-emerald-950/10 border border-emerald-500/20 px-2.5 py-1.5 rounded">
              <CheckCircle className="w-4 h-4" /> Staged Queue Synchronized
            </span>
          )}
        </div>
      </div>

      {/* Syncing Progress Animation Strip */}
      {syncing && (
        <div className="w-full h-1 bg-slate-900 overflow-hidden rounded-full mt-3">
          <div className="h-full bg-emerald-500 animate-stripe" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
