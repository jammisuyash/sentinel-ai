import type { AuthSession, AuthUser, UserRole } from '../types';
import {
  signInWithSupabasePassword,
  signInWithSupabaseAnonymous,
  signInWithSupabaseGoogle,
  signOutSupabase,
  getSupabaseSession,
  getSupabaseClient,
  upsertUserProfile
} from '../lib/supabase';

const AUTH_STORAGE_KEY = 'sentinel-ai-auth-session';

// ============================================================
// LOCAL SESSION STORAGE
// ============================================================

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function normalizeRole(role?: string | null): UserRole {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'hospital':
      return 'hospital';
    case 'authority':
      return 'authority';
    case 'volunteer':
      return 'volunteer';
    case 'citizen':
    default:
      return 'citizen';
  }
}

function buildSession(user: AuthUser): AuthSession {
  return {
    token: `session-${Date.now()}`,
    user
  };
}

// ============================================================
// SIGN IN WITH EMAIL + PASSWORD (Supabase Auth)
// ============================================================

export async function signInLocal(email: string, password: string, name?: string, role?: UserRole): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim() || 'Citizen';
  const normalizedRole = normalizeRole(role);

  // Try Supabase Auth
  const supabaseSession = await signInWithSupabasePassword(normalizedEmail, password, normalizedName, normalizedRole);
  if (supabaseSession) {
    saveAuthSession(supabaseSession);
    return supabaseSession;
  }

  // Fallback: local-only session (no Supabase configured)
  const fallbackSession = buildSession({
    id: `local-${Date.now()}`,
    email: normalizedEmail,
    name: normalizedName,
    role: normalizedRole
  });
  saveAuthSession(fallbackSession);
  return fallbackSession;
}

// ============================================================
// SIGN IN ANONYMOUSLY
// ============================================================

export async function signInAnonymously(): Promise<AuthSession> {
  const supabaseSession = await signInWithSupabaseAnonymous();
  if (supabaseSession) {
    saveAuthSession(supabaseSession);
    return supabaseSession;
  }

  // Fallback
  const fallbackSession = buildSession({
    id: `anon-${Date.now()}`,
    email: `anon-${Date.now()}@sentinel.app`,
    name: 'Anonymous Citizen',
    role: 'citizen'
  });
  saveAuthSession(fallbackSession);
  return fallbackSession;
}

// ============================================================
// SIGN IN WITH GOOGLE (Supabase OAuth)
// ============================================================

export async function signInWithGoogle(): Promise<AuthSession> {
  const result = await signInWithSupabaseGoogle();
  // Google OAuth redirects the page, so we won't usually reach here
  // The session is picked up via initAuthListener on page load
  if (result) {
    saveAuthSession(result);
    return result;
  }

  // If Supabase not configured, fallback
  const fallbackSession = buildSession({
    id: `google-${Date.now()}`,
    email: 'google-user@sentinel.app',
    name: 'Google User',
    role: 'citizen'
  });
  saveAuthSession(fallbackSession);
  return fallbackSession;
}

// ============================================================
// SIGN OUT
// ============================================================

export async function signOutLocal() {
  await signOutSupabase();
  saveAuthSession(null);
}

// ============================================================
// GET CURRENT ROLE
// ============================================================

export function getAuthRole(): UserRole {
  return getStoredAuthSession()?.user.role || 'citizen';
}

// ============================================================
// AUTH STATE LISTENER (Supabase onAuthStateChange)
// ============================================================

export function initAuthListener(onSessionChange: (session: AuthSession | null) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Ensure user profile exists in our users table
      const profile = await upsertUserProfile(session.user.id, {
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Citizen',
        role: (session.user.user_metadata?.role as UserRole) || 'citizen'
      });

      const authSession: AuthSession = {
        token: session.access_token,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.name || session.user.user_metadata?.name || 'Citizen',
          role: (profile?.role as UserRole) || 'citizen',
          avatarUrl: session.user.user_metadata?.avatar_url
        }
      };
      saveAuthSession(authSession);
      onSessionChange(authSession);
    } else if (event === 'SIGNED_OUT') {
      saveAuthSession(null);
      onSessionChange(null);
    }
  });

  return () => subscription.unsubscribe();
}

// ============================================================
// RESTORE SESSION ON LOAD
// ============================================================

export async function restoreSession(): Promise<AuthSession | null> {
  // Try Supabase session first
  const supabaseSession = await getSupabaseSession();
  if (supabaseSession) {
    saveAuthSession(supabaseSession);
    return supabaseSession;
  }

  // Fall back to stored session
  return getStoredAuthSession();
}
