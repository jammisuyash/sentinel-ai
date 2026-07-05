import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { 
  FileText, 
  Plus, 
  Filter, 
  Send, 
  User, 
  Clock, 
  AlertOctagon, 
  CheckCircle, 
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SituationReport } from '../types';

export default function Reports() {
  const { reports, addReport } = useCommandStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Create Report State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('Staging Commander Rachel Stone');
  const [newCategory, setNewCategory] = useState<'sitrep' | 'briefing' | 'alert'>('sitrep');

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const report: SituationReport = {
      id: `rep-${Date.now()}`,
      title: newTitle,
      content: newContent,
      author: newAuthor,
      category: newCategory,
      createdAt: new Date().toISOString()
    };

    addReport(report);
    setShowAddForm(false);
    setNewTitle('');
    setNewContent('');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'alert':
        return 'bg-red-500/10 border-red-500/30 text-red-400 font-bold animate-pulse';
      case 'briefing':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-300';
    }
  };

  const filteredReports = reports.filter(r => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in" id="reports-view-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-red-500" />
            Situation Briefings & Alerts Feed
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Official logs, command shifts summaries, and automated meteorological warning tickers
          </p>
        </div>

        <Button 
          variant="tactical" 
          size="sm"
          onClick={() => setShowAddForm(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Formulate Situation Report
        </Button>
      </div>

      {/* Form Dialog overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-900 rounded-lg max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-900">
              <FileText className="w-5 h-5 text-red-500" />
              <h3 className="font-sans font-bold text-slate-100">Formulate Tactical Situation Report</h3>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Briefing Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Seismic Tremor Impact - Mission District Corridor"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Reporting Officer / Author</label>
                  <input 
                    type="text" 
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Log Classification</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-red-500"
                  >
                    <option value="sitrep">Standard SitRep</option>
                    <option value="briefing">Strategic Briefing</option>
                    <option value="alert">Critical Broadcast Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Incident Assessment Details</label>
                <textarea 
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter high fidelity operational logs, tactical staging parameters, or critical warnings..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-sans text-slate-100 outline-none focus:border-red-500 leading-relaxed resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  variant="tactical" 
                  size="sm"
                >
                  Broadcast Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="flex bg-slate-950 border border-slate-900 p-1 rounded-md text-[11px] font-mono mb-6 max-w-md">
        <button 
          onClick={() => setCategoryFilter('all')}
          className={`flex-1 py-1.5 rounded transition-all uppercase text-center ${categoryFilter === 'all' ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
        >
          All Logs ({reports.length})
        </button>
        <button 
          onClick={() => setCategoryFilter('sitrep')}
          className={`flex-1 py-1.5 rounded transition-all uppercase text-center ${categoryFilter === 'sitrep' ? 'bg-slate-900 text-slate-100 border border-slate-800 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
        >
          SitReps
        </button>
        <button 
          onClick={() => setCategoryFilter('briefing')}
          className={`flex-1 py-1.5 rounded transition-all uppercase text-center ${categoryFilter === 'briefing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Briefings
        </button>
        <button 
          onClick={() => setCategoryFilter('alert')}
          className={`flex-1 py-1.5 rounded transition-all uppercase text-center ${categoryFilter === 'alert' ? 'bg-rose-950/20 text-rose-400 border border-rose-500/20 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Alerts
        </button>
      </div>

      {/* Reports Feed */}
      <div className="flex flex-col gap-6">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-950 border border-slate-900 rounded-lg py-16 text-center text-slate-550 flex flex-col items-center">
            <BookOpen className="w-10 h-10 text-slate-700 mb-3" />
            <h4 className="font-sans font-medium text-slate-400 text-sm">No Tactical Briefings Match Filters</h4>
            <p className="font-mono text-[10px] mt-1 text-slate-650">Formulate a report using the control header above.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="relative bg-slate-950 border border-slate-900 rounded-lg p-6 group overflow-hidden shadow-sm hover:border-slate-800 transition-all"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-slate-900 group-hover:bg-red-500 transition-colors" />
              <div className="absolute inset-0 tactical-grid opacity-[0.05]" />

              <div className="flex flex-col gap-3 z-10 relative">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-sans font-bold text-base text-slate-100 group-hover:text-red-400 transition-colors">
                    {report.title}
                  </h3>
                  <span className={`font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getCategoryBadge(report.category)}`}>
                    {report.category}
                  </span>
                </div>

                <p className="text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed border-y border-slate-900/60 py-3 my-1">
                  {report.content}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>STAGED BY: <strong className="text-slate-400">{report.author}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
