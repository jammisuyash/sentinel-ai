import { Hospital, Shelter, Incident, Location, ExtraEmergencyResource } from '../types';
import { calculateDistance } from './geo';


// Dynamically generate realistic hospitals near a location
export function generateNearbyHospitals(lat: number, lng: number): Hospital[] {
  const names = [
    'Emergency & Trauma Center',
    'Mercy General Hospital',
    'Valley Health Memorial Care',
    'Saint Jude Surgical Hospital'
  ];

  const streets = ['Medical Center Parkway', 'Health Sciences Blvd', 'Wellness Lane', 'Ambulance Way'];

  return names.map((name, index) => {
    // Generate within a small radius of 1.5 - 6 km
    const offsetLat = (index === 0 ? 0.012 : index === 1 ? -0.018 : index === 2 ? 0.024 : -0.009) + (Math.random() - 0.5) * 0.005;
    const offsetLng = (index === 0 ? -0.015 : index === 1 ? 0.022 : index === 2 ? 0.010 : -0.028) + (Math.random() - 0.5) * 0.005;
    const hLat = lat + offsetLat;
    const hLng = lng + offsetLng;

    const bedsTotal = [350, 500, 250, 400][index];
    const bedsOccupied = Math.floor(bedsTotal * [0.65, 0.88, 0.96, 0.72][index]);
    const status: 'normal' | 'busy' | 'critical' = 
      bedsOccupied >= bedsTotal * 0.95 ? 'critical' :
      bedsOccupied >= bedsTotal * 0.75 ? 'busy' : 'normal';

    const distance = calculateDistance({ lat, lng }, { lat: hLat, lng: hLng });
    const travelTimeMin = Math.max(3, Math.round(distance * 3 + 2));

    return {
      id: `gen-hosp-${index + 1}`,
      name,
      location: {
        lat: parseFloat(hLat.toFixed(6)),
        lng: parseFloat(hLng.toFixed(6)),
        address: `${100 + index * 125} ${streets[index]}, Zone Sector`
      },
      bedsTotal,
      bedsOccupied,
      status,
      phone: `(555) 011-020${index + 1}`,
      specialties: [
        ['Level 1 Trauma', 'Emergency Surgery', 'Cardiac Unit', 'Burn Ward'],
        ['Pediatric ER', 'ICU Care', 'General Triage'],
        ['Mass Casualty Intake', 'Infectious Diseases', 'Orthopedics'],
        ['Emergency Medicine', 'Neurological Trauma', 'Triage Station']
      ][index],
      // Extended fields
      distance,
      travelTime: `${travelTimeMin} mins`,
      openStatus: 'Open - Emergency Active'
    } as Hospital & { distance: number; travelTime: string; openStatus: string };
  });
}

// Dynamically generate realistic shelters near a location
export function generateNearbyShelters(lat: number, lng: number): Shelter[] {
  const names = [
    'Civic Arena Emergency Shelter',
    'County Fairgrounds Gymnasium',
    'Red Cross Regional Relief Station',
    'Municipal Community Center'
  ];

  const addresses = [
    '789 Plaza Avenue, Center Zone',
    '1200 Exhibition Road, West Zone',
    '450 Relief Parkway, North Zone',
    '15 Community Drive, East Zone'
  ];

  return names.map((name, index) => {
    const offsetLat = (index === 0 ? -0.008 : index === 1 ? 0.019 : index === 2 ? -0.025 : 0.011) + (Math.random() - 0.5) * 0.005;
    const offsetLng = (index === 0 ? -0.012 : index === 1 ? -0.022 : index === 2 ? 0.018 : 0.029) + (Math.random() - 0.5) * 0.005;
    const sLat = lat + offsetLat;
    const sLng = lng + offsetLng;

    const capacity = [600, 400, 300, 500][index];
    const occupied = Math.floor(capacity * [0.35, 0.72, 1.0, 0.55][index]);
    const status: 'open' | 'full' | 'closed' = 
      occupied >= capacity ? 'full' : 'open';

    const distance = calculateDistance({ lat, lng }, { lat: sLat, lng: sLng });
    const travelTimeMin = Math.max(3, Math.round(distance * 3 + 2));

    return {
      id: `gen-sh-${index + 1}`,
      name,
      location: {
        lat: parseFloat(sLat.toFixed(6)),
        lng: parseFloat(sLng.toFixed(6)),
        address: addresses[index]
      },
      capacity,
      occupied,
      status,
      phone: `(555) 011-030${index + 1}`,
      amenities: [
        'Hot Meals', 'Drinking Water', 'Medical Station', 'Power Charging', 'WiFi', 'Washrooms'
      ],
      // Required explicit flags for Nearby Shelters display
      foodAvailable: true,
      drinkingWater: true,
      medicalAssistance: index % 2 === 0, // alternates
      washrooms: true,
      generatorStatus: index % 3 === 0 ? 'Operational' : index % 3 === 1 ? 'Standby' : 'None',
      distance,
      travelTime: `${travelTimeMin} mins`
    } as Shelter & { 
      foodAvailable: boolean; 
      drinkingWater: boolean; 
      medicalAssistance: boolean; 
      washrooms: boolean; 
      generatorStatus: string;
      distance: number;
      travelTime: string;
    };
  });
}

// Generate other support services (Police, Fire, Blood Bank, Food point, Water point, etc.)
export function generateExtraResources(lat: number, lng: number): ExtraEmergencyResource[] {
  const resources: ExtraEmergencyResource[] = [
    // Police
    {
      id: 'res-police-1',
      name: 'District Tactical Command Station',
      type: 'police',
      location: { lat: lat + 0.005, lng: lng - 0.006, address: '220 Law Enforcement Way' },
      phone: '(555) 911-0101',
      status: 'Active Command Unit',
      details: 'Patrol units dispatched, traffic diversion en route'
    },
    // Fire
    {
      id: 'res-fire-1',
      name: 'Emergency Fire & Rescue Station 12',
      type: 'fire',
      location: { lat: lat - 0.004, lng: lng + 0.008, address: '85 Engine Drive' },
      phone: '(555) 911-0202',
      status: 'Ready / Dispatching',
      details: 'Pumpers, rescue vehicles, heavy search tenders'
    },
    // Blood Bank
    {
      id: 'res-blood-1',
      name: 'Emergency Regional Blood Bank & Red Cross Storage',
      type: 'blood_bank',
      location: { lat: lat + 0.015, lng: lng + 0.002, address: '12 Medical Plaza, Blood Care Wing' },
      phone: '(555) 445-0900',
      status: 'Supplies Secured (O-Neg Priority)',
      details: 'Stored units of plasma, platelets, and emergency blood packs'
    },
    // Food Distribution Center
    {
      id: 'res-food-1',
      name: 'Disaster Food & Nutrition Supply Hub',
      type: 'food',
      location: { lat: lat - 0.011, lng: lng - 0.014, address: 'Warehouse 4, Port Logistics Sector' },
      phone: '(555) 300-4500',
      status: 'Stock Available - Distribution Active',
      details: 'Ready MREs, non-perishables, hot meals and emergency food supplies'
    },
    // Water Distribution Point
    {
      id: 'res-water-1',
      name: 'Safe Drinking Water Distribution Point Alpha',
      type: 'water',
      location: { lat: lat - 0.002, lng: lng - 0.004, address: 'Civic Park Fountain Sector' },
      phone: '(555) 300-4600',
      status: 'Water Quality Certified - Tankers Active',
      details: 'Emergency hydration reserves, water purification tablets'
    },
    // Medical Camp
    {
      id: 'res-camp-1',
      name: 'First Responder Medical Field Camp Gamma',
      type: 'medical_camp',
      location: { lat: lat + 0.008, lng: lng + 0.011, address: 'Primary School Athletic Field' },
      phone: '(555) 330-9111',
      status: 'Operational - Triage Open',
      details: 'Mobile surgical suites, basic wound care, psych first-aid'
    },
    // Pharmacy
    {
      id: 'res-pharmacy-1',
      name: '24/7 Tactical Emergency Pharmacy & Medical Supplies',
      type: 'pharmacy',
      location: { lat: lat + 0.003, lng: lng + 0.005, address: '400 Wellness Plaza' },
      phone: '(555) 550-1122',
      status: 'Active Supply Chain',
      details: 'Insulin, epinephrine, critical antibiotics and prescription refills'
    }
  ];

  return resources.map((res) => {
    const distance = calculateDistance({ lat, lng }, res.location);
    return {
      ...res,
      distance
    };
  });
}

// Generate realistic incidents near user's actual location
export function generateNearbyIncidents(lat: number, lng: number): Incident[] {
  return [
    {
      id: 'inc-1',
      title: 'Infrastructure Flare / Combustion',
      description: 'Localized transformer blast and secondary fire lines spreading into urban brush. Units dispatched.',
      type: 'fire',
      severity: 'high',
      status: 'active',
      location: { lat: lat + 0.006, lng: lng - 0.008, address: 'Power Substation 14, Zone Perimeter' },
      reportedBy: 'Citizen Dispatch #4102',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      aiAnalysis: {
        severity: 'high',
        category: 'Electrical Substation Fire',
        summary: 'High heat fire load affecting local energy distribution grid. High risk of localized blackout.',
        recommendedActions: [
          'Coordinate immediate power grid cutoff',
          'Deploy tactical Class-C dry chemical extinguishers',
          'Evacuate civilian quarters within 500 meters'
        ],
        requiredResources: ['Fire Engine x2', 'Utility Power Truck x1', 'Emergency Ambulance x1']
      }
    },
    {
      id: 'inc-2',
      title: 'Water Hydrology Surge & Roadway Breach',
      description: 'Major stormwater conduit collapse. Street structural erosion reported. Silt and water active.',
      type: 'flood',
      severity: 'medium',
      status: 'dispatching',
      location: { lat: lat - 0.012, lng: lng + 0.007, address: 'Conduit Boulevard crossing, Low Sector' },
      reportedBy: 'Sentinel Hydrology Drone 05',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      aiAnalysis: {
        severity: 'medium',
        category: 'Urban Hydrological Surge',
        summary: 'Street surface flooding and structural failure of conduit. Threat of erosion beneath road deck.',
        recommendedActions: [
          'Reroute neighborhood heavy vehicle transport',
          'Establish water pumping stations',
          'Inspect bridge supports in zone'
        ],
        requiredResources: ['Hydraulic Pumper Unit x2', 'Trench Rescue Team', 'Police Escort Patrol']
      }
    },
    {
      id: 'inc-3',
      title: 'Structural Compression & Wall Fracture',
      description: 'Seismic or ground shifting fracture on structural load-bearing frame of commercial office block.',
      type: 'earthquake',
      severity: 'critical',
      status: 'reported',
      location: { lat: lat + 0.003, lng: lng + 0.012, address: 'Enterprise Tower 4, Core Zone' },
      reportedBy: 'Structural Telemetry Sensor cluster',
      createdAt: new Date(Date.now() - 600000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
      aiAnalysis: {
        severity: 'critical',
        category: 'Load-bearing Structural Collapse Threat',
        summary: 'Critical structural compromise with lateral load failure. Rapid evacuation of core block and surrounds mandatory.',
        recommendedActions: [
          'Issue Immediate Block Evacuation order',
          'Assemble Shoring and Structural Engineers',
          'Deploy Trauma Staging Units near base'
        ],
        requiredResources: ['Heavy Urban Search & Rescue Crew', 'Structural Shoring Tender', 'ALS Ambulance x2']
      }
    }
  ];
}
