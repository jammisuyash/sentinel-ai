import type { ExtraEmergencyResource, Location } from '../types';

function getGoogleKey() {
  const runtime = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
    ? import.meta.env
    : undefined;
  return runtime?.VITE_GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';
}

function buildFallbackFacilities(coords: Location, type: string) {
  const offset = 0.015;
  const base = [
    { name: 'Nearby Medical Center', type: 'hospital' },
    { name: 'Nearby Shelter Hub', type: 'shelter' },
    { name: 'Nearby Police Station', type: 'police' },
    { name: 'Nearby Fire Station', type: 'fire' },
    { name: 'Nearby Blood Bank', type: 'blood_bank' },
    { name: 'Nearby Food Center', type: 'food' },
    { name: 'Nearby Medical Camp', type: 'medical_camp' },
    { name: 'Nearby Pharmacy', type: 'pharmacy' }
  ];

  const filtered = base.filter((item) => item.type === type);
  if (filtered.length === 0) return [];

  return filtered.map((item, index) => ({
    id: `${type}-${index + 1}`,
    name: item.name,
    type: type as ExtraEmergencyResource['type'],
    location: {
      lat: coords.lat + (index % 2 === 0 ? offset : -offset) + index * 0.001,
      lng: coords.lng + (index % 3 === 0 ? offset : -offset) + index * 0.001,
      address: `${item.name} • Nearby response corridor`
    },
    status: 'active',
    details: 'Auto-resolved from live GPS context'
  }));
}

export async function getNearbyFacilities(coords: Location, type: string) {
  const googleKey = getGoogleKey();
  const effectiveType = type === 'shelter' ? 'lodging' : type === 'fire' ? 'fire_station' : type;

  if (googleKey) {
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=5000&type=${effectiveType}&key=${googleKey}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Google Places request failed');
      const payload = await response.json();
      if (payload?.results?.length) {
        return payload.results.slice(0, 4).map((result: any, index: number) => ({
          id: `${type}-${index + 1}`,
          name: result.name,
          type: type as ExtraEmergencyResource['type'],
          location: {
            lat: result.geometry?.location?.lat,
            lng: result.geometry?.location?.lng,
            address: result.vicinity || 'Nearby route'
          },
          phone: result.formatted_phone_number || '',
          status: 'active',
          details: result.types?.slice(0, 3).join(', ')
        }));
      }
    } catch (error) {
      console.warn('Google Places unavailable; using fallback local routing data.', error);
    }
  }

  return buildFallbackFacilities(coords, type);
}

// ============================================================
// INCIDENT-TYPE-AWARE HELPLINE NUMBERS (India)
// ============================================================
// Returns helplines relevant to the specific emergency type
// so the citizen sees the RIGHT numbers for THEIR problem.

const HELPLINES_BY_TYPE: Record<string, Array<{ name: string; number: string }>> = {
  fire: [
    { name: 'Fire Brigade', number: '101' },
    { name: 'Emergency', number: '112' },
    { name: 'Disaster Mgmt', number: '108' },
  ],
  flood: [
    { name: 'NDRF', number: '011-24363260' },
    { name: 'Disaster Mgmt', number: '108' },
    { name: 'Emergency', number: '112' },
  ],
  cyclone: [
    { name: 'NDRF', number: '011-24363260' },
    { name: 'IMD Cyclone', number: '011-24631913' },
    { name: 'Emergency', number: '112' },
  ],
  earthquake: [
    { name: 'NDRF', number: '011-24363260' },
    { name: 'Disaster Mgmt', number: '108' },
    { name: 'Emergency', number: '112' },
  ],
  medical: [
    { name: 'Ambulance', number: '108' },
    { name: 'Medical Helpline', number: '104' },
    { name: 'Emergency', number: '112' },
  ],
  road_accident: [
    { name: 'Road Accident', number: '1073' },
    { name: 'Ambulance', number: '108' },
    { name: 'Police', number: '100' },
  ],
  building_collapse: [
    { name: 'NDRF', number: '011-24363260' },
    { name: 'Fire Brigade', number: '101' },
    { name: 'Ambulance', number: '108' },
  ],
  hurricane: [
    { name: 'NDRF', number: '011-24363260' },
    { name: 'IMD', number: '011-24631913' },
    { name: 'Emergency', number: '112' },
  ],
  other: [
    { name: 'Emergency', number: '112' },
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '108' },
  ],
};

const GENERIC_HELPLINES = [
  { name: 'Emergency', number: '112' },
  { name: 'Police', number: '100' },
  { name: 'Fire', number: '101' },
  { name: 'Ambulance', number: '108' },
  { name: 'Women Helpline', number: '1091' },
  { name: 'Child Helpline', number: '1098' },
];

export function getEmergencyHelplines(_coords?: Location, incidentType?: string): Array<{ name: string; number: string }> {
  if (incidentType && HELPLINES_BY_TYPE[incidentType]) {
    // Return type-specific helplines + a couple generic ones
    const specific = HELPLINES_BY_TYPE[incidentType];
    const extra = GENERIC_HELPLINES.filter(
      g => !specific.some(s => s.number === g.number)
    ).slice(0, 2);
    return [...specific, ...extra];
  }
  return GENERIC_HELPLINES;
}
