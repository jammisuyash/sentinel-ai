import React, { useState, useEffect, useRef } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Compass, 
  Hospital as HospitalIcon, 
  Home as HomeIcon, 
  RefreshCw, 
  Crosshair, 
  Target,
  Plus,
  Minus,
  Navigation,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from './ui/Button';
import L from 'leaflet';
import IncidentCard from './IncidentCard';
import HospitalCard from './HospitalCard';
import ShelterCard from './ShelterCard';
import { Hospital, Shelter } from '../types';
import { getCurrentCoordinates } from '../utils/geo';

// Helper to find nearest hospital
function findNearestHospital(lat: number, lng: number, hospitals: Hospital[]) {
  if (hospitals.length === 0) return null;
  let nearest = hospitals[0];
  let minDistance = Infinity;
  for (const hosp of hospitals) {
    const dist = Math.sqrt(Math.pow(hosp.location.lat - lat, 2) + Math.pow(hosp.location.lng - lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = hosp;
    }
  }
  return nearest;
}

// Helper to find nearest shelter
function findNearestShelter(lat: number, lng: number, shelters: Shelter[]) {
  if (shelters.length === 0) return null;
  let nearest = shelters[0];
  let minDistance = Infinity;
  for (const sh of shelters) {
    const dist = Math.sqrt(Math.pow(sh.location.lat - lat, 2) + Math.pow(sh.location.lng - lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = sh;
    }
  }
  return nearest;
}

export default function MapContainer() {
  const { 
    incidents, 
    shelters, 
    hospitals, 
    policeStations, 
    fireStations, 
    bloodBanks, 
    fetchIncidents, 
    userLocation, 
    setUserLocation,
    isLocating: isLocatingGlobal,
    locatingError: locatingErrorGlobal
  } = useCommandStore();
  const [filter, setFilter] = useState<'all' | 'incidents' | 'facilities'>('all');
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [cursorCoords, setCursorCoords] = useState({ 
    lat: userLocation?.lat ?? 0, 
    lng: userLocation?.lng ?? 0 
  });
  const [radarSweeping, setRadarSweeping] = useState(true);

  // Geolocation States
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocatingError(null);
    try {
      const coords = await getCurrentCoordinates();
      setUserLocation(coords);
      if (mapRef.current) {
        mapRef.current.setView([coords.lat, coords.lng], 15);
      }
    } catch (err: any) {
      console.error('Failed to get coordinates:', err);
      setLocatingError(err.message || 'GPS Signal Interrupted');
    } finally {
      setIsLocating(false);
    }
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Sync selected pin with live polling updates
  useEffect(() => {
    if (selectedPin) {
      if (selectedPin.type !== undefined && selectedPin.bedsTotal === undefined && selectedPin.capacity === undefined) {
        const updated = incidents.find(i => i.id === selectedPin.id);
        if (updated) {
          setSelectedPin(updated);
        }
      } else if (selectedPin.bedsTotal !== undefined) {
        const updated = hospitals.find(h => h.id === selectedPin.id);
        if (updated) {
          setSelectedPin(updated);
        }
      } else if (selectedPin.capacity !== undefined) {
        const updated = shelters.find(s => s.id === selectedPin.id);
        if (updated) {
          setSelectedPin(updated);
        }
      }
    }
  }, [incidents, hospitals, shelters, selectedPin]);

  // Set up live updating/polling every 5 seconds
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = userLocation?.lat ?? 0;
    const initialLng = userLocation?.lng ?? 0;
    const initialZoom = userLocation ? 14 : 2;

    // Create map with initial view
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Dark-themed tactical tiles from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Track cursor location coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Manual location selection on map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Check if they clicked an interactive leaflet element or icon
      const target = e.originalEvent.target as HTMLElement;
      if (target && (target.closest('.custom-leaflet-icon') || target.closest('.leaflet-interactive'))) {
        return;
      }
      setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Unified group to store all markers & polyline paths
    const markersLayerGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersLayerGroup;

    mapRef.current = map;

    return () => {
      map.off('mousemove');
      map.remove();
      mapRef.current = null;
      markersLayerGroupRef.current = null;
    };
  }, []);

  // Center map dynamically when user location updates
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], mapRef.current.getZoom() || 14);
    }
  }, [userLocation]);

  // Update Markers & Polylines whenever state or assets change
  useEffect(() => {
    const map = mapRef.current;
    const layers = markersLayerGroupRef.current;
    if (!map || !layers) return;

    // Clear existing markers and lines
    layers.clearLayers();

    const isIncident = selectedPin && selectedPin.type !== undefined && selectedPin.bedsTotal === undefined && selectedPin.capacity === undefined;
    const nearestHospital = isIncident
      ? findNearestHospital(selectedPin.location.lat, selectedPin.location.lng, hospitals)
      : null;
    const nearestShelter = isIncident
      ? findNearestShelter(selectedPin.location.lat, selectedPin.location.lng, shelters)
      : null;

    // Draw Polylines for Simple Route Visualization (selected incident -> hospital/shelter)
    if (isIncident && selectedPin) {
      if (nearestHospital) {
        L.polyline(
          [
            [selectedPin.location.lat, selectedPin.location.lng],
            [nearestHospital.location.lat, nearestHospital.location.lng]
          ],
          {
            color: '#f43f5e', // deep red
            weight: 2.5,
            opacity: 0.85,
            dashArray: '6, 6'
          }
        ).addTo(layers);
      }
      if (nearestShelter) {
        L.polyline(
          [
            [selectedPin.location.lat, selectedPin.location.lng],
            [nearestShelter.location.lat, nearestShelter.location.lng]
          ],
          {
            color: '#3b82f6', // tactical blue
            weight: 2.5,
            opacity: 0.85,
            dashArray: '6, 6'
          }
        ).addTo(layers);
      }
    }

    const showIncidents = filter === 'all' || filter === 'incidents';
    const showFacilities = filter === 'all' || filter === 'facilities';

    // 1. Plot Incident Markers (severity-based colors)
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'resolved') return;

        // Critical = Red pulse animation
        // High = Orange
        // Medium = Yellow
        // Low = Blue
        const severityColorClass = 
          inc.severity === 'critical' || inc.severity === 'Critical' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse' :
          inc.severity === 'high' || inc.severity === 'High' ? 'bg-orange-500' :
          inc.severity === 'medium' || inc.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500';

        const isSelected = selectedPin && selectedPin.id === inc.id;

        const iconHtml = `
          <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${(inc.severity === 'critical' || inc.severity === 'Critical') ? `
              <span class="absolute -inset-1 rounded-full border border-rose-500/40 bg-rose-500/10 animate-[ping_2s_infinite] opacity-95 pointer-events-none"></span>
            ` : ''}
            ${isSelected ? `
              <span class="absolute -inset-2 rounded-full border-2 border-red-500 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-5.5 h-5.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${severityColorClass} transition-transform duration-200 hover:scale-125 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([inc.location.lat, inc.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(inc);
            map.panTo([inc.location.lat, inc.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-slate-100">${inc.title}</div>
            <div class="text-slate-450 capitalize">Severity: <span class="font-bold text-rose-400">${inc.severity}</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 2. Plot Hospital Markers with Capacity Status
    if (showFacilities) {
      hospitals.forEach((hosp) => {
        const occupiedPercent = (hosp.bedsOccupied / hosp.bedsTotal) * 100;
        // Green = available (<75%)
        // Orange = near capacity (>=75%)
        // Red = full (>=95%)
        const statusColorClass = 
          occupiedPercent >= 95 ? 'bg-rose-600' :
          occupiedPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

        const isSelected = selectedPin && selectedPin.id === hosp.id;

        const iconHtml = `
          <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${isSelected ? `
              <span class="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-7.5 h-7.5 rounded bg-slate-950 border border-slate-900 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all hover:scale-110 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2"/><path d="M2 22h20"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/><path d="M14 8h-4"/><path d="M12 6h2"/><path d="M12 10v4"/><path d="M14 12h-4"/></svg>
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${statusColorClass}"></span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([hosp.location.lat, hosp.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(hosp);
            map.panTo([hosp.location.lat, hosp.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-slate-100">${hosp.name}</div>
            <div class="text-slate-450">Beds: <span class="font-bold text-emerald-400">${hosp.bedsOccupied}/${hosp.bedsTotal} (${Math.round(occupiedPercent)}%)</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 3. Plot Shelter Markers with Capacity Status
    if (showFacilities) {
      shelters.forEach((sh) => {
        const occupiedPercent = (sh.occupied / sh.capacity) * 100;
        const statusColorClass = 
          occupiedPercent >= 100 ? 'bg-rose-500' :
          sh.status === 'closed' ? 'bg-slate-700' : 'bg-blue-500';

        const isSelected = selectedPin && selectedPin.id === sh.id;

        const iconHtml = `
          <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${isSelected ? `
              <span class="absolute -inset-1 rounded-full border-2 border-blue-500 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-7.5 h-7.5 rounded bg-slate-950 border border-slate-900 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all hover:scale-110 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${statusColorClass}"></span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([sh.location.lat, sh.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(sh);
            map.panTo([sh.location.lat, sh.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-slate-100">${sh.name}</div>
            <div class="text-slate-450">Capacity: <span class="font-bold text-blue-400">${sh.occupied}/${sh.capacity} (${Math.round(occupiedPercent)}%)</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 3b. Plot Police Stations
    if (showFacilities && policeStations) {
      policeStations.forEach((police) => {
        const isSelected = selectedPin && selectedPin.id === police.id;
        const iconHtml = `
          <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${isSelected ? `
              <span class="absolute -inset-1 rounded-full border-2 border-blue-600 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-7.5 h-7.5 rounded-full bg-slate-950 border border-blue-900 flex items-center justify-center text-blue-500 hover:text-blue-400 transition-all hover:scale-110 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([police.location.lat, police.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(police);
            map.panTo([police.location.lat, police.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-blue-400">${police.name}</div>
            <div class="text-slate-400">Type: <span class="text-blue-300 font-bold">Police Command</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 3c. Plot Fire Stations
    if (showFacilities && fireStations) {
      fireStations.forEach((fire) => {
        const isSelected = selectedPin && selectedPin.id === fire.id;
        const iconHtml = `
          <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${isSelected ? `
              <span class="absolute -inset-1 rounded-full border-2 border-orange-500 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-7.5 h-7.5 rounded bg-slate-950 border border-orange-950 flex items-center justify-center text-orange-500 hover:text-orange-400 transition-all hover:scale-110 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([fire.location.lat, fire.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(fire);
            map.panTo([fire.location.lat, fire.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-orange-400">${fire.name}</div>
            <div class="text-slate-400">Type: <span class="text-orange-300 font-bold">Fire & Rescue</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 3d. Plot Blood Banks
    if (showFacilities && bloodBanks) {
      bloodBanks.forEach((blood) => {
        const isSelected = selectedPin && selectedPin.id === blood.id;
        const iconHtml = `
          <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
            ${isSelected ? `
              <span class="absolute -inset-1 rounded-full border-2 border-rose-500 animate-spin pointer-events-none"></span>
            ` : ''}
            <div class="relative w-7.5 h-7.5 rounded-full bg-slate-950 border border-rose-950 flex items-center justify-center text-rose-500 hover:text-rose-400 transition-all hover:scale-110 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([blood.location.lat, blood.location.lng], { icon: customIcon })
          .addTo(layers)
          .on('click', () => {
            setSelectedPin(blood);
            map.panTo([blood.location.lat, blood.location.lng]);
          });

        marker.bindTooltip(`
          <div class="font-mono text-[10px] space-y-0.5">
            <div class="font-bold text-rose-400">${blood.name}</div>
            <div class="text-slate-400">Type: <span class="text-rose-300 font-bold">Blood Bank</span></div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });
      });
    }

    // 4. Plot User Geolocation / Command Post Marker
    if (userLocation && (userLocation.lat !== 0 || userLocation.lng !== 0)) {
      const iconHtml = `
        <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; position: relative;">
          <span class="absolute -inset-1 rounded-full border border-blue-500/40 bg-blue-500/10 animate-[ping_2s_infinite] opacity-95 pointer-events-none"></span>
          <div class="relative w-8 h-8 rounded-full border-2 border-slate-950 bg-blue-500 flex items-center justify-center text-slate-950 hover:bg-blue-450 transition-all hover:scale-110 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: customIcon })
        .addTo(layers);

      marker.bindTooltip(`
        <div class="font-mono text-[10px] space-y-0.5">
          <div class="font-bold text-blue-400">📍 YOU ARE HERE</div>
          <div class="text-slate-400">${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      });
    }

  }, [incidents, shelters, hospitals, policeStations, fireStations, bloodBanks, filter, selectedPin, userLocation]);

  // Handle map view operations
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    if (userLocation && (userLocation.lat !== 0 || userLocation.lng !== 0)) {
      mapRef.current?.setView([userLocation.lat, userLocation.lng], 14);
    } else {
      mapRef.current?.setView([0, 0], 2);
    }
  };

  return (
    <div className="relative h-[550px] rounded-lg bg-slate-950 border border-slate-900 flex flex-col overflow-hidden select-none shadow-lg shadow-slate-950/50">
      <style>{`
        .custom-leaflet-icon {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-container {
          background: #020617 !important;
          font-family: inherit;
        }
        .leaflet-tooltip {
          background: #020617 !important;
          color: #f1f5f9 !important;
          border: 1px solid #1e293b !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.7) !important;
          border-radius: 4px;
          padding: 6px 10px;
        }
        .leaflet-tooltip-top:before {
          border-top-color: #1e293b !important;
        }
      `}</style>

      {/* Top Map header widget controls */}
      <div className="h-12 border-b border-slate-900 bg-slate-950 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-4.5 h-4.5 text-red-500 animate-[spin_10s_linear_infinite]" />
          <span className="font-display font-semibold tracking-wider text-xs uppercase text-slate-200">Tactical GIS Terminal (OSM/Leaflet)</span>
          <span className="hidden sm:inline font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">LOCAL RENDERING ONLINE</span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'} 
            size="sm" 
            className="text-[10px] font-mono tracking-wider uppercase px-2 py-1"
            onClick={() => setFilter('all')}
          >
            All assets
          </Button>
          <Button 
            variant={filter === 'incidents' ? 'primary' : 'outline'} 
            size="sm" 
            className="text-[10px] font-mono tracking-wider uppercase px-2 py-1"
            onClick={() => setFilter('incidents')}
          >
            Incidents
          </Button>
          <Button 
            variant={filter === 'facilities' ? 'primary' : 'outline'} 
            size="sm" 
            className="text-[10px] font-mono tracking-wider uppercase px-2 py-1"
            onClick={() => setFilter('facilities')}
          >
            Resources
          </Button>
          
          <button 
            onClick={() => setRadarSweeping(!radarSweeping)} 
            className={`w-7 h-7 rounded border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 ${radarSweeping ? 'bg-slate-900' : 'bg-transparent'}`}
            title="Toggle Scanline Radar Sweep"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${radarSweeping ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main interactive map stage */}
      <div className="flex-1 relative bg-slate-950 cursor-crosshair overflow-hidden">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* GPS Acquisition Status Overlay */}
        {isLocatingGlobal && !userLocation && (
          <div className="absolute top-4 left-4 z-[999] flex items-center gap-2 px-3 py-2 bg-slate-950/90 border border-blue-500/30 rounded-lg backdrop-blur-sm">
            <Crosshair className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="font-mono text-[10px] text-blue-400 uppercase font-bold">Acquiring GPS Signal...</span>
          </div>
        )}
        {locatingErrorGlobal && !userLocation && (
          <div className="absolute top-4 left-4 z-[999] flex items-center gap-2 px-3 py-2 bg-slate-950/90 border border-amber-500/30 rounded-lg backdrop-blur-sm max-w-sm">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-[10px] text-amber-400 uppercase font-bold">Click anywhere on the map to set your location</span>
          </div>
        )}

        {/* Tactical Map Control Widgets Overlay */}
        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-1">
          <button 
            onClick={zoomIn} 
            className="w-8 h-8 rounded bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={zoomOut} 
            className="w-8 h-8 rounded bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={resetView} 
            className="w-8 h-8 rounded bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mt-1"
            title="Recenter Map"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleLocateMe} 
            disabled={isLocating}
            className={`w-8 h-8 rounded bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mt-1 ${isLocating ? 'text-cyan-400' : ''}`}
            title="Detect & Mark My Location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Tactical Sweep line overlay on top of map */}
        {radarSweeping && (
          <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-[0.12] z-10" />
        )}

        {/* Pin details floating popover card */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 w-96 bg-slate-950/95 border border-slate-900 rounded-lg shadow-2xl z-[999] max-h-[380px] overflow-y-auto">
            <div className="p-2 border-b border-slate-900 flex justify-between items-center bg-slate-950">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Asset Profile</span>
              <button 
                onClick={() => setSelectedPin(null)} 
                className="font-mono text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 hover:bg-slate-900 rounded"
              >
                [X] Close
              </button>
            </div>
            {selectedPin.type !== undefined && selectedPin.bedsTotal === undefined && selectedPin.capacity === undefined && !['police', 'fire', 'blood_bank', 'food', 'water', 'medical_camp', 'pharmacy'].includes(selectedPin.type) ? (
              // It's an incident! Render the real IncidentCard UI (DO NOT redesign)
              <div className="p-2 bg-slate-950">
                <IncidentCard 
                  incident={selectedPin} 
                  onDispatchClick={(inc) => {
                    useCommandStore.getState().updateIncident(inc.id, { status: 'dispatching' });
                    setSelectedPin({ ...selectedPin, status: 'dispatching' });
                  }}
                  onStatusChange={(id, nextStatus) => {
                    useCommandStore.getState().updateIncident(id, { status: nextStatus });
                    setSelectedPin({ ...selectedPin, status: nextStatus });
                  }}
                />
              </div>
            ) : selectedPin.bedsTotal !== undefined ? (
              // It's a hospital! Render HospitalCard
              <div className="p-2 bg-slate-950">
                <HospitalCard hospital={selectedPin} />
              </div>
            ) : selectedPin.capacity !== undefined ? (
              // It's a shelter! Render ShelterCard
              <div className="p-2 bg-slate-950">
                <ShelterCard shelter={selectedPin} />
              </div>
            ) : (
              // It's an extra resource (Police, Fire, Blood Bank, etc.)!
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg space-y-3 font-sans">
                <div className="flex justify-between items-start gap-2 border-b border-slate-900 pb-2">
                  <h4 className="font-sans font-bold text-sm text-slate-100">{selectedPin.name}</h4>
                  <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                    {selectedPin.type?.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{selectedPin.location.address}</span>
                  </div>
                  {selectedPin.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono text-[10px]">{selectedPin.phone}</span>
                    </div>
                  )}
                  {selectedPin.distance !== undefined && (
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold">Distance: {selectedPin.distance.toFixed(2)} km</span>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-850">
                  <div className="text-[9px] font-mono uppercase font-bold text-slate-500">Resource Status</div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">{selectedPin.status || 'Active Operations'}</div>
                  {selectedPin.details && (
                    <p className="text-[10px] text-slate-450 mt-1 leading-relaxed border-t border-slate-800 pt-1 font-mono">{selectedPin.details}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom GIS Coordinates Telemetry Bar */}
      <div className="h-10 border-t border-slate-900 bg-slate-950 px-4 flex items-center justify-between font-mono text-[10px] text-slate-500 z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-slate-600" />
            Live Coordinates: <strong className="text-slate-400">{cursorCoords.lat.toFixed(6)} N, {cursorCoords.lng.toFixed(6)} W</strong>
          </span>
          <span className="hidden md:inline text-slate-800">|</span>
          <span className="hidden md:inline">Precision: OSM_L_TACTICAL</span>
          {userLocation && (
            <>
              <span className="text-slate-800">|</span>
              <span className="text-cyan-400 font-semibold uppercase">GPS Fixed: {userLocation.lat.toFixed(4)} N, {userLocation.lng.toFixed(4)} W</span>
            </>
          )}
          {locatingError && (
            <>
              <span className="text-slate-800">|</span>
              <span className="text-rose-400 animate-pulse font-semibold uppercase">GPS Error: {locatingError}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="uppercase text-[9px] tracking-widest text-slate-500">OSM Telemetry Connected</span>
        </div>
      </div>
    </div>
  );
}
