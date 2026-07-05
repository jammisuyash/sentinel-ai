import React from 'react';
import { useCommandStore } from './store/useCommandStore';
import Landing from './app/Landing';
import Dashboard from './app/Dashboard';
import IncidentReport from './app/IncidentReport';
import LiveMap from './app/LiveMap';
import Hospitals from './app/Hospitals';
import Shelters from './app/Shelters';
import Reports from './app/Reports';
import Settings from './app/Settings';
import AuthScreen from './app/AuthScreen';
import CitizenDashboard from './app/CitizenDashboard';
import VolunteerDashboard from './app/VolunteerDashboard';
import HospitalDashboard from './app/HospitalDashboard';
import { restoreSession } from './services/auth';
import { useRealtimeSubscriptions } from './hooks/useRealtime';

export default function App() {
  const activeView = useCommandStore((state) => state.activeView);
  const isOnline = useCommandStore((state) => state.isOnline);
  const setIsOnline = useCommandStore((state) => state.setIsOnline);
  const setUserLocation = useCommandStore((state) => state.setUserLocation);
  const authUser = useCommandStore((state) => state.authUser);
  const setAuthUser = useCommandStore((state) => state.setAuthUser);
  const [isRestoring, setIsRestoring] = React.useState(true);
  
  // Initialize realtime subscriptions
  useRealtimeSubscriptions();

  // Sync online status changes
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  React.useEffect(() => {
    restoreSession().then((session) => {
      if (session) {
        setAuthUser(session.user);
      }
      setIsRestoring(false);
    }).catch(() => setIsRestoring(false));
  }, [setAuthUser]);

  React.useEffect(() => {
    const refreshLoop = window.setInterval(() => {
      void useCommandStore.getState().fetchIncidents();
    }, 15000);

    return () => window.clearInterval(refreshLoop);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser.');
      useCommandStore.setState({ locatingError: 'Geolocation is not supported by your browser.' });
      return;
    }

    useCommandStore.setState({ isLocating: true, locatingError: null });

    // Capture initial position with high accuracy — this triggers full facility fetch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords); // triggers refreshNearbyFacilities
        useCommandStore.setState({ isLocating: false });
      },
      (error) => {
        console.error('Error getting initial location:', error);
        useCommandStore.setState({ 
          isLocating: false, 
          locatingError: error.message || 'Location access denied. Click on the map to set your location manually.' 
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position continuously — only update marker position, don't re-fetch facilities
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // Directly update the store without triggering refreshNearbyFacilities
        useCommandStore.setState({ userLocation: coords });
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [setUserLocation]);

  const renderView = () => {
    // RBAC Routing overriding activeView for specific isolated dashboards
    if (authUser?.role === 'citizen') {
      return <CitizenDashboard />;
    }
    if (authUser?.role === 'volunteer') {
      return <VolunteerDashboard />;
    }
    if (authUser?.role === 'hospital') {
      return <HospitalDashboard />;
    }

    // Default Authority/Admin behavior (the "original" app functionality)
    switch (activeView) {
      case 'landing':
        return <Landing />;
      case 'dashboard':
        return <Dashboard />;
      case 'incident-report':
        return <IncidentReport />;
      case 'live-map':
        return <LiveMap />;
      case 'hospitals':
        return <Hospitals />;
      case 'shelters':
        return <Shelters />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Landing />;
    }
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-slate-500">
        INITIALIZING CORE PROTOCOLS...
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar for Global Status (Online/Offline) */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-sans font-semibold tracking-wider text-sm uppercase text-slate-200">
            Sentinel AI Command System
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
          <span className="text-xs font-mono uppercase text-slate-400">
            {isOnline ? 'Network Online' : 'Network Offline (Local Emulation Mode)'}
          </span>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {renderView()}
      </main>

      {/* Global Bottom Navigation bar helper for step-by-step review (Admins only) */}
      {(authUser?.role === 'admin' || authUser?.role === 'authority') && (
        <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 flex flex-wrap justify-between items-center gap-4 text-xs font-mono text-slate-500">
          <div>Sentinel AI Command Center v1.0.0</div>
          <div className="flex gap-4">
            <button onClick={() => useCommandStore.getState().setActiveView('landing')} className={`hover:text-red-400 uppercase ${activeView === 'landing' ? 'text-red-500 font-bold' : ''}`}>Portal</button>
            <button onClick={() => useCommandStore.getState().setActiveView('dashboard')} className={`hover:text-red-400 uppercase ${activeView === 'dashboard' ? 'text-red-500 font-bold' : ''}`}>Dashboard</button>
            <button onClick={() => useCommandStore.getState().setActiveView('live-map')} className={`hover:text-red-400 uppercase ${activeView === 'live-map' ? 'text-red-500 font-bold' : ''}`}>Live Map</button>
            <button onClick={() => useCommandStore.getState().setActiveView('hospitals')} className={`hover:text-red-400 uppercase ${activeView === 'hospitals' ? 'text-red-500 font-bold' : ''}`}>Hospitals</button>
            <button onClick={() => useCommandStore.getState().setActiveView('shelters')} className={`hover:text-red-400 uppercase ${activeView === 'shelters' ? 'text-red-500 font-bold' : ''}`}>Shelters</button>
            <button onClick={() => useCommandStore.getState().setActiveView('reports')} className={`hover:text-red-400 uppercase ${activeView === 'reports' ? 'text-red-500 font-bold' : ''}`}>Reports</button>
            <button onClick={() => useCommandStore.getState().setActiveView('settings')} className={`hover:text-red-400 uppercase ${activeView === 'settings' ? 'text-red-500 font-bold' : ''}`}>Settings</button>
          </div>
        </footer>
      )}
    </div>
  );
}
