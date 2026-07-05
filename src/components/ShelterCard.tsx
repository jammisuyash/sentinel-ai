import React from 'react';
import { Shelter } from '../types';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Hotel, 
  MapPin, 
  Phone, 
  Plus, 
  Check, 
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Coffee,
  Droplet,
  Activity,
  Bath,
  Zap
} from 'lucide-react';
import { Button } from './ui/Button';


interface ShelterCardProps {
  shelter: Shelter;
  onDispatchTransport?: (id: string) => void;
}

export default function ShelterCard({ shelter, onDispatchTransport }: ShelterCardProps) {
  const updateShelter = useCommandStore((state) => state.updateShelter);

  const occupiedPercent = parseFloat(((shelter.occupied / shelter.capacity) * 100).toFixed(1));
  const availableCots = shelter.capacity - shelter.occupied;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'closed':
        return 'bg-slate-900 border-slate-800 text-slate-500';
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-rose-600';
    if (percent >= 85) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const handleQuickAdd = () => {
    if (shelter.occupied < shelter.capacity && shelter.status !== 'closed') {
      const nextOccupied = shelter.occupied + 5;
      const finalOccupied = Math.min(shelter.capacity, nextOccupied);
      updateShelter(shelter.id, { 
        occupied: finalOccupied,
        status: finalOccupied >= shelter.capacity ? 'full' : shelter.status
      });
      onDispatchTransport?.(shelter.id);
    }
  };

  return (
    <div className="relative rounded-lg bg-slate-950 border border-slate-900 p-5 flex flex-col justify-between overflow-hidden group select-none shadow-md shadow-slate-950/40">
      {/* Visual left bar indicators representing load state */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
        shelter.status === 'full' ? 'bg-red-500 animate-pulse' :
        shelter.status === 'closed' ? 'bg-slate-700' : 'bg-blue-500'
      }`} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 tactical-grid opacity-[0.1]" />

      <div>
        {/* Header Title & Status */}
        <div className="flex justify-between items-start gap-3 mb-3 z-10 relative">
          <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-red-400 transition-colors">
            {shelter.name}
          </h4>
          <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getStatusStyle(shelter.status)}`}>
            {shelter.status}
          </span>
        </div>

        {/* Contact info & address */}
        <div className="flex flex-col gap-1.5 text-xs text-slate-400 font-sans mb-4 z-10 relative">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{shelter.location.address || 'Address Confirmed'}</span>
          </div>
          {shelter.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-mono text-[10px]">{shelter.phone}</span>
            </div>
          )}
          {shelter.distance !== undefined && (
            <div className="flex items-center gap-2 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <span className="font-mono text-[11px] text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                GPS Live Distance: {shelter.distance.toFixed(2)} km {shelter.travelTime ? `(${shelter.travelTime})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Occupancy bar graph meters */}
        <div className="mb-4 bg-slate-900/60 border border-slate-900 p-3.5 rounded z-10 relative">
          <div className="flex justify-between items-end text-xs font-mono mb-2">
            <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Lodging Load</span>
            <span className="text-slate-200">
              <strong className="text-slate-100">{shelter.occupied}</strong> / {shelter.capacity} Cots
            </span>
          </div>

          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor(occupiedPercent)}`}
              style={{ width: `${occupiedPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span>{occupiedPercent}% Occupied</span>
            <span className={availableCots === 0 ? 'text-red-400 font-bold' : 'text-blue-400'}>
              {availableCots === 0 ? 'FULL' : `${availableCots} Vacant`}
            </span>
          </div>
        </div>

        {/* Required Shelter Resource Checklists */}
        <div className="mb-4 bg-slate-950/80 border border-slate-900 p-3 rounded z-10 relative space-y-2 text-[11px] font-sans">
          <div className="text-[9px] font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 border-b border-slate-900 pb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Core Amenities & Status
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-slate-500">Food:</span>
              <span className={`font-mono text-[10px] font-bold ${shelter.foodAvailable ?? true ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shelter.foodAvailable ?? true ? 'AVAILABLE' : 'NONE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-slate-500">Water:</span>
              <span className={`font-mono text-[10px] font-bold ${shelter.drinkingWater ?? true ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shelter.drinkingWater ?? true ? 'AVAILABLE' : 'NONE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-slate-500">Medical Help:</span>
              <span className={`font-mono text-[10px] font-bold ${shelter.medicalAssistance ?? true ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shelter.medicalAssistance ?? true ? 'ACTIVE' : 'NONE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-slate-500">Washrooms:</span>
              <span className={`font-mono text-[10px] font-bold ${shelter.washrooms ?? true ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shelter.washrooms ?? true ? 'AVAILABLE' : 'NONE'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-900 pt-1.5 mt-1">
            <span className="text-slate-500">Power Generator:</span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
              shelter.generatorStatus === 'Operational' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30' :
              shelter.generatorStatus === 'Standby' ? 'text-amber-400 bg-amber-950/20 border border-amber-900/30' : 'text-slate-500 bg-slate-900'
            }`}>
              {shelter.generatorStatus || 'None'}
            </span>
          </div>
        </div>

        {/* Amenities Icons */}
        {shelter.amenities && shelter.amenities.length > 0 && (
          <div className="mb-4 z-10 relative">
            <div className="flex flex-wrap gap-1">
              {shelter.amenities.map((amenity) => (
                <span 
                  key={amenity} 
                  className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-500"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evacuation dispatch actions */}
      <div className="mt-auto pt-3 border-t border-slate-900 flex justify-end z-10 relative">
        <Button
          variant="tactical"
          size="sm"
          className="w-full text-xs font-semibold"
          disabled={shelter.status === 'full' || shelter.status === 'closed'}
          onClick={handleQuickAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          {shelter.status === 'full' ? 'CRITICAL - SHELTER FULL' :
           shelter.status === 'closed' ? 'FACILITY OFFLINE' : 'Dispatch Evac Transport (+5 Guests)'}
        </Button>
      </div>
    </div>
  );
}
