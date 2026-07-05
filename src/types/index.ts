export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentType = 'fire' | 'flood' | 'cyclone' | 'earthquake' | 'medical' | 'road_accident' | 'building_collapse' | 'hurricane' | 'other';

export type IncidentStatus = 'reported' | 'dispatching' | 'active' | 'resolved';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface AIAnalysis {
  severity: SeverityLevel;
  category: string;
  summary: string;
  recommendedActions: string[];
  requiredResources: string[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType | string;
  severity: SeverityLevel | string;
  status: IncidentStatus | string;
  location: Location;
  reportedBy: string;
  reporterId?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIAnalysis;
  isOffline?: boolean;

  // Extended fields
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  imageUrl?: string;
  voiceUrl?: string;
  attachments?: string[];
  aiSummary?: string;
  recommendedHospital?: string;
  recommendedShelter?: string;
  recommendedResources?: string[];
  evacuationAdvice?: string;
  priority?: string;
  confidenceScore?: number;
  emergencyInstructions?: string;
  hospitalRecommendation?: string;
  shelterRecommendation?: string;
  foodAvailability?: string;
  medicalAvailability?: string;
  safeRoute?: string;
  estimatedVictims?: number;
  estimatedRescueTime?: string;
  nearestFoodCamp?: string;
  nearestWaterSource?: string;

  // Assignment tracking
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
}

export interface Shelter {
  id: string;
  name: string;
  location: Location;
  capacity: number;
  occupied: number;
  status: 'open' | 'full' | 'closed';
  phone?: string;
  amenities?: string[];
  
  // Specific required amenities indicators
  foodAvailable?: boolean;
  drinkingWater?: boolean;
  medicalAssistance?: boolean;
  washrooms?: boolean;
  generatorStatus?: string;
  distance?: number;
  travelTime?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: Location;
  bedsTotal: number;
  bedsOccupied: number;
  icuBedsTotal?: number;
  icuBedsOccupied?: number;
  oxygenAvailable?: boolean;
  doctorsAvailable?: number;
  bloodAvailability?: 'Low' | 'Medium' | 'High';
  ambulancesAvailable?: number;
  status: 'normal' | 'busy' | 'critical';
  phone?: string;
  specialties?: string[];
  
  // Specific required hospital metadata
  distance?: number;
  travelTime?: string;
  openStatus?: string;
}

export interface SituationReport {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
  category: 'sitrep' | 'briefing' | 'alert';
  incidentId?: string;
  pdfUrl?: string;
  metadata?: Record<string, unknown>;
}

export type UserRole = 'citizen' | 'volunteer' | 'hospital' | 'authority' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface UserProfile extends AuthUser {
  phone?: string;
  location?: Location;
  authId?: string;
}

export interface Volunteer {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'volunteer' | 'medical' | 'logistics';
  location: Location;
  status: 'active' | 'available' | 'busy' | 'offline';
  skills?: string[];
  currentIncidentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  incidentId: string;
  volunteerId: string;
  assignedBy?: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  proofUrl?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  read: boolean;
  userId?: string;
  incidentId?: string;
}

export interface EmergencyResourceItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  status: 'available' | 'deployed' | 'maintenance';
  location?: Location;
  assignedIncidentId?: string;
}

export type ActiveView = 'landing' | 'dashboard' | 'incident-report' | 'live-map' | 'hospitals' | 'shelters' | 'reports' | 'settings';

export interface ExtraEmergencyResource {
  id: string;
  name: string;
  type: 'police' | 'fire' | 'blood_bank' | 'food' | 'water' | 'medical_camp' | 'pharmacy';
  location: Location;
  distance?: number;
  phone?: string;
  status?: string;
  details?: string;
}
