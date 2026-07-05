import React from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  ShieldAlert, 
  Activity, 
  Map, 
  Building2, 
  Hotel, 
  FileText, 
  Sliders, 
  PlusCircle, 
  Wind, 
  Compass, 
  Workflow, 
  Terminal,
  Play,
  HeartPulse,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Incident } from '../types';

export default function Landing() {
  const { 
    incidents, 
    hospitals, 
    shelters, 
    createIncident, 
    setActiveView 
  } = useCommandStore();

  // Stats
  const activeCount = incidents.filter(i => i.status !== 'resolved').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  
  // Real-time quick simulation handler
  const handleTriggerQuickSim = async () => {
    const userLoc = useCommandStore.getState().userLocation || { lat: 0, lng: 0 };
    
    // Generate slight offsets for drill events
    const generateOffset = () => (Math.random() - 0.5) * 0.05;

    const drillScenarios = [
      {
        title: "Substation Thermal Rupture",
        type: "fire" as const,
        severity: "high" as const,
        description: "Electrical transformer explosion reported at nearby substation. Shrapnel ruptured insulation fluid tank. High structural risk.",
        location: { lat: userLoc.lat + generateOffset(), lng: userLoc.lng + generateOffset(), address: "Local Substation (Generated Drill)" }
      },
      {
        title: "Localized Flash Flood Warning",
        type: "flood" as const,
        severity: "medium" as const,
        description: "Severe weather anomaly causing rapid water accumulation in low-lying sectors. Minor street inundation.",
        location: { lat: userLoc.lat + generateOffset(), lng: userLoc.lng + generateOffset(), address: "Low-Lying Transit Corridor" }
      },
      {
        title: "Utility Collapse / Sinkhole",
        type: "earthquake" as const,
        severity: "critical" as const,
        description: "Sensor alert indicating localized ground instability. Structural integrity of nearby underground utilities compromised.",
        location: { lat: userLoc.lat + generateOffset(), lng: userLoc.lng + generateOffset(), address: "Urban Center Utility Zone" }
      }
    ];

    const randomScenario = drillScenarios[Math.floor(Math.random() * drillScenarios.length)];
    
    try {
      await createIncident({
        ...randomScenario,
        reportedBy: "Sentinel Automated Drill Daemon",
        status: "reported",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      alert(`Simulation Launched: "${randomScenario.title}" has been registered inside Supabase! Navigating to Operations Dashboard...`);
      setActiveView('dashboard');
    } catch (err) {
      console.error("Drill simulation failed to launch:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in" id="landing-tactical-portal">
      
      {/* Immersive Welcome Brand Header */}
      <div className="relative rounded-xl border border-slate-900 bg-slate-950/40 p-8 overflow-hidden mb-10 shadow-lg shadow-slate-950/50">
        <div className="absolute inset-0 tactical-grid opacity-[0.1]" />
        
        {/* Blurry red accent background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-550/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-4 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Active Tactical Command Protocol Engage
          </div>
          <h1 className="text-4xl font-sans font-bold text-slate-100 tracking-tight leading-tight">
            Sentinel AI Operations Command
          </h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed font-sans">
            A high-fidelity municipal emergency response center. Orchestrating live casualty triage routing, shelter allocations, and real-time incident reports synchronized to Supabase with integrated Gemini AI tactical response generation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button 
              variant="tactical" 
              size="sm"
              onClick={() => setActiveView('dashboard')}
              leftIcon={<Activity className="w-4 h-4 animate-pulse" />}
            >
              Enter Operations Command Board
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTriggerQuickSim}
              leftIcon={<Play className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
            >
              Simulate Drill Emergency
            </Button>
          </div>
        </div>
      </div>

      {/* Meteorological Warning Advisory Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-10 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-amber-500 animate-bounce" />
          <div>
            <span className="text-amber-500 font-bold uppercase block">ACTIVE ADVISORY: Shifting Wind Shear</span>
            <span className="text-slate-400 mt-0.5 block font-sans">High winds (45mph gusts) expected. Elevated risk of structure fire jumping blocks.</span>
          </div>
        </div>
        <span className="text-[10px] text-amber-400/80 uppercase font-semibold border border-amber-500/30 px-2 py-0.5 rounded shrink-0">
          STAGING PRIORITY: RESHAPE SAFETY MARGINS
        </span>
      </div>

      {/* Main Operations Matrix Navigation */}
      <div className="mb-10">
        <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-900 pb-2">
          Operations Core Navigation Matrix
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Tile 1: Map */}
          <div 
            onClick={() => setActiveView('live-map')}
            className="group rounded-lg bg-slate-950 border border-slate-900 p-5 hover:border-slate-800 transition-all cursor-pointer relative overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <Map className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors mb-4" />
            <h3 className="font-sans font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Tactical Spatial Map</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">Visualize live incident pins, field shelters, and nearest level-1 trauma facilities.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>OSM TACTICAL ENGINE</span>
              <span>LAUNCH &gt;</span>
            </div>
          </div>

          {/* Tile 2: Hospitals */}
          <div 
            onClick={() => setActiveView('hospitals')}
            className="group rounded-lg bg-slate-950 border border-slate-900 p-5 hover:border-slate-800 transition-all cursor-pointer relative overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <Building2 className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors mb-4" />
            <h3 className="font-sans font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Trauma & Hospitals</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">Allocate beds, balance triage capacity limits, and deploy field stations.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>{hospitals.length} MEDICAL WARDS</span>
              <span>LAUNCH &gt;</span>
            </div>
          </div>

          {/* Tile 3: Shelters */}
          <div 
            onClick={() => setActiveView('shelters')}
            className="group rounded-lg bg-slate-950 border border-slate-900 p-5 hover:border-slate-800 transition-all cursor-pointer relative overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <Hotel className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors mb-4" />
            <h3 className="font-sans font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Shelters & Lodging</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">Coordinate evacuation transports, manage cot occupancy, and review supplies.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>{shelters.length} STAGED GYMS</span>
              <span>LAUNCH &gt;</span>
            </div>
          </div>

          {/* Tile 4: Situation Reports */}
          <div 
            onClick={() => setActiveView('reports')}
            className="group rounded-lg bg-slate-950 border border-slate-900 p-5 hover:border-slate-800 transition-all cursor-pointer relative overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <FileText className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors mb-4" />
            <h3 className="font-sans font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Briefing Feed</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">Review automated climate advisories and draft official commander shift updates.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>OFFICIAL LOGS FEED</span>
              <span>LAUNCH &gt;</span>
            </div>
          </div>

        </div>
      </div>

      {/* Live System Diagnostics / Simulator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Core System Registries */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-500" />
              Operations Telemetry Status
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                <span className="text-slate-500">Active Incident Load</span>
                <span className={`font-bold ${activeCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>{activeCount} emergencies</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                <span className="text-slate-500">Critical Redzones</span>
                <span className={`font-bold ${criticalCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>{criticalCount} critical alerts</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                <span className="text-slate-500">Hospital Ward Load</span>
                <span className="text-slate-200">
                  {hospitals.reduce((acc, h) => acc + h.bedsOccupied, 0)} / {hospitals.reduce((acc, h) => acc + h.bedsTotal, 0)} Beds Filled
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sheltered Evacuees</span>
                <span className="text-slate-200">
                  {shelters.reduce((acc, s) => acc + s.occupied, 0)} / {shelters.reduce((acc, s) => acc + s.capacity, 0)} Cots Used
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase">
            <span>Server status: ACTIVE</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Drill Simulator Panel */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 flex flex-col justify-between border-l-red-950">
          <div>
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-red-500" />
              Dynamic Emergency Drill Engine
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 font-sans leading-relaxed">
              Initiate simulated disaster parameters to test agency triage coordination and command pipeline response metrics. Simulated events integrate automatically into the live spatial map.
            </p>

            <div className="space-y-2">
              <button 
                onClick={handleTriggerQuickSim}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-3.5 py-2 rounded text-xs font-mono text-left transition-all hover:scale-[1.01] flex items-center justify-between"
              >
                <span>🚀 Trigger Random Emergency Drill</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">DRIL_RUN</span>
              </button>
              
              <button 
                onClick={() => {
                  alert("Simulation: Rapid casualty influx triggered. Hospital beds updated dynamically!");
                  hospitals.forEach(h => {
                    const nextLoad = Math.min(h.bedsTotal, h.bedsOccupied + Math.floor(Math.random() * 15) + 5);
                    const percent = (nextLoad / h.bedsTotal) * 100;
                    useCommandStore.getState().updateHospital(h.id, {
                      bedsOccupied: nextLoad,
                      status: percent >= 95 ? 'critical' : percent >= 75 ? 'busy' : 'normal'
                    });
                  });
                }}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3.5 py-2 rounded text-xs font-mono text-left transition-all hover:scale-[1.01] flex items-center justify-between"
              >
                <span>🏥 Trigger Mass Casualty Influx (Hospitals)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">MED_INFLUX</span>
              </button>

              <button 
                onClick={() => {
                  alert("Simulation: Evacuation waves triggered. Shelter cot loads increased!");
                  shelters.forEach(s => {
                    if (s.status === 'closed') return;
                    const nextLoad = Math.min(s.capacity, s.occupied + Math.floor(Math.random() * 50) + 10);
                    useCommandStore.getState().updateShelter(s.id, {
                      occupied: nextLoad,
                      status: nextLoad >= s.capacity ? 'full' : 'open'
                    });
                  });
                }}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3.5 py-2 rounded text-xs font-mono text-left transition-all hover:scale-[1.01] flex items-center justify-between"
              >
                <span>🏠 Trigger Evacuation Wave (Shelters)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">EVAC_WAVE</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-4 uppercase flex justify-between border-t border-slate-900 pt-3">
            <span>Simulation engine: READY</span>
            <span>V_M: DIRECT</span>
          </div>
        </div>
      </div>

    </div>
  );
}
