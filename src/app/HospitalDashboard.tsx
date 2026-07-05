import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { Building2, Activity, HeartPulse, Bed, Stethoscope, Droplet, Truck, Save, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { signOutLocal } from '../services/auth';
import { Hospital } from '../types';

export default function HospitalDashboard() {
  const { authUser, setAuthUser, hospitals, updateHospital } = useCommandStore();
  
  // Find the hospital belonging to the auth user, or fallback to the first hospital.
  // If none exist yet (e.g. geolocation/Places API still loading), provide a local fallback.
  const fallbackHospital: Hospital = {
    id: `local-hosp-${Date.now()}`,
    name: authUser?.name || 'Central Command Hospital',
    location: { lat: 0, lng: 0, address: 'Command Center' },
    bedsTotal: 200,
    bedsOccupied: 150,
    icuBedsTotal: 20,
    icuBedsOccupied: 15,
    oxygenAvailable: true,
    doctorsAvailable: 12,
    bloodAvailability: 'Medium',
    ambulancesAvailable: 3,
    status: 'busy',
  };

  const myHospital = hospitals.find(h => h.name.includes(authUser?.name || '')) || hospitals[0] || fallbackHospital;

  const [capacity, setCapacity] = useState({
    bedsTotal: myHospital?.bedsTotal || 120,
    bedsOccupied: myHospital?.bedsOccupied || 95,
    icuBedsTotal: myHospital?.icuBedsTotal || 20,
    icuBedsOccupied: myHospital?.icuBedsOccupied || 15,
    oxygenAvailable: myHospital?.oxygenAvailable !== undefined ? myHospital.oxygenAvailable : true,
    doctorsAvailable: myHospital?.doctorsAvailable || 12,
    bloodAvailability: myHospital?.bloodAvailability || 'Medium',
    ambulancesAvailable: myHospital?.ambulancesAvailable || 3,
  });

  const handleSignOut = async () => {
    await signOutLocal();
    setAuthUser(null);
  };

  const handleUpdate = () => {
    if (!myHospital) return;
    
    // Status calc
    const occPercent = (capacity.bedsOccupied / capacity.bedsTotal) * 100;
    const nextStatus = occPercent >= 95 ? 'critical' : occPercent >= 75 ? 'busy' : 'normal';

    updateHospital(myHospital.id, {
      ...capacity,
      status: nextStatus
    });
    alert('Capacity metrics broadcasted to public command grid.');
  };

  // This should now never trigger due to fallbackHospital, but keeping for type safety
  if (!myHospital) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Activity className="animate-spin w-8 h-8 mb-4 text-emerald-500" />
        <p>Awaiting hospital grid synchronization...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in relative z-10 font-sans">
      <div className="flex justify-between items-center mb-8 bg-slate-950/80 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-550/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Medical Facility Panel
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-100">{myHospital.name} Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage real-time logistics and triage capacities. Sent to Public Command immediately.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Beds */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-lg">
          <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bed className="w-4 h-4 text-emerald-400" /> Standard Bed Capacity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">Total Ward Beds</label>
              <input 
                type="number" 
                value={capacity.bedsTotal} 
                onChange={(e) => setCapacity({ ...capacity, bedsTotal: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">Beds Occupied</label>
              <input 
                type="number" 
                value={capacity.bedsOccupied} 
                onChange={(e) => setCapacity({ ...capacity, bedsOccupied: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs font-mono">
            <span className="text-slate-500">Available: <strong className="text-emerald-400">{Math.max(0, capacity.bedsTotal - capacity.bedsOccupied)}</strong></span>
            <span className="text-slate-500">Load: {((capacity.bedsOccupied / (capacity.bedsTotal || 1)) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* ICU Beds */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-lg">
          <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" /> Critical / ICU Ward
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">Total ICU</label>
              <input 
                type="number" 
                value={capacity.icuBedsTotal} 
                onChange={(e) => setCapacity({ ...capacity, icuBedsTotal: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">ICU Occupied</label>
              <input 
                type="number" 
                value={capacity.icuBedsOccupied} 
                onChange={(e) => setCapacity({ ...capacity, icuBedsOccupied: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
          <label className="text-[10px] font-mono text-slate-500 block mb-2 uppercase flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" />Doctors Available</label>
          <input 
            type="number" 
            value={capacity.doctorsAvailable}
            onChange={(e) => setCapacity({ ...capacity, doctorsAvailable: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm font-bold text-slate-100 outline-none" 
          />
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
          <label className="text-[10px] font-mono text-slate-500 block mb-2 uppercase flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Ambulances Available</label>
          <input 
            type="number" 
            value={capacity.ambulancesAvailable}
            onChange={(e) => setCapacity({ ...capacity, ambulancesAvailable: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm font-bold text-slate-100 outline-none" 
          />
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
          <label className="text-[10px] font-mono text-slate-500 block mb-2 uppercase flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-red-500" />Blood Logistics</label>
          <select 
            value={capacity.bloodAvailability}
            onChange={(e) => setCapacity({ ...capacity, bloodAvailability: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm font-bold text-slate-100 outline-none" 
          >
            <option value="High">High Reserve</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low / Critical</option>
          </select>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
          <label className="text-[10px] font-mono text-slate-500 block mb-2 uppercase flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-500" />Oxygen Logistics</label>
          <button 
            onClick={() => setCapacity({ ...capacity, oxygenAvailable: !capacity.oxygenAvailable })}
            className={`w-full text-left bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm font-bold transition-colors ${capacity.oxygenAvailable ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {capacity.oxygenAvailable ? 'Stable Supply' : 'CRITICAL SHORTAGE'}
          </button>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-900 pt-6">
        <Button onClick={handleUpdate} variant="tactical" size="lg" leftIcon={<Save className="w-4 h-4" />}>
          Update Command Capacity Database
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="font-sans font-bold text-slate-100 mb-4 border-b border-slate-900 pb-2">Active Emergency Requests Queue (Mocked live feed)</h3>
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-500 font-mono text-sm">No incoming inbound EMS transports right now.</p>
        </div>
      </div>
    </div>
  );
}
