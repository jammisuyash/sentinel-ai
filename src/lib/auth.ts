import type { UserProfile, UserRole } from '../types';

const AUTH_STORAGE_KEY = 'sentinel-ai-auth-session';
const USERS_STORAGE_KEY = 'sentinel-ai-auth-users';

export interface AuthSession {
  token: string;
  user: UserProfile;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
}

function readStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

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

function hashPassword(password: string) {
  return btoa(password).replace(/=+/g, '');
}

export async function signInLocal(email: string, password: string, name?: string): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim() || 'Commander';
  const existingUsers = readStoredUsers();
  const existingUser = existingUsers.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    if (existingUser.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid credentials');
    }
    const session = {
      token: `session-${Date.now()}`,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name || normalizedName,
        role: (existingUser.role || 'authority') as UserRole
      }
    };
    saveAuthSession(session);
    return session;
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    name: normalizedName,
    role: 'authority' as UserRole,
    passwordHash: hashPassword(password)
  };

  writeStoredUsers([...existingUsers, newUser]);
  const session = {
    token: `session-${Date.now()}`,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole
    }
  };
  saveAuthSession(session);
  return session;
}

export function signOutLocal() {
  saveAuthSession(null);
}
