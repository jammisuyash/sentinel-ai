import { useEffect, useRef } from 'react';
import { subscribeToTable, unsubscribeChannel } from '../lib/supabase';
import { useCommandStore } from '../store/useCommandStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook that subscribes to Supabase Realtime changes for key tables
 * and updates the Zustand store automatically.
 */
export function useRealtimeSubscriptions() {
  const channelsRef = useRef<(RealtimeChannel | null)[]>([]);

  useEffect(() => {
    const channels: (RealtimeChannel | null)[] = [];

    // Subscribe to incidents
    const incidentsChannel = subscribeToTable('incidents', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.incidents.find(i => i.id === payload.new.id);
        if (!existing) {
          store.setIncidents([payload.new, ...store.incidents]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        store.setIncidents(
          store.incidents.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i)
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        store.setIncidents(store.incidents.filter(i => i.id !== payload.old.id));
      }
    });
    channels.push(incidentsChannel);

    // Subscribe to volunteers
    const volunteersChannel = subscribeToTable('volunteers', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.volunteers.find(v => v.id === payload.new.id);
        if (!existing) {
          store.setVolunteers([payload.new, ...store.volunteers]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        store.setVolunteers(
          store.volunteers.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v)
        );
      }
    });
    channels.push(volunteersChannel);

    // Subscribe to shelters
    const sheltersChannel = subscribeToTable('shelters', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.shelters.find(s => s.id === payload.new.id);
        if (!existing) {
          store.setShelters([payload.new, ...store.shelters]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        store.setShelters(
          store.shelters.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
        );
      }
    });
    channels.push(sheltersChannel);

    // Subscribe to hospitals
    const hospitalsChannel = subscribeToTable('hospitals', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.hospitals.find(h => h.id === payload.new.id);
        if (!existing) {
          store.setHospitals([payload.new, ...store.hospitals]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        store.setHospitals(
          store.hospitals.map(h => h.id === payload.new.id ? { ...h, ...payload.new } : h)
        );
      }
    });
    channels.push(hospitalsChannel);

    // Subscribe to notifications
    const notificationsChannel = subscribeToTable('notifications', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.notifications.find(n => n.id === payload.new.id);
        if (!existing) {
          store.setNotifications([payload.new, ...store.notifications]);
        }
      }
    });
    channels.push(notificationsChannel);

    // Subscribe to resources
    const resourcesChannel = subscribeToTable('resources', (payload) => {
      const store = useCommandStore.getState();
      if (payload.eventType === 'INSERT' && payload.new) {
        const existing = store.resources.find(r => r.id === payload.new.id);
        if (!existing) {
          store.setResources([payload.new, ...store.resources]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        store.setResources(
          store.resources.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
        );
      }
    });
    channels.push(resourcesChannel);

    channelsRef.current = channels;

    return () => {
      channels.forEach(ch => unsubscribeChannel(ch));
    };
  }, []);
}
