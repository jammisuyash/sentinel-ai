import { create } from 'zustand';
import { 
  Incident, 
  Shelter, 
  Hospital, 
  SituationReport, 
  ActiveView,
  Location,
  ExtraEmergencyResource,
  EmergencyResourceItem,
  Volunteer,
  NotificationItem,
  AuthUser
} from '../types';
import { getOperationalSnapshot } from '../services/firestore';
import { analyzeIncidentWithGemini } from '../services/gemini';
import { getStoredAuthSession } from '../services/auth';
import { showBrowserNotification } from '../services/notifications';
import { getEmergencyHelplines, getNearbyFacilities } from '../services/maps';


interface CommandStore {
  activeView: ActiveView;
  incidents: Incident[];
  shelters: Shelter[];
  hospitals: Hospital[];
  reports: SituationReport[];
  resources: EmergencyResourceItem[];
  volunteers: Volunteer[];
  notifications: NotificationItem[];
  offlineQueue: Incident[];
  isOnline: boolean;
  
  // Auth
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  
  // Geolocation
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => Promise<void>;
  refreshNearbyFacilities: (loc: { lat: number; lng: number } | null) => Promise<void>;
  
  policeStations: ExtraEmergencyResource[];
  fireStations: ExtraEmergencyResource[];
  bloodBanks: ExtraEmergencyResource[];
  foodCenters: ExtraEmergencyResource[];
  waterPoints: ExtraEmergencyResource[];
  medicalCamps: ExtraEmergencyResource[];
  pharmacies: ExtraEmergencyResource[];
  helplineNumbers: Array<{ name: string; number: string }>;

  
  // States
  selectedIncident: Incident | null;
  loading: boolean;
  error: string | null;
  
  // Geolocation states
  isLocating: boolean;
  locatingError: string | null;
  
  fetchIncidents: () => Promise<void>;
  createIncident: (incident: Omit<Incident, 'id'>) => Promise<Incident>;
  setSelectedIncident: (incident: Incident | null) => void;
  
  // Actions
  setActiveView: (view: ActiveView) => void;
  setIsOnline: (online: boolean) => void;
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;
  
  setShelters: (shelters: Shelter[]) => void;
  updateShelter: (id: string, updates: Partial<Shelter>) => void;
  
  setHospitals: (hospitals: Hospital[]) => void;
  updateHospital: (id: string, updates: Partial<Hospital>) => void;
  
  setReports: (reports: SituationReport[]) => void;
  addReport: (report: SituationReport) => void;
  setResources: (resources: EmergencyResourceItem[]) => void;
  setVolunteers: (volunteers: Volunteer[]) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  
  addToOfflineQueue: (incident: Incident) => void;
  clearOfflineQueue: () => void;
}


export const useCommandStore = create<CommandStore>((set) => ({
  activeView: 'landing',
  incidents: [],
  shelters: [],
  hospitals: [],
  reports: [],
  resources: [],
  volunteers: [],
  notifications: [],
  offlineQueue: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  
  authUser: null,
  setAuthUser: (user) => set({ authUser: user }),
  
  userLocation: null,
  isLocating: false,
  locatingError: null,
  policeStations: [],
  fireStations: [],
  bloodBanks: [],
  foodCenters: [],
  waterPoints: [],
  medicalCamps: [],
  pharmacies: [],
  helplineNumbers: getEmergencyHelplines(),

  setUserLocation: async (coords) => {
    if (!coords) {
      set({ userLocation: null, helplineNumbers: getEmergencyHelplines() });
      return;
    }
    await useCommandStore.getState().refreshNearbyFacilities(coords);
  },

  refreshNearbyFacilities: async (coords) => {
    if (!coords) {
      set({ userLocation: null, helplineNumbers: getEmergencyHelplines() });
      return;
    }

    set({ loading: true });
    try {
      const [
        hospitalResults, 
        shelterResults, 
        policeResults, 
        fireResults,
        bloodBankResults
      ] = await Promise.all([
        getNearbyFacilities(coords, 'hospital'),
        getNearbyFacilities(coords, 'shelter'),
        getNearbyFacilities(coords, 'police'),
        getNearbyFacilities(coords, 'fire'),
        getNearbyFacilities(coords, 'blood_bank')
      ]);

      const hospitals = (hospitalResults as any[]).map((item, index) => ({
        id: item.id || `hospital-${index + 1}`,
        name: item.name,
        location: item.location,
        bedsTotal: 120 + index * 40,
        bedsOccupied: 20 + index * 8,
        status: index === 0 ? 'busy' : 'normal',
        phone: item.phone || '',
        specialties: ['Trauma', 'Critical Care'],
        distance: Number((Math.max(1, index + 1) * 1.2).toFixed(2)),
        travelTime: `${index + 3} min`
      } as Hospital));

      const shelters = (shelterResults as any[]).map((item, index) => ({
        id: item.id || `shelter-${index + 1}`,
        name: item.name,
        location: item.location,
        capacity: 120 + index * 50,
        occupied: 20 + index * 15,
        status: 'open',
        phone: item.phone || '',
        amenities: ['Meals', 'Water', 'Charging'],
        foodAvailable: true,
        drinkingWater: true,
        medicalAssistance: true,
        washrooms: true,
        generatorStatus: 'Operational',
        distance: Number((Math.max(1, index + 2) * 1.1).toFixed(2)),
        travelTime: `${index + 4} min`
      } as Shelter));

      set({
        userLocation: coords,
        hospitals,
        shelters,
        policeStations: (policeResults as ExtraEmergencyResource[]).map((item) => ({ ...item, status: 'active' })),
        fireStations: (fireResults as ExtraEmergencyResource[]).map((item) => ({ ...item, status: 'active' })),
        bloodBanks: (bloodBankResults as ExtraEmergencyResource[]).map((item) => ({ ...item, status: 'active' })),
        helplineNumbers: getEmergencyHelplines(coords),
        loading: false
      });
    } catch (error) {
      console.error('Failed to resolve nearby facilities:', error);
      set({ loading: false, helplineNumbers: getEmergencyHelplines(coords) });
    }
  },


  selectedIncident: null,
  loading: false,
  error: null,

  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  fetchIncidents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
      const data = await res.json();

      set({ incidents: data, loading: false });

      const snapshot = await getOperationalSnapshot();
      set((state) => ({
        shelters: snapshot.shelters.length ? snapshot.shelters : state.shelters,
        hospitals: snapshot.hospitals.length ? snapshot.hospitals : state.hospitals,
        reports: snapshot.reports.length ? snapshot.reports : state.reports,
        resources: snapshot.resources.length ? snapshot.resources as EmergencyResourceItem[] : state.resources,
        volunteers: snapshot.volunteers.length ? snapshot.volunteers as Volunteer[] : state.volunteers,
        notifications: snapshot.notifications.length ? snapshot.notifications as NotificationItem[] : state.notifications
      }));
    } catch (err: any) {
      console.error("fetchIncidents error:", err);
      set({ error: err.message || "Failed to load incidents", loading: false });
    }
  },

  createIncident: async (incident) => {
    set({ loading: true, error: null });
    try {
      const authSession = getStoredAuthSession();
      // Only invoke AI explicitly via frontend if not trusting backend, but we moved auth to backend.
      // Wait, backend api/incidents DOES its own AI analysis. We just submit it!
      const payload = {
        ...incident,
        reportedBy: incident.reportedBy || authSession?.user?.name || 'Citizen Reporter',
        reporterId: authSession?.user?.id,
      };

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create incident: ${res.statusText}`);
      const data = await res.json();
      
      const currentLocation = useCommandStore.getState().userLocation || (incident.location ? { lat: incident.location.lat, lng: incident.location.lng } : null);
      if (currentLocation) {
        await useCommandStore.getState().refreshNearbyFacilities(currentLocation);
      }
      
      // We don't need to set State because realtime handles it, but doing it just in case realtime delay.
      set((state) => {
        const existing = state.incidents.find(i => i.id === data.id);
        if (existing) return { loading: false };
        return { incidents: [data, ...state.incidents], loading: false };
      });
      
      showBrowserNotification('Incident submitted', data.title || 'Emergency report is now live');
      return data;
    } catch (err: any) {
      console.error("createIncident error:", err);
      set({ error: err.message || "Failed to create incident", loading: false });
      throw err;
    }
  },
  
  setActiveView: (view) => set({ activeView: view }),
  setIsOnline: (online) => set({ isOnline: online }),
  
  setIncidents: (incidents) => set({ incidents }),
  addIncident: (incident) => set((state) => {
    const existing = state.incidents.find(i => i.id === incident.id);
    if (existing) return state;
    return { incidents: [incident, ...state.incidents] }
  }),
  updateIncident: (id, updates) => {
    set((state) => ({
      incidents: state.incidents.map((inc) => 
        inc.id === id ? { ...inc, ...updates, updatedAt: new Date().toISOString() } : inc
      )
    }));
    fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error("Background updateIncident API failure:", err));
  },
  deleteIncident: (id) => {
    set((state) => ({
      incidents: state.incidents.filter((inc) => inc.id !== id)
    }));
    fetch(`/api/incidents/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Background deleteIncident API failure:", err));
  },
  
  setShelters: (shelters) => set({ shelters }),
  updateShelter: (id, updates) => set((state) => ({
    shelters: state.shelters.map((sh) => 
      sh.id === id ? { ...sh, ...updates } : sh
    )
  })),
  
  setHospitals: (hospitals) => set({ hospitals }),
  updateHospital: (id, updates) => set((state) => ({
    hospitals: state.hospitals.map((hosp) => 
      hosp.id === id ? { ...hosp, ...updates } : hosp
    )
  })),
  
  setReports: (reports) => set({ reports }),
  addReport: async (report) => {
    const { id, ...payload } = report;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save report to database');
      const data = await res.json();
      set((state) => ({
        reports: [data, ...state.reports]
      }));
    } catch (err) {
      console.error("Failed to add report to DB, saving locally:", err);
      set((state) => ({
        reports: [report, ...state.reports]
      }));
    }
  },
  setResources: (resources) => set({ resources }),
  setVolunteers: (volunteers) => set({ volunteers }),
  setNotifications: (notifications) => set({ notifications }),
  
  addToOfflineQueue: (incident) => set((state) => ({
    offlineQueue: [...state.offlineQueue, incident]
  })),
  clearOfflineQueue: () => set({ offlineQueue: [] })
}));
