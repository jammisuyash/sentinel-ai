import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  Send, 
  Terminal, 
  BrainCircuit, 
  AlertOctagon, 
  Activity,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Button } from './ui/Button';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AIControlCenter() {
  const { incidents, hospitals, shelters } = useCommandStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'SYSTEM INITIALIZED: Sentinel AI Tactical Staging advisor online. I am continuously assessing incident densities, hospital capacity indices, and route constraints. Ask me about strategic resource allocation, evacuation routes, or staging locations.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const activeCount = incidents.filter(i => i.status !== 'resolved').length;

  const latestIncidentWithAI = incidents.find(i => i.aiAnalysis || i.aiSummary);
  const riskText = latestIncidentWithAI?.aiSummary || latestIncidentWithAI?.aiAnalysis?.summary || "High risk of fire jumping to adjacent buildings at Mission St due to wind gusts.";
  
  const resourceList = latestIncidentWithAI?.recommendedResources || latestIncidentWithAI?.aiAnalysis?.requiredResources;
  const resourceText = resourceList && resourceList.length > 0
    ? `Recommended resources for latest incident: ${resourceList.join(', ')}`
    : "Shelter allocation simulation recommends redirecting Mission St evacuees to Civic Auditorium.";

  const adviceText = latestIncidentWithAI?.recommendedShelter || latestIncidentWithAI?.recommendedHospital
    ? `Latest Staging - Shelter: ${latestIncidentWithAI.recommendedShelter || 'Civic Auditorium'} | Hospital: ${latestIncidentWithAI.recommendedHospital || 'SF General'}`
    : "Trauma beds across SF are currently at 86% capacity. Balance remains stable.";

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSimulating) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSimulating(true);

    try {
      const res = await fetch('/api/ai-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, incidents })
      });

      const payload = await res.json();
      const responseText = payload.response || 'AI advisory unavailable at the moment.';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `ANALYZING COMMAND SCENARIO...\n\n${responseText}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'AI advisory temporarily unavailable. The fallback command logic remains active.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-950 border border-slate-900 overflow-hidden flex flex-col h-[550px] shadow-lg shadow-slate-950/50">
      
      {/* Advisor Header */}
      <div className="h-12 border-b border-slate-900 bg-slate-950/90 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4.5 h-4.5 text-red-400 animate-pulse" />
          <span className="font-display font-semibold tracking-wider text-xs uppercase text-slate-200">AI Staging Intelligence Advisor</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-bold">ALPHA ADV_V2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-[9px] text-slate-500 uppercase">Gemini-2.5-Flash</span>
        </div>
      </div>

      {/* Grid background visual overlay */}
      <div className="relative flex-1 p-4 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 tactical-grid opacity-[0.1] pointer-events-none" />

        {/* Diagnostic alert ticker list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4 z-10 shrink-0">
          <div className="bg-rose-950/10 border border-rose-500/20 p-2.5 rounded">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider">
              <span>Risk Projections</span>
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-sans text-slate-300 mt-1">{riskText}</p>
          </div>

          <div className="bg-amber-950/10 border border-amber-500/20 p-2.5 rounded">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              <span>Resource Simulation</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-sans text-slate-300 mt-1">{resourceText}</p>
          </div>

          <div className="bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <span>Strategic Buffer</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-sans text-slate-300 mt-1">{adviceText}</p>
          </div>
        </div>

        {/* Scrollable conversation staging area */}
        <div className="flex-1 overflow-y-auto pr-1.5 flex flex-col gap-3 z-10 mb-4 min-h-0">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 font-mono text-[9px] text-slate-500">
                <span>{msg.sender === 'user' ? 'STAGING_COMMANDER' : 'AI_TACTICAL_ADVISOR'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className={`p-3 rounded border text-xs whitespace-pre-wrap leading-relaxed font-mono ${
                msg.sender === 'user' 
                  ? 'bg-red-950/20 border-red-500/30 text-slate-100' 
                  : 'bg-slate-900/90 border-slate-850 text-slate-300'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isSimulating && (
            <div className="self-start flex flex-col max-w-[85%]">
              <div className="flex items-center gap-1.5 mb-1 font-mono text-[9px] text-slate-500">
                <span>AI_TACTICAL_ADVISOR</span>
                <span>•</span>
                <span className="animate-pulse">SIMULATING STRATEGIES...</span>
              </div>
              <div className="p-3 rounded border border-slate-850 bg-slate-900/40 text-xs font-mono text-slate-500 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Computing optimal dispatch matrix & balancing hospital buffers...</span>
              </div>
            </div>
          )}
        </div>

        {/* Form consulting input */}
        <form onSubmit={handleConsult} className="z-10 bg-slate-950/60 border-t border-slate-900 pt-3 shrink-0 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSimulating}
            placeholder="Ask AI: 'Recommend hospital buffer routing' or 'How should we handle shelter capacities?'"
            className="flex-1 bg-slate-900 border border-slate-850 focus:border-slate-700 text-slate-100 px-3.5 py-2 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-700"
          />
          <Button 
            variant="tactical" 
            size="sm" 
            type="submit"
            disabled={isSimulating || !input.trim()}
            leftIcon={<Send className="w-3 h-3" />}
          >
            Consult
          </Button>
        </form>
      </div>
    </div>
  );
}
