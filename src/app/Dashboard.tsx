import React, { useEffect, useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import IncidentCard from '../components/IncidentCard';
import StatCard from '../components/StatCard';
import SimulationEngine from '../components/SimulationEngine';
import { 
  AlertOctagon, 
  CheckCircle, 
  Activity, 
  PlusCircle, 
  Loader2, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Incident, IncidentStatus } from '../types';

const SafeIncidentCard = IncidentCard as any;

export default function Dashboard() {
  const { 
    incidents,
    hospitals,
    shelters,
    resources,
    volunteers,
    fetchIncidents,
    updateIncident,
    loading,
    error,
    isOnline,
    setActiveView 
  } = useCommandStore();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Load incidents from API on mount
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Calculations for stats
  const totalCount = incidents.length;
  const activeCount = incidents.filter(i => i.status === 'active' || i.status === 'reported' || i.status === 'dispatching').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const hospitalCount = hospitals.length;
  const shelterCount = shelters.length;
  const resourceCount = resources.length;
  const volunteerCount = volunteers.length;

  const handleDispatch = (incident: Incident) => {
    updateIncident(incident.id, { status: 'dispatching' });
  };

  const handleStatusChange = (id: string, nextStatus: IncidentStatus) => {
    updateIncident(id, { status: nextStatus });
  };

  // Filtered list
  const filteredIncidents = incidents.filter(inc => {
    const typeMatch = filterType === 'all' || inc.type === filterType;
    const severityMatch = filterSeverity === 'all' || inc.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" id="tactical-dashboard-root">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
            Tactical Operations Command Board
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            REAL-TIME COMMAND AND DISPATCH TELEMETRY WITH SUPABASE SYNCHRONIZATION
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchIncidents()}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync Telemetry
          </Button>
          <Button 
            variant="tactical" 
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setActiveView('incident-report')}
          >
            Formulate Emergency
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Incidents"
          value={totalCount}
          icon={SlidersHorizontal}
          iconColorClass="text-slate-400"
          subtext="Logged inside command cluster"
        />
        <StatCard
          title="Active Emergencies"
          value={activeCount}
          icon={Activity}
          iconColorClass="text-red-500"
          subtext="Requiring active coordination"
          trend={activeCount > 0 ? "STAGED ALERT" : "CLEAR"}
          trendType={activeCount > 0 ? "danger" : "neutral"}
          trendDirection="neutral"
        />
        <StatCard
          title="Critical / Hospitals / Shelters"
          value={`${criticalCount} / ${hospitalCount} / ${shelterCount}`}
          icon={AlertOctagon}
          iconColorClass="text-rose-500 animate-pulse"
          subtext="Priority triage and capacity coverage"
          trend="LIVE"
          trendType="danger"
          trendDirection="up"
        />
        <StatCard
          title="Resources / Volunteers"
          value={`${resourceCount} / ${volunteerCount}`}
          icon={CheckCircle}
          iconColorClass="text-emerald-500"
          subtext="Operational readiness and field support"
        />
      </div>

      {/* Main Grid: Filters & Incidents list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left column: Tactical Filters & Sim Drill */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2.5 mb-4">
              Incident Staging Filters
            </h3>

            <div className="flex flex-col gap-5">
              {/* Filter by Category */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Category Filter</label>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-200 outline-none focus:border-red-500/40"
                >
                  <option value="all">All Classifications</option>
                  <option value="fire">Structure Fires</option>
                  <option value="flood">Flooding / Tides</option>
                  <option value="earthquake">Earthquakes / Collapse</option>
                  <option value="medical">Medical Emergencies</option>
                  <option value="other">Hazards / Other</option>
                </select>
              </div>

              {/* Filter by Severity */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Severity Level</label>
                <select 
                  value={filterSeverity} 
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-200 outline-none focus:border-red-500/40"
                >
                  <option value="all">All Threat Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="border-t border-slate-900 pt-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Database Sync:</span>
                  <span className={isOnline ? "text-emerald-500 font-semibold" : "text-amber-500 animate-pulse font-semibold"}>
                    {isOnline ? "Supabase Connected" : "Local Emulation Mode"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Simulation Console */}
          <SimulationEngine />
        </div>

        {/* Right column: Dynamic List */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-xs font-sans">
              <p className="font-bold">Database telemetry error occurred:</p>
              <p className="opacity-90 mt-0.5">{error}</p>
            </div>
          )}

          {loading && filteredIncidents.length === 0 ? (
            <div className="bg-slate-950 border border-slate-900 rounded-lg py-16 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
              <p className="font-mono text-xs uppercase tracking-wider">Acquiring Active Dispatch Streams...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="bg-slate-950 border border-slate-900 rounded-lg py-16 text-center text-slate-500 flex flex-col items-center">
              <AlertOctagon className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="font-sans font-medium text-slate-300 text-sm">No Incidents Match Staged Parameters</h4>
              <p className="font-mono text-[10px] mt-1 text-slate-550">Formulate a new report or adjust active search filters.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => { setFilterType('all'); setFilterSeverity('all'); }}
              >
                Reset Staging Filters
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredIncidents.map((incident) => (
                <SafeIncidentCard
                  key={incident.id}
                  incident={incident}
                  onDispatchClick={handleDispatch}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
