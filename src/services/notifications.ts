export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export function showBrowserNotification(title: string, message: string) {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  }
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}
