import React from 'react';
import MapContainer from '../components/MapContainer';

export default function LiveMap() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in" id="live-map-view">
      <div className="mb-6">
        <h1 className="text-2xl font-sans font-semibold text-slate-100">Live Incident & Facility Map</h1>
        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
          Tactical spatial visualization of all live incidents, hospitals, shelters, and dynamic evacuation path routing
        </p>
      </div>
      <MapContainer />
    </div>
  );
}
