import React, { useEffect, useMemo } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import IncidentReport from './IncidentReport';
import { 
  ShieldCheck, HeartPulse, Hospital as HospitalIcon, Home, Utensils, Droplets, 
  MapPin, Phone, AlertTriangle, Clock, LogOut, Navigation, Shield, Siren,
  Building2, Flame, Activity
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { signOutLocal } from '../services/auth';
import { getEmergencyHelplines } from '../services/maps';
import type { Incident } from '../types';

export default function CitizenDashboard() {
  const { 
    authUser, 
    setAuthUser,
    incidents, 
    hospitals, 
    shelters,
    policeStations,
    fireStations,
    bloodBanks,
    userLocation,
    refreshNearbyFacilities,
    helplineNumbers
  } = useCommandStore();

  // Find the latest incident reported by this citizen
  const myIncidents = incidents.filter(
    i => i.reportedBy === authUser?.name || i.reporterId === authUser?.id
  );
  const latestIncident = myIncidents.length > 0 ? myIncidents[0] : null;

  // When the citizen has just submitted an incident, immediately refresh nearby data
  // using the incident's location or the user's GPS.
  useEffect(() => {
    if (latestIncident && latestIncident.status !== 'resolved') {
      const coords = userLocation 
        || (latestIncident.location ? { lat: latestIncident.location.lat, lng: latestIncident.location.lng } : null);
      if (coords && hospitals.length === 0) {
        refreshNearbyFacilities(coords);
      }
    }
  }, [latestIncident?.id]);

  // Get helpline numbers based on the TYPE of the incident
  const typeSpecificHelplines = useMemo(() => {
    if (latestIncident?.type) {
      return getEmergencyHelplines(undefined, latestIncident.type);
    }
    return helplineNumbers || getEmergencyHelplines();
  }, [latestIncident?.type, helplineNumbers]);

  const handleSignOut = async () => {
    await signOutLocal();
    setAuthUser(null);
  };

  // ============================================================
  // STATE 1: No active incident → show the report form
  // ============================================================
  if (!latestIncident || latestIncident.status === 'resolved') {
    return (
      <div className="relative">
        <div className="max-w-4xl mx-auto px-6 pt-8 font-sans flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Citizen Emergency Portal
            </h1>
            <p className="text-sm text-slate-400">Welcome, {authUser?.name}. State your emergency to get immediate help.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </div>
        <IncidentReport />
      </div>
    );
  }

  // ============================================================
  // STATE 2: Active incident → Post-Submission Tracking Dashboard
  // ============================================================
  const ai = latestIncident.aiAnalysis;
  const isAssigned = !!latestIncident.assignedVolunteerName;

  // Calculate distances for real nearby hospitals
  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const refCoords = userLocation || latestIncident.location || { lat: 0, lng: 0 };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-550/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-3 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Live Emergency Tracking
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Help is on the way, {authUser?.name}</h1>
          <p className="text-sm text-slate-400 mt-2">Your <strong className="text-slate-200 capitalize">{latestIncident.type?.replace('_', ' ')}</strong> report has been logged &amp; verified by Sentinel AI.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TOP ROW: Status + AI Safety Instructions                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full" />
          <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            Status Tracking
          </h2>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-2xl font-bold font-mono">
                {latestIncident.status === 'reported' ? '1' : latestIncident.status === 'dispatching' ? '2' : '3'}
              </div>
              <div>
                <p className="font-bold text-slate-200 capitalize text-lg">{latestIncident.status}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">Incident ID: {latestIncident.id.slice(0, 8)}</p>
              </div>
            </div>
            {isAssigned && (
              <div className="text-right">
                <p className="text-[10px] font-mono text-emerald-500 uppercase font-bold mb-1">Responder ETA</p>
                <p className="text-2xl font-mono font-bold text-emerald-400 flex items-center justify-end gap-1.5"><Clock className="w-5 h-5"/> 4 MIN</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4">
            <h3 className="font-bold text-slate-200 mb-2 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Assigned Field Volunteer
            </h3>
            {isAssigned ? (
              <div className="flex justify-between items-center">
                <p className="font-mono text-slate-300 text-sm font-bold">{latestIncident.assignedVolunteerName}</p>
                <Button variant="outline" size="sm" leftIcon={<MapPin className="w-3.5 h-3.5" />}>Track Live</Button>
              </div>
            ) : (
              <p className="font-mono text-xs text-amber-500 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Searching for nearest available volunteer...
              </p>
            )}
          </div>
        </div>

        {/* AI Safety Instructions */}
        <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-6 shadow-xl">
           <h2 className="font-mono text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            AI Safety Instructions
          </h2>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-rose-300 leading-relaxed mb-4">
              {latestIncident.emergencyInstructions || latestIncident.evacuationAdvice || 'Evacuate the immediate area and wait for first responders.'}
            </p>
            {ai?.recommendedActions?.map((action: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-rose-200/80">
                <span className="text-rose-500 mt-0.5">•</span>
                <p>{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HELPLINE NUMBERS — TYPE-SPECIFIC (MOST IMPORTANT)            */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-red-950/40 to-slate-950 border border-red-500/20 rounded-xl p-5 mb-8">
        <h2 className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Siren className="w-4 h-4" />
          Emergency Helplines for {latestIncident.type?.replace('_', ' ').toUpperCase()} Incidents
        </h2>
        <div className="flex flex-wrap gap-3">
          {typeSpecificHelplines.map((contact, idx) => (
            <a 
              key={idx} 
              href={`tel:${contact.number}`}
              className="flex items-center gap-2 bg-slate-900/80 hover:bg-red-950/60 px-4 py-2.5 rounded-lg border border-slate-800 hover:border-red-500/40 transition-all group cursor-pointer"
            >
              <Phone className="w-4 h-4 text-red-400 group-hover:animate-pulse" />
              <div>
                <p className="font-bold text-slate-200 text-sm">{contact.name}</p>
                <p className="text-xs font-mono text-red-400 font-bold">{contact.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* NEARBY HOSPITALS (REAL from GPS / Google Places)              */}
      {/* ============================================================ */}
      <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2 flex items-center gap-2">
        <HospitalIcon className="w-4 h-4 text-red-400" /> Nearest Hospitals
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {hospitals.length > 0 ? hospitals.slice(0, 4).map((hosp, idx) => {
          const dist = hosp.distance || (
            hosp.location?.lat && refCoords.lat 
              ? calcDistance(refCoords.lat, refCoords.lng, hosp.location.lat, hosp.location.lng) 
              : 0
          );
          const travelMin = hosp.travelTime || `${Math.max(2, Math.round(dist * 3))} min`;
          return (
            <div key={hosp.id || idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-red-500/30 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <HospitalIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-sm group-hover:text-red-400 transition-colors">{hosp.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{hosp.location?.address || 'Nearby'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> {dist.toFixed(1)} km
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {travelMin}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        hosp.status === 'critical' ? 'bg-red-500/10 text-red-400' : 
                        hosp.status === 'busy' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {hosp.status || 'Open'}
                      </span>
                    </div>
                  </div>
                </div>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.location?.lat},${hosp.location?.lng}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" leftIcon={<Navigation className="w-3.5 h-3.5" />}>
                    Directions
                  </Button>
                </a>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-6 text-center">
            <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-spin" />
            <p className="text-slate-500 text-sm font-mono">Locating nearest hospitals...</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* NEARBY SHELTERS (REAL from GPS / Google Places)               */}
      {/* ============================================================ */}
      <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2 flex items-center gap-2">
        <Home className="w-4 h-4 text-blue-400" /> Nearest Shelters &amp; Safe Zones
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {shelters.length > 0 ? shelters.slice(0, 4).map((shelter, idx) => {
          const dist = shelter.distance || (
            shelter.location?.lat && refCoords.lat 
              ? calcDistance(refCoords.lat, refCoords.lng, shelter.location.lat, shelter.location.lng) 
              : 0
          );
          const travelMin = shelter.travelTime || `${Math.max(3, Math.round(dist * 3.5))} min`;
          return (
            <div key={shelter.id || idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-blue-500/30 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Home className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{shelter.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{shelter.location?.address || 'Nearby'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> {dist.toFixed(1)} km
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {travelMin}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        shelter.status === 'full' ? 'bg-red-500/10 text-red-400' : 
                        shelter.status === 'closed' ? 'bg-slate-500/10 text-slate-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {shelter.status || 'Open'}
                      </span>
                    </div>
                    {/* Amenities */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {shelter.foodAvailable && (
                        <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">🍽 Food</span>
                      )}
                      {shelter.drinkingWater && (
                        <span className="text-[8px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">💧 Water</span>
                      )}
                      {shelter.medicalAssistance && (
                        <span className="text-[8px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">🏥 Medical</span>
                      )}
                      {shelter.washrooms && (
                        <span className="text-[8px] font-mono bg-slate-500/10 text-slate-300 px-1.5 py-0.5 rounded border border-slate-500/20">🚻 Restrooms</span>
                      )}
                    </div>
                  </div>
                </div>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.location?.lat},${shelter.location?.lng}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" leftIcon={<Navigation className="w-3.5 h-3.5" />}>
                    Directions
                  </Button>
                </a>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-6 text-center">
            <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-spin" />
            <p className="text-slate-500 text-sm font-mono">Locating nearest shelters...</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADDITIONAL RESOURCES (Food, Water, Medical Camps)            */}
      {/* ============================================================ */}
      <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
        Additional Resources Near You
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-amber-500/30 transition-colors">
          <Utensils className="w-5 h-5 text-amber-500 mb-3" />
          <p className="font-bold text-slate-200 text-sm">{latestIncident.nearestFoodCamp || 'Food Relief Camp'}</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Active 24/7</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-cyan-500/30 transition-colors">
          <Droplets className="w-5 h-5 text-cyan-400 mb-3" />
          <p className="font-bold text-slate-200 text-sm">{latestIncident.nearestWaterSource || 'Water Distribution Point'}</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Safe Drinking</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-emerald-500/30 transition-colors">
          <HeartPulse className="w-5 h-5 text-emerald-400 mb-3" />
          <p className="font-bold text-slate-200 text-sm">Medical Camp</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">First Aid & Triage</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-red-500/30 transition-colors">
          <Shield className="w-5 h-5 text-red-400 mb-3" />
          <p className="font-bold text-slate-200 text-sm">{policeStations[0]?.name || 'Nearest Police Station'}</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Safety & Escort</p>
        </div>
      </div>

      {/* QR Evacuation Pass */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Digital Evacuation Pass</h2>
          <p className="text-xs text-slate-400">Show this QR at any relief checkpoint for priority access.</p>
        </div>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SENTINEL-EVAC-${latestIncident.id.slice(0,8)}-${authUser?.name || 'citizen'}`} 
          className="w-16 h-16 rounded shadow-lg bg-white p-1" 
          alt="Evacuation Pass QR" 
        />
      </div>

    </div>
  );
}
