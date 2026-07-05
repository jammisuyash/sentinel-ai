import { Incident } from '../types';

const OFFLINE_INCIDENTS_KEY = 'sentinel_offline_incidents';

/**
 * Saves an incident report to local storage for offline queueing
 */
export function saveOfflineIncident(incident: Incident): void {
  try {
    const existing = getOfflineIncidents();
    existing.push(incident);
    localStorage.setItem(OFFLINE_INCIDENTS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save incident to offline local storage:', error);
  }
}

/**
 * Retrieves all offline queued incident reports
 */
export function getOfflineIncidents(): Incident[] {
  try {
    const data = localStorage.getItem(OFFLINE_INCIDENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve incidents from offline local storage:', error);
    return [];
  }
}

/**
 * Clears the offline incident reports queue
 */
export function clearOfflineIncidents(): void {
  try {
    localStorage.removeItem(OFFLINE_INCIDENTS_KEY);
  } catch (error) {
    console.error('Failed to clear offline incident queue:', error);
  }
}

/**
 * Register online/offline status listeners
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
