import React from 'react';
import { Hospital } from '../types';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Activity, 
  MapPin, 
  Phone, 
  Plus, 
  Stethoscope, 
  ChevronRight,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Button } from './ui/Button';

interface HospitalCardProps {
  hospital: Hospital;
  onAllocateBed?: (id: string) => void;
}

export default function HospitalCard({ hospital, onAllocateBed }: HospitalCardProps) {
  const updateHospital = useCommandStore((state) => state.updateHospital);

  const occupiedPercent = parseFloat(((hospital.bedsOccupied / hospital.bedsTotal) * 100).toFixed(1));
  const availableBeds = hospital.bedsTotal - hospital.bedsOccupied;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'busy':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 95) return 'bg-rose-600';
    if (percent >= 85) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleQuickAdd = () => {
    if (hospital.bedsOccupied < hospital.bedsTotal) {
      updateHospital(hospital.id, { bedsOccupied: hospital.bedsOccupied + 1 });
      onAllocateBed?.(hospital.id);
    }
  };

  return (
    <div className="relative rounded-lg bg-slate-950 border border-slate-900 p-5 flex flex-col justify-between overflow-hidden group select-none shadow-md shadow-slate-950/40">
      {/* Visual left bar indicators representing load state */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
        hospital.status === 'critical' ? 'bg-red-500 animate-pulse' :
        hospital.status === 'busy' ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 tactical-grid opacity-[0.1]" />

      <div>
        {/* Header Title & Status */}
        <div className="flex justify-between items-start gap-3 mb-3 z-10 relative">
          <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-red-400 transition-colors">
            {hospital.name}
          </h4>
          <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getStatusStyle(hospital.status)}`}>
            {hospital.status}
          </span>
        </div>

        {/* Contact info & address */}
        <div className="flex flex-col gap-1.5 text-xs text-slate-400 font-sans mb-4 z-10 relative">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{hospital.location.address || 'Location Verified'}</span>
          </div>
          {hospital.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-mono text-[10px]">{hospital.phone}</span>
            </div>
          )}
          {hospital.distance !== undefined && (
            <div className="flex items-center gap-2 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <span className="font-mono text-[11px] text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                GPS Live Distance: {hospital.distance.toFixed(2)} km {hospital.travelTime ? `(${hospital.travelTime})` : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold">{hospital.openStatus || 'Open - Emergency Active'}</span>
          </div>
        </div>

        {/* Trauma bed load visual progress meters */}
        <div className="mb-4 bg-slate-900/60 border border-slate-900 p-3.5 rounded z-10 relative">
          <div className="flex justify-between items-end text-xs font-mono mb-2">
            <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Trauma Capacity</span>
            <span className="text-slate-200">
              <strong className="text-slate-100">{hospital.bedsOccupied}</strong> / {hospital.bedsTotal} Beds Filled
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
            <span className={availableBeds <= 15 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>
              {availableBeds} Available
            </span>
          </div>
        </div>

        {/* Medical specialties list tags */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="mb-4 z-10 relative">
            <div className="flex items-center gap-1 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">Trauma & specialties</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {hospital.specialties.map((spec) => (
                <span 
                  key={spec} 
                  className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Command Allocation Action button */}
      <div className="mt-auto pt-3 border-t border-slate-900 flex justify-end z-10 relative">
        <Button
          variant="tactical"
          size="sm"
          className="w-full"
          disabled={hospital.bedsOccupied >= hospital.bedsTotal}
          leftIcon={<Plus className="w-3 h-3" />}
          onClick={handleQuickAdd}
        >
          {hospital.bedsOccupied >= hospital.bedsTotal ? 'CRITICAL - AT CAPACITY' : 'Dispatch Bed Allocation'}
        </Button>
      </div>
    </div>
  );
}
