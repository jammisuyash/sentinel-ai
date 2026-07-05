import React, { useState, useEffect, useRef } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import {
  Play,
  Square,
  RefreshCw,
  Database,
  Sliders,
  Activity,
  AlertOctagon,
  Terminal,
  TrendingUp,
  Sparkles,
  Zap,
  Flame,
  Waves,
  HeartPulse,
  Hotel
} from 'lucide-react';
import { Button } from './ui/Button';
import { Incident, IncidentType, SeverityLevel } from '../types';

export default function SimulationEngine() {
  const {
    incidents,
    hospitals,
    shelters,
    createIncident,
    updateHospital,
    updateShelter,
    setHospitals,
    setShelters
  } = useCommandStore();

  const [simActive, setSimActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Scenarios database for randomized trigger drills
  const drillScenarios = [
    {
      title: "Chemical Pipeline Rupture & Fire",
      type: "fire" as const,
      severity: "high" as const,
      description: "Industrial heat sensor indicating pressure spike and flash ignition near local industrial zone. Toxic plume smoke visual reported.",
      location: { lat: 0, lng: 0, address: "Local Industrial Zone (Generated Drill)" }
    },
    {
      title: "Seawall Breech & Tide Flooding",
      type: "flood" as const,
      severity: "medium" as const,
      description: "Critical high tides overtopping seawall near waterfront sector. Secondary street storm-sewers flowing in reverse.",
      location: { lat: 0, lng: 0, address: "Waterfront Corridor (Generated Drill)" }
    },
    {
      title: "Transit Corridor Seismic Fracture",
      type: "earthquake" as const,
      severity: "critical" as const,
      description: "Severe seismic shift detected in local transit tube structural containment path. Fire and safety alarms active.",
      location: { lat: 0, lng: 0, address: "Transit Hub (Generated Drill)" }
    },
    {
      title: "Acute Multi-Sector Heat Exhaustion",
      type: "medical" as const,
      severity: "low" as const,
      description: "Spike in distress dispatch calls regarding heat stress and respiratory fatigue along major civic corridor.",
      location: { lat: 0, lng: 0, address: "Civic Corridor (Generated Drill)" }
    }
  ];

  // Helper to trigger random drill incident
  const handleTriggerDrill = async (index?: number) => {
    const selected = typeof index === 'number' ? drillScenarios[index] : drillScenarios[Math.floor(Math.random() * drillScenarios.length)];
    addLog(`STAGING DRILL: Formulating scenario "${selected.title}"...`);

    const userLocation = useCommandStore.getState().userLocation || { lat: 0, lng: 0 };
    const generateOffset = () => (Math.random() - 0.5) * 0.05;
    const localizedLocation = {
      lat: userLocation.lat + generateOffset(),
      lng: userLocation.lng + generateOffset(),
      address: selected.location.address
    };

    try {
      await createIncident({
        ...selected,
        location: localizedLocation,
        reportedBy: "Simulator Engine Daemon v1.0",
        status: "reported",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addLog(`✓ DRILL COMMITTED: Incident recorded in active tactical board.`);
    } catch (err: any) {
      addLog(`❌ DRILL FAILURE: ${err.message || 'Network Timeout'}`);
    }
  };

  // Active Drift Simulation Logic
  useEffect(() => {
    if (simActive) {
      addLog("▶ DRILL ENGINE DEPLOYED: Telemetry drift simulation activated (5s cycles).");

      intervalRef.current = setInterval(() => {
        // 1. Drift Hospital Bed Occupancies
        if (hospitals.length > 0) {
          const targetHosp = hospitals[Math.floor(Math.random() * hospitals.length)];
          const delta = Math.random() > 0.4 ? Math.floor(Math.random() * 8) + 2 : -(Math.floor(Math.random() * 5) + 1);
          const nextOccupied = Math.max(0, Math.min(targetHosp.bedsTotal, targetHosp.bedsOccupied + delta));
          const percent = (nextOccupied / targetHosp.bedsTotal) * 100;

          let nextStatus: 'normal' | 'busy' | 'critical' = 'normal';
          if (percent >= 95) nextStatus = 'critical';
          else if (percent >= 75) nextStatus = 'busy';

          updateHospital(targetHosp.id, {
            bedsOccupied: nextOccupied,
            status: nextStatus
          });

          addLog(`🏥 HOSP TELEMETRY: ${targetHosp.name.split(' (')[0]} beds updated. (${nextOccupied}/${targetHosp.bedsTotal})`);
        }

        // 2. Drift Shelter Cot Occupancies
        if (shelters.length > 0) {
          const targetShelter = shelters[Math.floor(Math.random() * shelters.length)];
          if (targetShelter.status !== 'closed') {
            const delta = Math.random() > 0.45 ? Math.floor(Math.random() * 15) + 5 : -(Math.floor(Math.random() * 10) + 2);
            const nextOccupied = Math.max(0, Math.min(targetShelter.capacity, targetShelter.occupied + delta));
            const percent = (nextOccupied / targetShelter.capacity) * 100;

            updateShelter(targetShelter.id, {
              occupied: nextOccupied,
              status: percent >= 100 ? 'full' : 'open'
            });
            addLog(`🏠 SHELTER TELEMETRY: ${targetShelter.name} guests shifted. (${nextOccupied}/${targetShelter.capacity})`);
          }
        }
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        addLog("⏸ DRILL ENGINE OFFLINE: Telemetry drift paused.");
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simActive, hospitals, shelters, updateHospital, updateShelter]);

  const handleResetTelemetry = () => {
    addLog("⚙ RESET COMMAND: Purging simulated load drift coordinates...");

    // Reset hospitals to standard occupied counts
    const resetHops = hospitals.map(h => {
      let baseOccupied = 120;
      if (h.id === 'hosp-1') baseOccupied = 380;
      else if (h.id === 'hosp-2') baseOccupied = 350;
      else if (h.id === 'hosp-3') baseOccupied = 210;
      return { ...h, bedsOccupied: baseOccupied, status: 'normal' as const };
    });
    setHospitals(resetHops);

    // Reset shelters to base occupied
    const resetShts = shelters.map(s => {
      let baseOccupied = 150;
      if (s.id === 'sh-1') baseOccupied = 300;
      else if (s.id === 'sh-2') baseOccupied = 50;
      else if (s.id === 'sh-3') baseOccupied = 400;
      return { ...s, occupied: baseOccupied, status: baseOccupied >= s.capacity ? 'full' as const : 'open' as const };
    });
    setShelters(resetShts);

    addLog("✓ TELEMETRY CLEANSED: Wards reset to standard emergency readiness ratios.");
  };

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 flex flex-col gap-4 select-none" id="simulation-drill-console">
      <div className="border-b border-slate-900 pb-2.5 flex justify-between items-center">
        <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-red-500 animate-pulse" />
          Tactical Drill Simulation Console
        </h3>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-bold">
          DRILL_CNTL_v1
        </span>
      </div>

      {/* Simulator Control Toggles */}
      <div className="flex gap-2">
        <Button
          variant={simActive ? 'outline' : 'tactical'}
          size="sm"
          className="flex-1 font-mono text-[10px] uppercase font-bold"
          leftIcon={simActive ? <Square className="w-3.5 h-3.5 text-rose-500" /> : <Play className="w-3.5 h-3.5" />}
          onClick={() => setSimActive(!simActive)}
        >
          {simActive ? 'Pause Drift Sim' : 'Start Drift Sim'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          title="Reset Hospital/Shelter Capacities"
          onClick={handleResetTelemetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Reset Telemetry
        </Button>
      </div>

      {/* Grid of customized quick drill triggers */}
      <div className="space-y-1.5">
        <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Trigger Scenario Drills:</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleTriggerDrill(2)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 py-1.5 px-2.5 rounded text-left transition-all hover:border-red-500/40"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span>Seismic Drill</span>
          </button>

          <button
            onClick={() => handleTriggerDrill(0)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 py-1.5 px-2.5 rounded text-left transition-all hover:border-red-500/40"
          >
            <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Chemical Fire</span>
          </button>

          <button
            onClick={() => handleTriggerDrill(1)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 py-1.5 px-2.5 rounded text-left transition-all hover:border-red-500/40"
          >
            <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Tide Flood</span>
          </button>

          <button
            onClick={() => {
              addLog("🏥 TRIGGER: Initiating Mass Casualty Striage drill (+35 patients)");
              hospitals.forEach(h => {
                const add = Math.floor(Math.random() * 15) + 5;
                const next = Math.min(h.bedsTotal, h.bedsOccupied + add);
                updateHospital(h.id, {
                  bedsOccupied: next,
                  status: (next / h.bedsTotal * 100) >= 95 ? 'critical' : 'busy'
                });
              });
              addLog("✓ COMPLETED: Influx mapped to Zuckerberg SF General and UCSF.");
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 py-1.5 px-2.5 rounded text-left transition-all hover:border-red-500/40"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Casualty Influx</span>
          </button>
        </div>
      </div>

      {/* Compact Interactive Logger Console */}
      <div className="flex flex-col flex-1 min-h-[140px] max-h-[140px] bg-slate-950 border border-slate-900 rounded p-2 text-[9px] font-mono">
        <div className="text-slate-500 uppercase tracking-wider mb-1 text-[8px] flex justify-between">
          <span>Drill Telemetry Stream</span>
          <span className="flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${simActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-700'}`} />
            {simActive ? 'STREAMING' : 'READY'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-slate-300 select-none">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No drill telemetry recorded. Click "Start Drift Sim" or launch a scenario above.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="truncate">
                <span className="text-red-500 mr-1">&gt;</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
