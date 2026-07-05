import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { ShieldCheck, MapPin, Navigation, UserCheck, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { signOutLocal } from '../services/auth';
import type { Incident } from '../types';

export default function VolunteerDashboard() {
  const { authUser, setAuthUser, incidents, userLocation, updateIncident } = useCommandStore();
  const [activeMission, setActiveMission] = useState<Incident | null>(null);
  const [missionState, setMissionState] = useState<'navigating'|'reached'|'needs_resources'|'completed'>('navigating');

  // Simple hardcoded distance calc for demo
  const getSimulatedDistance = (inc: Incident) => {
    // Math.random gives 0.5 to 5.0 for demo if we don't have true haversine easily mapped
    return (Math.random() * 4.5 + 0.5).toFixed(1);
  };

  const nearbyActive = incidents.filter(i => i.status !== 'resolved' && i.id !== activeMission?.id);

  const handleSignOut = async () => {
    await signOutLocal();
    setAuthUser(null);
  };

  const handleAcceptMission = (incident: Incident) => {
    setActiveMission(incident);
    setMissionState('navigating');
    // Broadast acceptance to command
    updateIncident(incident.id, { 
      status: 'dispatching',
      assignedVolunteerId: authUser?.id,
      assignedVolunteerName: authUser?.name
    });
  };

  const handleMissionAction = (state: typeof missionState) => {
    setMissionState(state);
    if (!activeMission) return;

    if (state === 'reached') {
      updateIncident(activeMission.id, { status: 'active' });
    } else if (state === 'completed') {
      updateIncident(activeMission.id, { status: 'resolved' });
      alert('Mission Completed! Thank you for your service.');
      setActiveMission(null);
    } else if (state === 'needs_resources') {
      alert('Support requested! Public Command has been notified of heavy resource requirement.');
    }
  };

  if (activeMission) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in text-sans">
        <div className="flex justify-between items-center mb-8 bg-slate-950/80 border border-blue-500/20 rounded-xl p-6 backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-550/10 border border-blue-500/20 text-blue-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-3 animate-pulse">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Deployment
            </div>
            <h1 className="text-3xl font-sans font-bold text-slate-100">Mission: {activeMission.title}</h1>
            <p className="text-sm text-slate-400 mt-1">Responder: {authUser?.name}</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShieldCheck className="w-48 h-48" />
          </div>
          
          <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-900 pb-2">
             Dispatch Objectives
          </h2>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{activeMission.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <span className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Status</span>
              <span className="font-bold text-slate-200">{missionState.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <span className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Target Coordinates</span>
              <span className="font-bold text-blue-400 text-xs font-mono">{activeMission.location?.lat?.toFixed(4)}, {activeMission.location?.lng?.toFixed(4)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant={missionState === 'navigating' ? 'tactical' : 'outline'}
              className="flex-1"
              disabled={missionState !== 'navigating'}
              onClick={() => handleMissionAction('reached')}
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Victim Reached
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-rose-500/50 hover:bg-rose-500/10 text-rose-400"
              disabled={missionState === 'completed'}
              onClick={() => handleMissionAction('needs_resources')}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Need More Resources
            </Button>
            <Button 
              variant={missionState === 'reached' || missionState === 'needs_resources' ? 'tactical' : 'outline'}
              className="flex-1"
              disabled={missionState === 'completed' || missionState === 'navigating'}
              onClick={() => handleMissionAction('completed')}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Mission Completed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in font-sans">
      <div className="flex justify-between items-center mb-8 bg-slate-950/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-3">
            <UserCheck className="w-3.5 h-3.5" />
            Field Ops Terminal
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-100">Welcome, {authUser?.name}</h1>
          <p className="text-sm text-slate-400 mt-1">Review your local grid and intercept active emergencies.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </div>

      <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-900 pb-2">
        Nearby Incidents Requesting Dispatch
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nearbyActive.length === 0 ? (
          <div className="col-span-2 p-10 text-center border border-slate-900 rounded-lg bg-slate-950">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <p className="text-slate-400 font-mono">No active incidents in your immediate sector.</p>
          </div>
        ) : (
          nearbyActive.map((inc) => (
            <div key={inc.id} className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-200 text-lg">{inc.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    inc.severity === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    inc.severity === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{inc.description}</p>
                <div className="text-[10px] font-mono text-blue-400 flex items-center gap-1 mb-4">
                  <Navigation className="w-3 h-3" />
                  {getSimulatedDistance(inc)} km away
                </div>
              </div>
              <Button 
                variant="tactical" 
                className="w-full"
                onClick={() => handleAcceptMission(inc)}
              >
                Accept Mission
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
