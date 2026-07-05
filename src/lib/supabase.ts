import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  Incident,
  Shelter,
  Hospital,
  Volunteer,
  Assignment,
  SituationReport,
  NotificationItem,
  UserProfile,
  AuthSession,
  UserRole
} from '../types';

// ============================================================
// SUPABASE CLIENT SINGLETON
// ============================================================

let supabaseClient: SupabaseClient | null = null;

function getRuntimeEnvValue(key: string) {
  const viteEnv = typeof import.meta !== 'undefined' && typeof (import.meta as any).env !== 'undefined'
    ? (import.meta as any).env
    : undefined;
  const processEnv = typeof process !== 'undefined' ? process.env : undefined;
  return viteEnv?.[key] ?? processEnv?.[key];
}

export function isSupabaseConfigured() {
  const url = getRuntimeEnvValue('VITE_SUPABASE_URL') || getRuntimeEnvValue('SUPABASE_URL');
  const key = getRuntimeEnvValue('VITE_SUPABASE_ANON_KEY') || getRuntimeEnvValue('SUPABASE_ANON_KEY') || getRuntimeEnvValue('SUPABASE_SERVICE_ROLE_KEY');
  return Boolean(url && key);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = getRuntimeEnvValue('VITE_SUPABASE_URL') || getRuntimeEnvValue('SUPABASE_URL');
  const key = getRuntimeEnvValue('VITE_SUPABASE_ANON_KEY') || getRuntimeEnvValue('SUPABASE_ANON_KEY') || getRuntimeEnvValue('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    console.warn('Supabase credentials not configured.');
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('Supabase client initialized.');
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Legacy compat - some files call initializeSupabase
export async function initializeSupabase() {
  return getSupabaseClient();
}

// ============================================================
// KEY TRANSFORM HELPERS
// ============================================================

function toSnakeCaseKey(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function transformKeys(value: unknown, transform: (key: string) => string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, transform));
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[transform(key)] = transformKeys(item, transform);
    }
    return result;
  }
  return value;
}

function toSnakeCaseRecord<T = Record<string, unknown>>(value: T): Record<string, unknown> {
  return transformKeys(value, toSnakeCaseKey) as Record<string, unknown>;
}

function toCamelCaseRecord<T = Record<string, unknown>>(value: unknown): T {
  const convert = (key: string) => key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
  return transformKeys(value, convert) as T;
}

// ============================================================
// RECORD TRANSFORMERS
// ============================================================

function fromIncidentRecord(record: Record<string, unknown>): Incident {
  return toCamelCaseRecord<Incident>(record);
}

function fromShelterRecord(record: Record<string, unknown>): Shelter {
  return toCamelCaseRecord<Shelter>(record);
}

function fromHospitalRecord(record: Record<string, unknown>): Hospital {
  return toCamelCaseRecord<Hospital>(record);
}

function fromVolunteerRecord(record: Record<string, unknown>): Volunteer {
  return toCamelCaseRecord<Volunteer>(record);
}

function fromAssignmentRecord(record: Record<string, unknown>): Assignment {
  return toCamelCaseRecord<Assignment>(record);
}

function fromReportRecord(record: Record<string, unknown>): SituationReport {
  return toCamelCaseRecord<SituationReport>(record);
}

function fromNotificationRecord(record: Record<string, unknown>): NotificationItem {
  return toCamelCaseRecord<NotificationItem>(record);
}

function fromUserRecord(record: Record<string, unknown>): UserProfile {
  return toCamelCaseRecord<UserProfile>(record);
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  status: 'available' | 'deployed' | 'maintenance';
}

function fromResourceRecord(record: Record<string, unknown>): Resource {
  return toCamelCaseRecord<Resource>(record);
}

// ============================================================
// USERS CRUD
// ============================================================

export async function getUserProfilesCollection(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return (data || []).map((item) => fromUserRecord(item as Record<string, unknown>));
}

export async function createUserProfileInFirestore(user: Omit<UserProfile, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('users').insert([toSnakeCaseRecord({ ...user, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding user profile:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function getUserByAuthId(authId: string): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('users').select('*').eq('auth_id', authId).single();
  if (error) return null;
  return data ? fromUserRecord(data as Record<string, unknown>) : null;
}

export async function upsertUserProfile(authId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const existing = await getUserByAuthId(authId);
  if (existing) {
    const { data, error } = await client.from('users')
      .update(toSnakeCaseRecord({ ...profile, updatedAt: new Date().toISOString() }))
      .eq('auth_id', authId)
      .select('*')
      .single();
    if (error) {
      console.error('Error updating user profile:', error);
      return existing;
    }
    return data ? fromUserRecord(data as Record<string, unknown>) : existing;
  }

  const { data, error } = await client.from('users')
    .insert([toSnakeCaseRecord({ ...profile, authId, createdAt: new Date().toISOString() })])
    .select('*')
    .single();
  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
  return data ? fromUserRecord(data as Record<string, unknown>) : null;
}

// ============================================================
// INCIDENTS CRUD
// ============================================================

export async function getIncidentsCollection(): Promise<Incident[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('incidents').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching incidents:', error);
    return [];
  }
  return (data || []).map((item) => fromIncidentRecord(item as Record<string, unknown>));
}

export async function addIncidentToFirestore(incident: Omit<Incident, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const payload = toSnakeCaseRecord(incident);
  
  // Resolve reporter_id (which is usually the auth.user.id) to the public.users.id
  if (payload.reporter_id) {
    const { data: userData } = await client
      .from('users')
      .select('id')
      .eq('auth_id', payload.reporter_id)
      .single();
      
    if (userData) {
      payload.reporter_id = userData.id;
    } else {
      // If we can't find a matching public user, nullify it to avoid FK constraint errors
      payload.reporter_id = null;
    }
  }

  const { data, error } = await client.from('incidents').insert([payload]).select('id').single();
  
  if (error) {
    console.error('Error adding incident:', error.message, error.details, error.hint);
    return null;
  }
  return data?.id ?? null;
}

export async function updateIncidentInFirestore(id: string, updates: Partial<Incident>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const payload = toSnakeCaseRecord({ ...updates, updatedAt: new Date().toISOString() });
  const { error } = await client.from('incidents').update(payload).eq('id', id);
  if (error) {
    console.error('Error updating incident:', error);
    return false;
  }
  return true;
}

export async function deleteIncidentFromFirestore(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('incidents').delete().eq('id', id);
  if (error) {
    console.error('Error deleting incident:', error);
    return false;
  }
  return true;
}

// ============================================================
// HOSPITALS CRUD
// ============================================================

export async function getHospitalsCollection(): Promise<Hospital[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('hospitals').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
  return (data || []).map((item) => fromHospitalRecord(item as Record<string, unknown>));
}

export async function addHospitalToSupabase(hospital: Omit<Hospital, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('hospitals').insert([toSnakeCaseRecord({ ...hospital, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding hospital:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateHospitalInFirestore(id: string, updates: Partial<Hospital>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('hospitals').update(toSnakeCaseRecord(updates)).eq('id', id);
  if (error) {
    console.error('Error updating hospital:', error);
    return false;
  }
  return true;
}

// ============================================================
// SHELTERS CRUD
// ============================================================

export async function getSheltersCollection(): Promise<Shelter[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('shelters').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching shelters:', error);
    return [];
  }
  return (data || []).map((item) => fromShelterRecord(item as Record<string, unknown>));
}

export async function addShelterToSupabase(shelter: Omit<Shelter, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('shelters').insert([toSnakeCaseRecord({ ...shelter, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding shelter:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateShelterInFirestore(id: string, updates: Partial<Shelter>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('shelters').update(toSnakeCaseRecord(updates)).eq('id', id);
  if (error) {
    console.error('Error updating shelter:', error);
    return false;
  }
  return true;
}

// ============================================================
// RESOURCES CRUD
// ============================================================

export async function getResourcesCollection(): Promise<Resource[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('resources').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
  return (data || []).map((item) => fromResourceRecord(item as Record<string, unknown>));
}

export async function addResourceToFirestore(resource: Omit<Resource, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('resources').insert([toSnakeCaseRecord({ ...resource, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding resource:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateResourceInFirestore(id: string, updates: Partial<Resource>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('resources').update(toSnakeCaseRecord(updates)).eq('id', id);
  if (error) {
    console.error('Error updating resource:', error);
    return false;
  }
  return true;
}

// ============================================================
// VOLUNTEERS CRUD
// ============================================================

export async function getVolunteersCollection(): Promise<Volunteer[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('volunteers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching volunteers:', error);
    return [];
  }
  return (data || []).map((item) => fromVolunteerRecord(item as Record<string, unknown>));
}

export async function addVolunteerToFirestore(volunteer: Omit<Volunteer, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('volunteers').insert([toSnakeCaseRecord({ ...volunteer, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding volunteer:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateVolunteerInFirestore(id: string, updates: Partial<Volunteer>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('volunteers').update(toSnakeCaseRecord(updates)).eq('id', id);
  if (error) {
    console.error('Error updating volunteer:', error);
    return false;
  }
  return true;
}

// ============================================================
// ASSIGNMENTS CRUD
// ============================================================

export async function getAssignmentsCollection(): Promise<Assignment[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('assignments').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
  return (data || []).map((item) => fromAssignmentRecord(item as Record<string, unknown>));
}

export async function addAssignment(assignment: Omit<Assignment, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('assignments').insert([toSnakeCaseRecord({ ...assignment, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding assignment:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('assignments').update(toSnakeCaseRecord({ ...updates, updatedAt: new Date().toISOString() })).eq('id', id);
  if (error) {
    console.error('Error updating assignment:', error);
    return false;
  }
  return true;
}

// ============================================================
// REPORTS CRUD
// ============================================================

export async function getReportsCollection(): Promise<SituationReport[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('reports').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  return (data || []).map((item) => fromReportRecord(item as Record<string, unknown>));
}

export async function addReportToFirestore(report: Omit<SituationReport, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { id, ...cleanReport } = report as any;
  const { data, error } = await client.from('reports').insert([toSnakeCaseRecord({ ...cleanReport, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding report:', error);
    return null;
  }
  return data?.id ?? null;
}

// ============================================================
// NOTIFICATIONS CRUD
// ============================================================

export async function getNotificationsCollection(): Promise<NotificationItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('notifications').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []).map((item) => fromNotificationRecord(item as Record<string, unknown>));
}

export async function addNotificationToFirestore(notification: Omit<NotificationItem, 'id'>): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('notifications').insert([toSnakeCaseRecord({ ...notification, createdAt: new Date().toISOString() })]).select('id').single();
  if (error) {
    console.error('Error adding notification:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function updateNotificationInFirestore(id: string, updates: Partial<NotificationItem>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('notifications').update(toSnakeCaseRecord(updates)).eq('id', id);
  if (error) {
    console.error('Error updating notification:', error);
    return false;
  }
  return true;
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function signInWithSupabasePassword(email: string, password: string, name?: string, role?: UserRole): Promise<AuthSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Try sign in first
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      // If not found, sign up
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: { data: { name, role: role || 'citizen' } }
      });
      if (signUpError || !signUpData.user) {
        throw signUpError || new Error('Unable to create account');
      }

      // Create user profile in users table
      await upsertUserProfile(signUpData.user.id, {
        email: signUpData.user.email || email,
        name: name || 'Citizen',
        role: role || 'citizen'
      });

      return {
        token: signUpData.session?.access_token || `supabase-${Date.now()}`,
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email || email,
          name: signUpData.user.user_metadata?.name || name || 'Citizen',
          role: (signUpData.user.user_metadata?.role as UserRole) || role || 'citizen'
        }
      };
    }

    // Login success - ensure profile exists
    if (data.user) {
      const profile = await upsertUserProfile(data.user.id, {
        email: data.user.email || email,
        name: data.user.user_metadata?.name || name || 'Citizen',
        role: (data.user.user_metadata?.role as UserRole) || role || 'citizen'
      });

      return {
        token: data.session?.access_token || `supabase-${Date.now()}`,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.name || data.user.user_metadata?.name || name || 'Citizen',
          role: (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'citizen'
        }
      };
    }

    return null;
  } catch (error) {
    console.warn('Supabase email auth error:', error);
    return null;
  }
}

export async function signInWithSupabaseAnonymous(): Promise<AuthSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    
    if (data.user) {
      await upsertUserProfile(data.user.id, {
        email: `anon-${data.user.id.slice(0, 8)}@sentinel.app`,
        name: 'Anonymous Citizen',
        role: 'citizen'
      });
    }

    return {
      token: data.session?.access_token || `supabase-anon-${Date.now()}`,
      user: {
        id: data.user?.id || `anon-${Date.now()}`,
        email: data.user?.email || `anon-${Date.now()}@sentinel.app`,
        name: 'Anonymous Citizen',
        role: 'citizen'
      }
    };
  } catch (error) {
    console.warn('Supabase anonymous auth failed:', error);
    return null;
  }
}

export async function signInWithSupabaseGoogle(): Promise<AuthSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    // OAuth redirects - this won't return a session immediately
    // The session will be picked up on redirect via onAuthStateChange
    return null;
  } catch (error) {
    console.warn('Google OAuth sign-in failed:', error);
    return null;
  }
}

export async function signOutSupabase() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getSupabaseSession(): Promise<AuthSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;

    const profile = await getUserByAuthId(session.user.id);

    return {
      token: session.access_token,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.name || session.user.user_metadata?.name || 'Citizen',
        role: (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'citizen'
      }
    };
  } catch {
    return null;
  }
}

// ============================================================
// SUPABASE STORAGE
// ============================================================

export async function uploadToStorage(file: File, path: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from('incident-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = client.storage
      .from('incident-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload to storage failed:', error);
    return null;
  }
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export function subscribeToTable(
  table: string,
  callback: (payload: { eventType: string; new: any; old: any }) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel(`realtime-${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new ? toCamelCaseRecord(payload.new) : null,
          old: payload.old ? toCamelCaseRecord(payload.old) : null
        });
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeChannel(channel: RealtimeChannel | null) {
  if (!channel) return;
  const client = getSupabaseClient();
  if (!client) return;
  client.removeChannel(channel);
}
