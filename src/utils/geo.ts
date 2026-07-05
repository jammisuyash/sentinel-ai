import { Location } from '../types';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 */
export function calculateDistance(loc1: Location, loc2: Location, unit: 'km' | 'miles' = 'km'): number {
  const R = unit === 'km' ? 6371 : 3958.8; // Earth's radius in km or miles
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
}

/**
 * Finds the nearest items (hospitals, shelters, etc.) to a given incident location,
 * sorted by proximity.
 */
export function findNearest<T extends { id: string; location: Location }>(
  referenceLocation: Location,
  items: T[],
  limit: number = 3
): (T & { distance: number })[] {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistance(referenceLocation, item.location),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Safely requests the user's current GPS geolocation
 */
export function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}
