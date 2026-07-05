import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import ShelterCard from '../components/ShelterCard';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  Hotel,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Map,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Shelter } from '../types';

export default function Shelters() {
  const { shelters, setShelters, updateShelter, setActiveView, userLocation } = useCommandStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Auxiliary Shelter creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShelterName, setNewShelterName] = useState('');
  const [newShelterAddress, setNewShelterAddress] = useState('');
  const [newShelterCapacity, setNewShelterCapacity] = useState(200);
  const [newShelterAmenities, setNewShelterAmenities] = useState('Hot Meals, Power Charging, WiFi');
  const [newShelterPhone, setNewShelterPhone] = useState('(415) 555-0800');

  // Calculations
  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const occupiedCots = shelters.reduce((acc, s) => acc + s.occupied, 0);
  const overallOccupancyPercent = totalCapacity > 0 ? parseFloat(((occupiedCots / totalCapacity) * 100).toFixed(1)) : 0;
  const fullCount = shelters.filter(s => s.status === 'full').length;
  const closedCount = shelters.filter(s => s.status === 'closed').length;

  const handleCreateAuxiliaryShelter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelterName.trim()) return;

    const baseLat = userLocation?.lat ?? 0;
    const baseLng = userLocation?.lng ?? 0;

    const newSh: Shelter = {
      id: `sh-${Date.now()}`,
      name: newShelterName,
      location: {
        lat: baseLat + (Math.random() - 0.5) * 0.04,
        lng: baseLng + (Math.random() - 0.5) * 0.04,
        address: newShelterAddress || 'Auxiliary Neighborhood Location'
      },
      capacity: newShelterCapacity,
      occupied: 0,
      status: 'open',
      phone: newShelterPhone,
      amenities: newShelterAmenities.split(',').map(s => s.trim()).filter(Boolean)
    };

    setShelters([...shelters, newSh]);
    setShowAddForm(false);
    setNewShelterName('');
    setNewShelterAddress('');
    setNewShelterCapacity(200);
    setNewShelterAmenities('Hot Meals, Power Charging, WiFi');
  };

  const handleAdjustOccupancy = (id: string, amount: number) => {
    const shelter = shelters.find(s => s.id === id);
    if (!shelter || shelter.status === 'closed') return;
    
    const nextOccupied = Math.max(0, Math.min(shelter.capacity, shelter.occupied + amount));
    
    let nextStatus: 'open' | 'full' | 'closed' = 'open';
    if (nextOccupied >= shelter.capacity) nextStatus = 'full';

    updateShelter(id, {
      occupied: nextOccupied,
      status: nextStatus
    });
  };

  const filteredShelters = shelters.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.amenities && s.amenities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in" id="shelters-view-container">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
            <Hotel className="w-6 h-6 text-blue-500" />
            Civil Emergency Lodging & Shelter Allocation
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Real-time lodging load monitors, cot capacities, and displaced citizens staging directories
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveView('live-map')}
            leftIcon={<Map className="w-3.5 h-3.5" />}
          >
            Locate Shelters
          </Button>
          <Button 
            variant="tactical" 
            size="sm"
            onClick={() => setShowAddForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Deploy Emergency Shelter
          </Button>
        </div>
      </div>

      {/* Lodging Load Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Total Logged Cots</span>
            <Hotel className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-100">{totalCapacity}</span>
            <span className="text-xs text-slate-500">active capacity</span>
          </div>
          <p className="text-[10px] font-mono text-slate-550 mt-1">Sum of all municipal gymnasium grids</p>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Total Evacuated Guests</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-100">{occupiedCots}</span>
            <span className="text-xs text-emerald-400 font-mono">{(occupiedCots / (totalCapacity || 1) * 100).toFixed(0)}% load</span>
          </div>
          <p className="text-[10px] font-mono text-slate-550 mt-1">Sheltered citizens currently checked in</p>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Overall Vacancy Ratio</span>
            <Check className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">{overallOccupancyPercent}% Load</span>
              <span className="text-blue-400">{totalCapacity - occupiedCots} vacant cots</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  overallOccupancyPercent >= 90 ? 'bg-red-500 animate-pulse' :
                  overallOccupancyPercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${overallOccupancyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 flex flex-col justify-between shadow-sm border-l-amber-950">
          <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <span>Full Capacity Redzones</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-amber-500">{fullCount}</span>
            <span className="text-xs text-slate-500">at 100% capacity</span>
          </div>
          <p className="text-[10px] font-mono text-amber-400 mt-1">
            {fullCount > 0 ? "⚠️ COORDINATE REROUTING TO SUNSET OR CIVIC" : "✓ Substantial municipal lodging reserves"}
          </p>
        </div>
      </div>

      {/* Auxiliary Shelter Deployment Modal Form */}
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
              <Hotel className="w-5 h-5 text-blue-500" />
              <h3 className="font-sans font-bold text-slate-100">Deploy Emergency Evacuation Shelter</h3>
            </div>

            <form onSubmit={handleCreateAuxiliaryShelter} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Shelter Facility Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Pier 27 Cruise Terminal"
                  value={newShelterName}
                  onChange={(e) => setNewShelterName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Emergency Street Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Near your current location"
                  value={newShelterAddress}
                  onChange={(e) => setNewShelterAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Max Cots capacity</label>
                  <input 
                    type="number" 
                    min="20"
                    max="2000"
                    value={newShelterCapacity}
                    onChange={(e) => setNewShelterCapacity(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Facility Phone</label>
                  <input 
                    type="text" 
                    value={newShelterPhone}
                    onChange={(e) => setNewShelterPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Supplies & Amenities (Comma Separated)</label>
                <input 
                  type="text" 
                  value={newShelterAmenities}
                  onChange={(e) => setNewShelterAmenities(e.target.value)}
                  placeholder="Hot Meals, WiFi, Bedding, Pet Friendly"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-blue-500"
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
                  Confirm Shelter Activation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Filters & Shelters Cards Grid */}
      <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search shelters by name or key amenities (e.g. WiFi, Meals)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-md pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-slate-750 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Lodging Status:
            </span>
            <div className="flex bg-slate-900 border border-slate-850 p-0.5 rounded-md text-[10px] font-mono">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'all' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                All ({shelters.length})
              </button>
              <button 
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Open ({shelters.filter(s => s.status === 'open').length})
              </button>
              <button 
                onClick={() => setStatusFilter('full')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'full' ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Full ({fullCount})
              </button>
              <button 
                onClick={() => setStatusFilter('closed')}
                className={`px-3 py-1 rounded transition-all uppercase ${statusFilter === 'closed' ? 'bg-slate-750 text-slate-300 border border-slate-700/20 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Closed ({closedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Grid list */}
        {filteredShelters.length === 0 ? (
          <div className="py-16 text-center text-slate-550 flex flex-col items-center">
            <Hotel className="w-10 h-10 text-slate-700 mb-3" />
            <h4 className="font-sans font-medium text-slate-400">No Emergency Shelters Found</h4>
            <p className="font-mono text-[10px] mt-1 text-slate-600">Modify your search keywords or filter settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShelters.map((shelter) => (
              <div key={shelter.id} className="flex flex-col">
                <ShelterCard shelter={shelter} />
                
                {/* Manual Lodging admissions adjustments panel */}
                <div className="bg-slate-950 border-x border-b border-slate-900 rounded-b-lg p-3 bg-slate-900/10 flex justify-between items-center text-[10px] font-mono text-slate-400 gap-2 shrink-0">
                  <span className="uppercase text-[9px] text-slate-500 font-bold">Local Lodging drill:</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                      disabled={shelter.occupied === 0 || shelter.status === 'closed'}
                      className="px-2 py-0.5 border border-slate-800 hover:border-slate-600 bg-slate-900 text-slate-300 rounded disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      title="Discharge 10 evacuees"
                    >
                      <UserMinus className="w-3 h-3" />
                      Vacate (-10)
                    </button>
                    <button 
                      onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                      disabled={shelter.occupied >= shelter.capacity || shelter.status === 'closed'}
                      className="px-2 py-0.5 border border-slate-800 hover:border-slate-600 bg-slate-900 text-slate-300 rounded disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      title="Admit 10 evacuees"
                    >
                      <UserPlus className="w-3 h-3" />
                      Admit (+10)
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
