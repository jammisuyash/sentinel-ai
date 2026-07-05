import React, { useState } from 'react';
import { Incident, IncidentStatus, SeverityLevel } from '../types';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Flame, 
  Droplets, 
  Compass, 
  Activity, 
  ShieldAlert,
  MapPin, 
  User, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  WifiOff, 
  CheckCircle, 
  SendHorizontal 
} from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface IncidentCardProps {
  incident: Incident;
  onDispatchClick?: (incident: Incident) => void;
  onStatusChange?: (id: string, nextStatus: IncidentStatus) => void;
}

export default function IncidentCard({
  incident,
  onDispatchClick,
  onStatusChange
}: IncidentCardProps) {
  const [aiExpanded, setAiExpanded] = useState(false);
  const updateIncident = useCommandStore((state) => state.updateIncident);

  const severityColors = {
    critical: {
      border: 'border-l-4 border-l-rose-600',
      badge: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
      pulse: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
    },
    high: {
      border: 'border-l-4 border-l-orange-500',
      badge: 'bg-orange-950/40 text-orange-300 border-orange-500/30',
      pulse: 'bg-orange-400'
    },
    medium: {
      border: 'border-l-4 border-l-amber-500',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
      pulse: 'bg-amber-400'
    },
    low: {
      border: 'border-l-4 border-l-blue-500',
      badge: 'bg-blue-950/40 text-blue-300 border-blue-500/30',
      pulse: 'bg-blue-400'
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-4.5 h-4.5 text-rose-400" />;
      case 'flood':
        return <Droplets className="w-4.5 h-4.5 text-blue-400" />;
      case 'medical':
        return <Activity className="w-4.5 h-4.5 text-emerald-400" />;
      case 'earthquake':
        return <Compass className="w-4.5 h-4.5 text-orange-400 animate-spin" />;
      default:
        return <ShieldAlert className="w-4.5 h-4.5 text-slate-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const now = Date.now();
    const past = new Date(isoString).getTime();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just reported';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const currentColors = severityColors[incident.severity] || severityColors.low;

  return (
    <motion.div
      layout
      className={`relative bg-slate-950 border border-slate-900 rounded-lg overflow-hidden ${currentColors.border} shadow-md shadow-slate-950/40`}
    >
      {/* Offline Staging overlay tag */}
      {incident.isOffline && (
        <div className="absolute top-0 right-12 bg-amber-500/10 border-x border-b border-amber-500/30 px-2.5 py-0.5 rounded-b flex items-center gap-1.5 z-10">
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span className="font-mono text-[9px] font-bold text-amber-400 uppercase tracking-wider">OFFLINE CACHED</span>
        </div>
      )}

      {/* Main card body */}
      <div className="p-5">
        {/* Top meta tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            {/* Pulsing indicator dot representing active status */}
            {incident.status !== 'resolved' && (
              <span className={`w-2 h-2 rounded-full ${currentColors.pulse}`} />
            )}
            
            {/* Severity Badge */}
            <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${currentColors.badge}`}>
              {incident.severity}
            </span>

            {/* Type Icon & Badge */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5 font-mono text-[10px] text-slate-300 uppercase">
              {getIncidentIcon(incident.type)}
              <span>{incident.type}</span>
            </div>
          </div>

          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(incident.createdAt)}
            </span>
            <span className="text-slate-800">|</span>
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              {incident.reportedBy}
            </span>
          </div>
        </div>

        {/* Content details */}
        <h4 className="font-sans font-bold text-base text-slate-100 hover:text-red-400 transition-colors">
          {incident.title}
        </h4>
        <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
          {incident.description}
        </p>

        {/* Location indicators */}
        <div className="mt-3.5 flex items-center gap-2 bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded text-xs font-mono text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate text-slate-300">{incident.location.address || 'GPS Location Locked'}</span>
          <span className="hidden md:inline text-slate-600">({incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)})</span>
        </div>

        {/* AI Tactical Intelligence accordion section */}
        {incident.aiAnalysis && (
          <div className="mt-4 border-t border-slate-900 pt-3">
            <button
              onClick={() => setAiExpanded(!aiExpanded)}
              className="w-full flex items-center justify-between py-1 px-2.5 rounded bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 border border-slate-850 hover:border-slate-800 transition-all"
            >
              <div className="flex items-center gap-1.5 text-red-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-red-400 shrink-0" />
                <span className="font-mono tracking-wider uppercase text-[10px]">Gemini Tactical Diagnosis</span>
              </div>
              {aiExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {aiExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 p-3.5 rounded border border-red-950/20 bg-red-950/5 text-xs flex flex-col gap-3">
                    <div>
                      <span className="font-mono text-[9px] uppercase font-semibold text-red-400 tracking-wider">Strategic Summary</span>
                      <p className="mt-1 text-slate-300 leading-relaxed font-sans">{incident.aiAnalysis.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-900">
                      <div>
                        <span className="font-mono text-[9px] uppercase font-semibold text-amber-400 tracking-wider">Recommended Evacs & Actions</span>
                        <ul className="mt-1.5 space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                          {incident.aiAnalysis.recommendedActions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] uppercase font-semibold text-sky-400 tracking-wider">Required Tactical Assets</span>
                        <ul className="mt-1.5 space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                          {incident.aiAnalysis.requiredResources.map((res, idx) => (
                            <li key={idx} className="font-mono text-[10px] text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded inline-block mr-1 mb-1 border border-slate-850">
                              {res}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase self-center mr-1">Status:</span>
            <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
              incident.status === 'active' ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' :
              incident.status === 'dispatching' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              incident.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              {incident.status}
            </span>
          </div>

          <div className="flex gap-2">
            {incident.status === 'reported' && (
              <Button 
                variant="tactical" 
                size="sm" 
                leftIcon={<SendHorizontal className="w-3 h-3" />}
                onClick={() => onDispatchClick?.(incident)}
              >
                Dispatch First Responders
              </Button>
            )}

            {incident.status === 'dispatching' && (
              <Button 
                variant="tactical" 
                size="sm" 
                onClick={() => onStatusChange?.(incident.id, 'active')}
              >
                Mark Active Operations
              </Button>
            )}

            {incident.status === 'active' && (
              <Button 
                variant="success" 
                size="sm" 
                leftIcon={<CheckCircle className="w-3 h-3" />}
                onClick={() => onStatusChange?.(incident.id, 'resolved')}
              >
                Resolve Incident
              </Button>
            )}

            {incident.status === 'resolved' && (
              <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> COMPLETED OPERATIONS
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
