import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import HospitalCard from '../components/HospitalCard';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  ChevronRight, 
  Stethoscope, 
  HeartPulse, 
  AlertTriangle,
  Activity,
  Bed,
  Map,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Hospital } from '../types';

export default function Hospitals() {
  const { hospitals, setHospitals, updateHospital, setActiveView, userLocation } = useCommandStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Auxiliary Field Hospital creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalAddress, setNewHospitalAddress] = useState('');
  const [newHospitalBeds, setNewHospitalBeds] = useState(150);
  const [newHospitalSpecialties, setNewHospitalSpecialties] = useState('First Aid, Triage');
  const [newHospitalPhone, setNewHospitalPhone] = useState('(415) 555-0911');

  // Calculations
  const totalBeds = hospitals.reduce((acc, h) => acc + h.bedsTotal, 0);
  const occupiedBeds = hospitals.reduce((acc, h) => acc + h.bedsOccupied, 0);
  const overallOccupancyPercent = totalBeds > 0 ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;
  const criticalCount = hospitals.filter(h => h.status === 'critical').length;
  const busyCount = hospitals.filter(h => h.status === 'busy').length;

  const handleCreateAuxiliaryHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospitalName.trim()) return;

    const baseLat = userLocation?.lat ?? 0;
    const baseLng = userLocation?.lng ?? 0;

    const newHosp: Hospital = {
      id: `hosp-${Date.now()}`,
      name: newHospitalName,
      location: {
        lat: baseLat + (Math.random() - 0.5) * 0.04,
        lng: baseLng + (Math.random() - 0.5) * 0.04,
        address: newHospitalAddress || 'Temporary Field Location'
      },
      bedsTotal: newHospitalBeds,
      bedsOccupied: 0,
      status: 'normal',
      phone: newHospitalPhone,
      specialties: newHospitalSpecialties.split(',').map(s => s.trim()).filter(Boolean)
    };

    setHospitals([...hospitals, newHosp]);
    setShowAddForm(false);
    setNewHospitalName('');
    setNewHospitalAddress('');
    setNewHospitalBeds(150);
    setNewHospitalSpecialties('First Aid, Triage');
  };

  const handleAdjustBeds = (id: string, amount: number) => {
    const hosp = hospitals.find(h => h.id === id);
    if (!hosp) return;
    
    const nextOccupied = Math.max(0, Math.min(hosp.bedsTotal, hosp.bedsOccupied + amount));
    const nextOccupiedPercent = (nextOccupied / hosp.bedsTotal) * 100;
    
    let nextStatus: 'normal' | 'busy' | 'critical' = 'normal';
    if (nextOccupiedPercent >= 95) nextStatus = 'critical';
    else if (nextOccupiedPercent >= 75) nextStatus = 'busy';

    updateHospital(id, {
      bedsOccupied: nextOccupied,
      status: nextStatus
    });
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (h.specialties && h.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in" id="hospitals-view-container">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-red-500 animate-pulse" />
            Trauma & Medical Facility Allocation
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Real-time critical bed telemetry, level 1 trauma staging, and casualty triage routing
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveView('live-map')}
            leftIcon={<Map className="w-3.5 h-3.5" />}
          >
            Locate Facilities
          </Button>
          <Button 
            variant="tactical" 
            size="sm"
            onClick={() => setShowAddForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Deploy Auxiliary Hospital
          </Button>
        </div>
      </div>

      {/* Triage Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Total Operational Beds</span>
            <Bed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-100">{totalBeds}</span>
            <span className="text-xs text-slate-500">active beds</span>
          </div>
          <p className="text-[10px] font-mono text-slate-550 mt-1">Sum of all level-1 and level-2 wards</p>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Beds Currently Filled</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-100">{occupiedBeds}</span>
            <span className="text-xs text-emerald-400 font-mono">{(occupiedBeds / (totalBeds || 1) * 100).toFixed(0)}% load</span>
          </div>
          <p className="text-[10px] font-mono text-slate-550 mt-1">Active trauma, cardiac, burn patients</p>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Overall Capacity Index</span>
            <HeartPulse className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">{overallOccupancyPercent}% Fill</span>
              <span className="text-slate-500">{totalBeds - occupiedBeds} Available</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  overallOccupancyPercent >= 90 ? 'bg-red-500 animate-pulse' :
                  overallOccupancyPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${overallOccupancyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm border-l-red-950">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Critical Status Warnings</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-red-400">{criticalCount}</span>
            <span className="text-xs text-slate-500">at 100% capacity</span>
          </div>
          <p className="text-[10px] font-mono text-rose-400/90 mt-1 animate-pulse">
            {criticalCount > 0 ? "⚠️ DIVERSION PROTOCOLS MANDATED" : "✓ Emergency ward reserves stable"}
          </p>
        </div>
      </div>

      {/* Auxiliary Deployment Modal Form overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-900 rounded-lg max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-900">
              <Building2 className="w-5 h-5 text-red-500" />
              <h3 className="font-sans font-bold text-slate-100">Deploy Field Auxiliary Hospital</h3>
            </div>

            <form onSubmit={handleCreateAuxiliaryHospital} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Facility Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Marina Green Field Station"
                  value={newHospitalName}
                  onChange={(e) => setNewHospitalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Staging Location Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Near your current location"
                  value={newHospitalAddress}
                  onChange={(e) => setNewHospitalAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Total Bed Capacity</label>
                  <input 
                    type="number" 
                    min="10"
                    max="1000"
                    value={newHospitalBeds}
                    onChange={(e) => setNewHospitalBeds(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Staging Phone</label>
                  <input 
                    type="text" 
                    value={newHospitalPhone}
                    onChange={(e) => setNewHospitalPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Specialties (Comma Separated)</label>
                <input 
                  type="text" 
                  value={newHospitalSpecialties}
                  onChange={(e) => setNewHospitalSpecialties(e.target.value)}
                  placeholder="First Aid, Decontamination, Triage"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="tactical" 
                  size="sm"
                >
                  Initiate Ward Deployment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Filters & Hospital Wards Grid */}
      <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search facilities by name or medical specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-md pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-slate-750 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter Wards:
            </span>
            <div className="flex bg-slate-900 border border-slate-850 p-0.5 rounded-md text-[10px] font-mono">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'all' ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                All ({hospitals.length})
              </button>
              <button 
                onClick={() => setStatusFilter('normal')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Normal ({hospitals.filter(h => h.status === 'normal').length})
              </button>
              <button 
                onClick={() => setStatusFilter('busy')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'busy' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Busy ({busyCount})
              </button>
              <button 
                onClick={() => setStatusFilter('critical')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Critical ({criticalCount})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Grid list */}
        {filteredHospitals.length === 0 ? (
          <div className="py-16 text-center text-slate-550 flex flex-col items-center">
            <Building2 className="w-10 h-10 text-slate-700 mb-3" />
            <h4 className="font-sans font-medium text-slate-400">No Medical Facilities Match Filter</h4>
            <p className="font-mono text-[10px] mt-1 text-slate-600">Modify your active query parameters above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hosp) => (
              <div key={hosp.id} className="flex flex-col">
                <HospitalCard hospital={hosp} />
                
                {/* Manual Bed Allocation adjustments panel inside page layout for ultimate usability */}
                <div className="bg-slate-950 border-x border-b border-slate-900 rounded-b-lg p-3 bg-slate-900/10 flex justify-between items-center text-[10px] font-mono text-slate-400 gap-2 shrink-0">
                  <span className="uppercase text-[9px] text-slate-500 font-bold">Manual bed drill:</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleAdjustBeds(hosp.id, -1)}
                      disabled={hosp.bedsOccupied === 0}
                      className="px-2 py-0.5 border border-slate-800 hover:border-slate-600 bg-slate-900 text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                      title="Release 1 bed"
                    >
                      Release Bed (-1)
                    </button>
                    <button 
                      onClick={() => handleAdjustBeds(hosp.id, 5)}
                      disabled={hosp.bedsOccupied >= hosp.bedsTotal}
                      className="px-2 py-0.5 border border-slate-800 hover:border-slate-600 bg-slate-900 text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                      title="Allocate 5 beds"
                    >
                      Mass Casualty (+5)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
