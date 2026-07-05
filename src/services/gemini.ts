import { GoogleGenAI, Type } from '@google/genai';

export function buildFallbackAnalysis(incident: any) {
  const type = (incident.type || '').toLowerCase();
  const severity = (incident.severity || 'medium').toString().toLowerCase();

  let recommendedHospital = 'Regional Trauma Center';
  let recommendedShelter = 'Community Shelter Hub';
  let recommendedResources = ['Emergency Response Unit x1'];
  let emergencyInstructions = 'Move to a safe shelter location and keep emergency channels open.';
  let summary = `Incident triage for ${incident.title || 'emergency'} is being coordinated.`;
  let estimatedResponseTime = '8-12 minutes';
  let foodAvailability = 'Nearby relief station available.';
  let medicalAvailability = 'Paramedic support en route.';
  let safeRoute = 'Use the nearest accessible arterial route.';

  if (type.includes('fire')) {
    recommendedHospital = 'Burn Trauma Center';
    recommendedShelter = 'North Civic Shelter';
    recommendedResources = ['Fire Engine x2', 'ALS Ambulance x1'];
    emergencyInstructions = 'Evacuate immediately and avoid smoke inhalation.';
    summary = 'High-risk structure fire requiring rapid perimeter control.';
    estimatedResponseTime = '4-6 minutes';
    safeRoute = 'Use the northern corridor to avoid smoke exposure.';
  } else if (type.includes('flood')) {
    recommendedHospital = 'Riverfront Medical Center';
    recommendedShelter = 'High Ground Community Shelter';
    recommendedResources = ['Rescue Boat x1', 'Utility Crew x1'];
    emergencyInstructions = 'Move to higher ground and avoid flooded roads.';
    summary = 'Flooding event with road instability and utility risk.';
    estimatedResponseTime = '10-15 minutes';
  } else if (type.includes('earthquake')) {
    recommendedHospital = 'Seismic Trauma Unit';
    recommendedShelter = 'Stadium Emergency Shelter';
    recommendedResources = ['Search & Rescue x1', 'Medical Team x1'];
    emergencyInstructions = 'Drop, cover, and hold on until the tremor subsides.';
    summary = 'Seismic event with potential structural compromise.';
    estimatedResponseTime = '6-10 minutes';
  } else if (type.includes('medical')) {
    recommendedHospital = 'Mobile Critical Care Unit';
    recommendedShelter = 'Community Care Tent';
    recommendedResources = ['Paramedic Team x1'];
    emergencyInstructions = 'Keep the patient warm, calm, and accessible.';
    summary = 'Acute medical emergency requiring rapid stabilization.';
    estimatedResponseTime = '5-8 minutes';
    medicalAvailability = 'Critical care team prioritised to this response.';
  }

  const severityLabel = severity === 'critical' ? 'Critical' : severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low';
  const priority = severityLabel === 'Critical' || severityLabel === 'High' ? 'Immediate' : 'Routine';
  const estimatedVictims = severityLabel === 'Critical' ? 8 : severityLabel === 'High' ? 4 : severityLabel === 'Medium' ? 2 : 1;

  return {
    severity: severityLabel,
    priority,
    resourcesNeeded: recommendedResources,
    estimatedVictims,
    emergencyInstructions,
    hospitalRecommendation: recommendedHospital,
    shelterRecommendation: recommendedShelter,
    foodAvailability,
    medicalAvailability,
    safeRoute,
    confidenceScore: 0.84,
    summary,
    estimatedResponseTime
  };
}

export async function analyzeIncidentWithGemini(incident: any, apiKey?: string) {
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  if (!ai) {
    return buildFallbackAnalysis(incident);
  }

  try {
    const prompt = `Analyze the emergency incident and return a strict JSON object with the following keys: severity, priority, resourcesNeeded, estimatedVictims, emergencyInstructions, hospitalRecommendation, shelterRecommendation, foodAvailability, medicalAvailability, safeRoute, confidenceScore, summary, estimatedResponseTime. Incident: ${JSON.stringify(incident)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite tactical dispatch assistant. Respond with compact valid JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING },
            priority: { type: Type.STRING },
            resourcesNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedVictims: { type: Type.NUMBER },
            emergencyInstructions: { type: Type.STRING },
            hospitalRecommendation: { type: Type.STRING },
            shelterRecommendation: { type: Type.STRING },
            foodAvailability: { type: Type.STRING },
            medicalAvailability: { type: Type.STRING },
            safeRoute: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            estimatedResponseTime: { type: Type.STRING }
          },
          required: ['severity','priority','resourcesNeeded','estimatedVictims','emergencyInstructions','hospitalRecommendation','shelterRecommendation','foodAvailability','medicalAvailability','safeRoute','confidenceScore','summary','estimatedResponseTime']
        }
      }
    });

    const responseText = response.text || '';
    if (!responseText) throw new Error('Empty response from Gemini');
    return JSON.parse(responseText.trim());
  } catch (error) {
    console.warn('Gemini analysis unavailable, using fallback.', error);
    return buildFallbackAnalysis(incident);
  }
}
