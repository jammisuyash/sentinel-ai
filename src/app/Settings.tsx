import React, { useEffect, useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  Database, 
  Cpu, 
  Terminal, 
  User,
  ShieldCheck,
  LogOut,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getStoredAuthSession, saveAuthSession, signInLocal, signInAnonymously, signInWithGoogle, signOutLocal } from '../services/auth';

export default function Settings() {
  const { isOnline, setIsOnline } = useCommandStore();
  const [commanderName, setCommanderName] = useState('Rachel Stone');
  const [simulationSpeed, setSimulationSpeed] = useState('1.0');
  const [authEmail, setAuthEmail] = useState('commander@sentinel.ai');
  const [authPassword, setAuthPassword] = useState('sentinel123');
  const [authMessage, setAuthMessage] = useState('Use your local command sign-in to persist your session.');
  const [authUser, setAuthUser] = useState(getStoredAuthSession()?.user ?? null);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SENTINEL STAGING CORE: v1.0.0 init successful`,
    `[${new Date().toLocaleTimeString()}] SUPABASE CHANNEL: Active, awaiting sync telemetry`,
    `[${new Date().toLocaleTimeString()}] GEOLOCATION STAGE: Ready, OSM Tile provider integrated`
  ]);

  useEffect(() => {
    const session = getStoredAuthSession();
    if (session) {
      setAuthUser(session.user);
      setCommanderName(session.user.name);
    }
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleToggleNetwork = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    addLog(`NETWORK CHANNEL TRIGGERED: Toggled to ${nextState ? 'ONLINE (Supabase Active)' : 'OFFLINE (Local Emulation Queue)'}`);
  };

  const handlePurgeLogs = () => {
    setLogs([`[${new Date().toLocaleTimeString()}] DIAGNOSTIC TERMINAL CLEARED`]);
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const session = await signInLocal(authEmail, authPassword, commanderName);
      setAuthUser(session.user);
      setAuthMessage(`Signed in as ${session.user.name}`);
      addLog(`AUTH SESSION: ${session.user.name} authenticated locally`);
    } catch (error: any) {
      setAuthMessage(error.message || 'Sign-in failed');
      addLog(`AUTH SESSION: ${error.message || 'Sign-in failed'}`);
    }
  };

  const handleSignOut = () => {
    signOutLocal();
    setAuthUser(null);
    setAuthMessage('Signed out from local command session.');
    addLog('AUTH SESSION: Local command session cleared');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in" id="settings-view-container">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          Command Settings & Terminal Diagnostics
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
          Configure physical operations profiles, toggle local telemetry queues, and review system registries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: System Toggles */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Networking & Database */}
          <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2.5 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              Database Sync & Network Channel
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-900 rounded-md">
                <div className="flex items-start gap-3">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  )}
                  <div>
                    <h4 className="font-sans font-semibold text-xs text-slate-200">
                      {isOnline ? 'Online Sync Mode' : 'Offline Emulation Mode'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isOnline 
                        ? 'Connected directly to the real-time Supabase database streams.' 
                        : 'Simulating severed network. Dispatches queued locally.'
                      }
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleToggleNetwork}
                  className={`px-3 py-1.5 font-mono text-[10px] rounded border uppercase font-bold cursor-pointer transition-all ${
                    isOnline 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {isOnline ? 'Sever Connection' : 'Restore Sync'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded">
                  <span className="text-slate-500 text-[10px] block uppercase">Network Host IP</span>
                  <span className="text-slate-200 mt-1 block">0.0.0.0 (Port 3000)</span>
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded">
                  <span className="text-slate-500 text-[10px] block uppercase">Sync Status</span>
                  <span className="text-emerald-400 mt-1 block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    REGISTERED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Command Profile */}
          <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2.5 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Incident Commander Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Commander Staging Handle</label>
                <input 
                  type="text"
                  value={commanderName}
                  onChange={(e) => {
                    setCommanderName(e.target.value);
                    addLog(`COMMAND HANDLE UPDATE: Registered commander identifier as "${e.target.value}"`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Simulation Speed Coefficient</label>
                <select 
                  value={simulationSpeed}
                  onChange={(e) => {
                    setSimulationSpeed(e.target.value);
                    addLog(`COEFFICIENT ADJUSTED: Simulation refresh velocity scaled to ${e.target.value}x`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-red-500"
                >
                  <option value="0.5">0.5x (Tactical Planning)</option>
                  <option value="1.0">1.0x (Standard real-time)</option>
                  <option value="2.0">2.0x (Accelerated Drill)</option>
                  <option value="5.0">5.0x (Rapid telemetry stress test)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: AI Engine Diagnostics */}
          <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2.5 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-400 animate-pulse" />
              Tactical AI Model Parameters
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500">Active LLM Core</span>
                <span className="text-slate-200 font-bold">Gemini 3.5 Flash (Production)</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500">Prompt System Directive</span>
                <span className="text-slate-400 text-[10px] truncate max-w-xs">Elite tactical incident dispatch AI commander</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">API Key Encryption</span>
                <span className="text-emerald-400">SECURED (Server-side environment hidden)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Local Auth */}
          <div className="bg-slate-950 border border-slate-900 rounded-lg p-5">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2.5 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Command Access & Session
            </h3>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex items-center justify-between rounded border border-slate-900 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-400">
                <span>{authUser ? `Signed in as ${authUser.name}` : 'No active command session'}</span>
                <span className="text-emerald-400">{authUser ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="commander@sentinel.ai"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="password"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="tactical" size="sm" leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                  {authUser ? 'Refresh Session' : 'Sign In'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={async () => {
                  try {
                    const session = await signInAnonymously();
                    setAuthUser(session.user);
                    setAuthMessage('Signed in anonymously');
                  } catch (error: any) {
                    setAuthMessage(error.message || 'Anonymous sign-in failed');
                  }
                }}>
                  Anonymous
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={async () => {
                  try {
                    const session = await signInWithGoogle();
                    setAuthUser(session.user);
                    setAuthMessage(`Signed in as ${session.user.name}`);
                  } catch (error: any) {
                    setAuthMessage(error.message || 'Google sign-in failed');
                  }
                }}>
                  Google
                </Button>
                {authUser && (
                  <Button type="button" variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                    Sign Out
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">{authMessage}</p>
            </form>
          </div>
        </div>

        {/* Right Side: Diagnostics Console */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 flex flex-col h-[520px]">
          <div className="border-b border-slate-900 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Sentinel Log Terminal
            </h3>
            <button 
              onClick={handlePurgeLogs}
              className="font-mono text-[9px] text-slate-500 hover:text-slate-300 uppercase cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Scrolling log lines */}
          <div className="flex-1 bg-slate-950 border border-slate-900 p-3.5 rounded font-mono text-[10px] text-slate-300 overflow-y-auto leading-relaxed space-y-2 select-none">
            {logs.map((log, i) => (
              <div key={i} className="border-b border-slate-900/30 pb-1 text-slate-300">
                <span className="text-emerald-500 mr-1">&gt;</span>
                {log}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900 text-[9px] font-mono text-slate-500 flex justify-between uppercase">
            <span>Terminal: OK</span>
            <span>OSM Buffer: CACHED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
