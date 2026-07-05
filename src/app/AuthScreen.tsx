import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { ShieldAlert, Activity, User, Building2, HeartPulse, Terminal, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { signInLocal, signInAnonymously } from '../services/auth';
import type { UserRole } from '../types';

export default function AuthScreen() {
  const { setAuthUser } = useCommandStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('sentinel123'); // Default for ease of testing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (selectedRole !== 'citizen' && !email.trim()) {
      setError('Email is required for professional roles.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (selectedRole === 'citizen' && !email) {
        // Fast track citizen anon login if no email provided
        const session = await signInAnonymously();
        session.user.name = name;
        session.user.role = 'citizen';
        setAuthUser(session.user);
      } else {
        const fallbackEmail = email || `user-${Date.now()}@sentinel.app`;
        const session = await signInLocal(fallbackEmail, password, name, selectedRole);
        setAuthUser(session.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { id: UserRole; title: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'citizen', title: 'Citizen', icon: <User className="w-5 h-5" />, desc: 'Report incidents & get live help updates' },
    { id: 'volunteer', title: 'Volunteer', icon: <HeartPulse className="w-5 h-5" />, desc: 'Respond to nearby emergencies' },
    { id: 'hospital', title: 'Hospital', icon: <Building2 className="w-5 h-5" />, desc: 'Manage live beds & capacity' },
    { id: 'authority', title: 'Authority / Admin', icon: <ShieldAlert className="w-5 h-5" />, desc: 'Public command dashboard & staging' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 tactical-grid opacity-[0.03]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider mb-6">
          <Terminal className="w-3.5 h-3.5 text-red-500" />
          Sentinel AI Central Authentication
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-slate-100 tracking-tight leading-tight mb-4">
          Identity Matrix Protocol
        </h1>
        <p className="text-slate-400 font-sans max-w-xl mx-auto">
          Establish your credentials to access the specialized tactical dashboard for your role in the emergency response network.
        </p>
      </div>

      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        {/* Left Side: Role Selector */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
            1. Select Operational Role
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
                  selectedRole === r.id 
                    ? 'bg-slate-900 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                    : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50'
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 ${selectedRole === r.id ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-400'}`}>
                  {r.icon}
                </div>
                <h3 className={`font-sans font-bold text-sm ${selectedRole === r.id ? 'text-slate-100' : 'text-slate-300'}`}>
                  {r.title}
                </h3>
                <p className="text-[10px] font-sans text-slate-500 mt-1 leading-relaxed">
                  {r.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-900 p-6 rounded-xl shadow-2xl relative overflow-hidden">
          {/* Subtle accent line for selected role */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 via-slate-800 to-transparent" />
          
          <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            2. Authorize Access
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name / Organization
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe / Apollo Hospital"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs font-sans text-slate-100 outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {selectedRole !== 'citizen' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                    Professional Email
                  </label>
                  <input
                    type="email"
                    placeholder="terminal@sentinel.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs font-sans text-slate-100 outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs font-sans text-slate-100 outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 font-sans">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="tactical"
                className="w-full py-3"
                disabled={isLoading}
                leftIcon={isLoading ? <Activity className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isLoading ? 'Authenticating...' : `Enter ${roles.find(r => r.id === selectedRole)?.title} Dashboard`}
              </Button>
            </div>
            
            <p className="text-[9px] font-mono text-slate-600 text-center uppercase tracking-widest mt-4">
              Encrypted via Supabase Auth
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
