import React, { useState } from 'react';
import { useCommandStore } from '../store/useCommandStore';
import { saveOfflineIncident } from '../utils/offline';
import { Incident, IncidentType, SeverityLevel } from '../types';
import { prepareMediaPayload } from '../services/storage';
import { 
  Flame, 
  Droplets, 
  Compass, 
  Activity, 
  ShieldAlert, 
  MapPin, 
  AlertTriangle, 
  WifiOff, 
  Loader2, 
  CheckCircle,
  Clock,
  ArrowRight,
  Phone,
  Shield,
  HeartPulse,
  Building2,
  ExternalLink,
  Sparkles,
  Home,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getCurrentCoordinates } from '../utils/geo';

export default function IncidentReport() {
  const { 
    isOnline, 
    createIncident, 
    addToOfflineQueue, 
    setActiveView, 
    userLocation,
    hospitals,
    shelters,
    policeStations,
    fireStations,
    bloodBanks,
    foodCenters,
    waterPoints,
    medicalCamps,
    pharmacies,
    helplineNumbers
  } = useCommandStore();

  const [callingNumber, setCallingNumber] = useState<string | null>(null);
  const [callingName, setCallingName] = useState<string>('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('fire');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(userLocation ? 'Near your location' : '');
  const [latitude, setLatitude] = useState(userLocation ? parseFloat(userLocation.lat.toFixed(6)) : 0);
  const [longitude, setLongitude] = useState(userLocation ? parseFloat(userLocation.lng.toFixed(6)) : 0);
  const [reportedBy, setReportedBy] = useState('Staging Commander');
  const [imageUrl, setImageUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Prefill when location resolves
  React.useEffect(() => {
    if (userLocation) {
      setLatitude(parseFloat(userLocation.lat.toFixed(6)));
      setLongitude(parseFloat(userLocation.lng.toFixed(6)));
      setAddress('Near your location');
    }
  }, [userLocation]);

  // Geolocation Detect State
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectSuccess, setDetectSuccess] = useState(false);

  const handleDetectCoordinates = async () => {
    setIsDetecting(true);
    setDetectError(null);
    setDetectSuccess(false);
    try {
      const coords = await getCurrentCoordinates();
      setLatitude(parseFloat(coords.lat.toFixed(6)));
      setLongitude(parseFloat(coords.lng.toFixed(6)));
      setDetectSuccess(true);
      // Auto-update default address to reflect detected location
      if (!address || address === 'Near your location') {
        setAddress(`GPS Staging Area [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]`);
      }
    } catch (err: any) {
      console.error('Error detecting position:', err);
      setDetectError(err.message || 'Geolocation access denied or timed out.');
    } finally {
      setIsDetecting(false);
    }
  };

  // UI Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [savedIncidentDetails, setSavedIncidentDetails] = useState<any>(null);

  const incidentTypes: { value: IncidentType; label: string; icon: any; color: string }[] = [
    { value: 'fire', label: 'Fire', icon: Flame, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { value: 'flood', label: 'Flood / Water Riptide', icon: Droplets, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { value: 'earthquake', label: 'Earthquake / Collapse', icon: Compass, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    { value: 'medical', label: 'Medical Emergency', icon: Activity, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { value: 'other', label: 'Hazardous Incident', icon: ShieldAlert, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  ];

  const severityLevels: { value: SeverityLevel; label: string; color: string; border: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-950/40 text-blue-300 border-blue-500/20', border: 'hover:border-blue-500/60' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-950/40 text-amber-300 border-amber-500/20', border: 'hover:border-amber-500/60' },
    { value: 'high', label: 'High', color: 'bg-orange-950/40 text-orange-300 border-orange-500/20', border: 'hover:border-orange-500/60' },
    { value: 'critical', label: 'Critical / Life Threatening', color: 'bg-rose-950/40 text-rose-300 border-rose-500/20', border: 'hover:border-rose-500/60' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!title.trim()) {
      setSubmitError('Incident Title is required.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Incident Description is required.');
      return;
    }

    setIsSubmitting(true);

    const incidentData = {
      title,
      type,
      severity,
      description,
      status: 'reported' as const,
      location: {
        lat: Number(latitude),
        lng: Number(longitude),
        address: address,
      },
      reportedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl,
      voiceUrl,
      attachments: attachmentName ? [attachmentName] : [],
      // Hackathon Schema compatible attributes
      latitude: Number(latitude),
      longitude: Number(longitude),
      timestamp: new Date().toISOString()
    };

    try {
      if (isOnline) {
        // Submit via API Route to Supabase
        const saved = await createIncident(incidentData);
        setSubmitSuccess(true);
        setSavedIncidentDetails({ ...saved, isOffline: false });
      } else {
        // Offline Cache Emulation
        const tempId = `off-${Date.now()}`;
        
        // Generate simulated offline actions and recommendations
        const mockOfflineHospital = hospitals[0]?.name || "Emergency Medical Trauma Station";
        const mockOfflineShelter = shelters[0]?.name || "District Gymnasium & Cot Shelter";
        
        const offlineIncident: Incident = {
          id: tempId,
          ...incidentData,
          isOffline: true,
          aiAnalysis: {
            severity: severity,
            category: `${type.charAt(0).toUpperCase() + type.slice(1)} Incident`,
            summary: `Local offline formulation for ${title}. Priority responder resources staged nearby.`,
            recommendedActions: [
              "Evacuate immediate risk area perimeter",
              `Hospital Route: ${mockOfflineHospital}`,
              `Shelter Route: ${mockOfflineShelter}`
            ],
            requiredResources: type === 'fire' ? ["Fire Truck x2", "ALS Ambulance x1"] : ["Utility Crew x1", "Medical Staging Unit x1"]
          },
          aiSummary: `Local offline formulation for ${title}. Priority responder resources staged nearby.`,
          recommendedHospital: mockOfflineHospital,
          recommendedShelter: mockOfflineShelter,
          recommendedResources: type === 'fire' ? ["Fire Truck x2", "ALS Ambulance x1"] : ["Utility Crew x1", "Medical Staging Unit x1"],
          evacuationAdvice: "Evacuate structural perimeter immediately. Seek highest local ground if water is accumulating."
        };
        saveOfflineIncident(offlineIncident);
        addToOfflineQueue(offlineIncident);
        setSubmitSuccess(true);
        setSavedIncidentDetails(offlineIncident);
      }

      // Reset form on success
      setTitle('');
      setDescription('');
      setImageUrl('');
      setVoiceUrl('');
      setAttachmentName('');
    } catch (err: any) {
      console.error('Failed to submit emergency report:', err);
      setSubmitError(err.message || 'Server connection timed out. Unable to route report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10" id="emergency-incident-report-container">
      {/* Tactical Header */}
      <div className="border-b border-slate-900 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            Report New Tactical Emergency
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1.5">
            LOG STAGING DETAILS TO THE CLOUD DATABASE AND CASCADE COMMAND COORDINATION INTERNALLY
          </p>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono rounded">
            <WifiOff className="w-4 h-4" />
            <span>OFFLINE REPORT STAGING ENABLED</span>
          </div>
        )}
      </div>

      {submitSuccess && savedIncidentDetails ? (
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-8 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-sans font-semibold text-slate-100">
            Emergency Report Successfully Formulated
          </h3>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {savedIncidentDetails.isOffline 
              ? 'STAGED LOCALLY IN OFFLINE QUEUE' 
              : `ROUTED TO SUPABASE WITH TRANSACTION ID: SEC-${Date.now().toString().slice(-6)}`}
          </p>

          <div className="mt-6 p-4 bg-slate-900/60 border border-slate-900 rounded w-full text-left text-xs font-mono text-slate-400 flex flex-col gap-2">
            <div><span className="text-slate-500">Title:</span> <span className="text-slate-200">{savedIncidentDetails.title}</span></div>
            <div><span className="text-slate-500">Incident Type:</span> <span className="text-slate-200 capitalize">{savedIncidentDetails.type}</span></div>
            <div><span className="text-slate-500">Severity:</span> <span className="text-slate-200 capitalize">{savedIncidentDetails.severity}</span></div>
            <div><span className="text-slate-500">Geopoint:</span> <span className="text-slate-200">{savedIncidentDetails.location.lat.toFixed(4)}, {savedIncidentDetails.location.lng.toFixed(4)}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="text-red-400 uppercase font-bold animate-pulse">Reported</span></div>
            <div><span className="text-slate-500">AI Summary:</span> <span className="text-slate-200">{savedIncidentDetails.aiSummary || savedIncidentDetails.emergencyInstructions || 'Tactical guidance generated.'}</span></div>
            <div><span className="text-slate-500">Safety Instructions:</span> <span className="text-slate-200">{savedIncidentDetails.emergencyInstructions || 'Keep clear of the affected area and follow local authority guidance.'}</span></div>
            <div><span className="text-slate-500">Nearby Facilities:</span> <span className="text-slate-200">{hospitals.slice(0, 2).map((item) => item.name).join(', ') || 'Facility lookup pending'}</span></div>
            <div><span className="text-slate-500">Helplines:</span> <span className="text-slate-200">{helplineNumbers.length ? helplineNumbers.map((item) => `${item.name}: ${item.number}`).join(' • ') : '911 • 112'}</span></div>
          </div>

          <div className="flex gap-4 mt-8 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSubmitSuccess(false)}
            >
              Report Another Emergency
            </Button>
            <Button 
              variant="tactical" 
              className="flex-1"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveView('dashboard')}
            >
              Go to Tactical Board
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-900 rounded-lg p-6 md:p-8 shadow-xl shadow-slate-950/50 flex flex-col gap-6">
          
          {submitError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded flex items-start gap-3 text-rose-400 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <p className="font-bold">Form Formulation Failed</p>
                <p className="mt-0.5 opacity-90">{submitError}</p>
              </div>
            </div>
          )}

          {/* Incident Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Incident Mission Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Substation Transformer Overload & Fire"
              className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-3 font-sans text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
              required
            />
          </div>

          {/* Incident Type Grid */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Emergency Classification Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {incidentTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setType(item.value)}
                    className={`
                      px-3.5 py-4 border rounded flex flex-col items-center gap-2 text-center transition-all duration-200 group
                      ${isSelected 
                        ? `${item.color} border-red-500/50 font-bold scale-102 ring-1 ring-red-500/20` 
                        : 'bg-transparent border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-mono text-[10px] uppercase tracking-wide leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Levels */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tactical Severity Threat Assessment <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {severityLevels.map((item) => {
                const isSelected = severity === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSeverity(item.value)}
                    className={`
                      py-2.5 px-4 border rounded font-mono text-xs uppercase tracking-wider font-semibold text-center transition-all duration-150
                      ${isSelected 
                        ? `${item.color} scale-101 border-red-500/40 font-bold shadow-md shadow-red-950/20` 
                        : `bg-transparent border-slate-850 text-slate-400 ${item.border}`
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geo Location Coordination */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Staging St. Address Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Near My Location"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded pl-10 pr-4 py-2.5 font-sans text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-2">
                    Latitude
                  </label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-3 py-2.5 font-mono text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-2">
                    Longitude
                  </label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-3 py-2.5 font-mono text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* GPS Auto-detect Button */}
            <div className="flex justify-end gap-3 items-center">
              {detectError && (
                <p className="text-[10px] font-mono text-rose-400 animate-pulse">{detectError}</p>
              )}
              {detectSuccess && (
                <p className="text-[10px] font-mono text-emerald-400">✓ Location coordinates acquired</p>
              )}
              <button
                type="button"
                onClick={handleDetectCoordinates}
                disabled={isDetecting}
                className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 hover:text-cyan-300 disabled:opacity-55 transition-colors uppercase border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded cursor-pointer"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS Location...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Auto-Detect Current GPS Coordinates</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Emergency Intel Description <span className="text-red-500">*</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Formulate structured narrative briefing of the scene, hazards, fire size, smoke, structures threatened, or human injuries details..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-3 font-sans text-sm text-slate-100 placeholder-slate-600 outline-none transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900 pt-6">
            {/* Reported By */}
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2">
                Duty Staging Officer
              </label>
              <input 
                type="text" 
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Duty Commander Name"
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-2.5 font-sans text-xs text-slate-100 outline-none"
              />
            </div>

            {/* Mock Image URL */}
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2">
                Scene Photo URL (Optional)
              </label>
              <input 
                type="url" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-2.5 font-sans text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2">
                Voice Note URL (Optional)
              </label>
              <input 
                type="url" 
                value={voiceUrl}
                onChange={(e) => setVoiceUrl(e.target.value)}
                placeholder="https://example.com/voice.mp3"
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-2.5 font-sans text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2">
                Attachment Label (Optional)
              </label>
              <input 
                type="text" 
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="e.g. Building map"
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded px-4 py-2.5 font-sans text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setActiveView('landing')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="tactical" 
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            >
              {isSubmitting ? 'Formulating Report...' : 'Transmit Emergency Report'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
