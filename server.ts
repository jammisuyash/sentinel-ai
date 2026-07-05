import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

import {
  getIncidentsCollection,
  addIncidentToFirestore,
  updateIncidentInFirestore,
  deleteIncidentFromFirestore,
  getHospitalsCollection,
  updateHospitalInFirestore,
  getSheltersCollection,
  updateShelterInFirestore,
  getResourcesCollection,
  addResourceToFirestore,
  updateResourceInFirestore,
  getVolunteersCollection,
  addVolunteerToFirestore,
  updateVolunteerInFirestore,
  getReportsCollection,
  addReportToFirestore,
  getNotificationsCollection,
  addNotificationToFirestore,
  updateNotificationInFirestore,
  getUserProfilesCollection,
  createUserProfileInFirestore,
  isSupabaseConfigured
} from "./src/lib/supabase";

import { Incident, Shelter, Hospital, SituationReport, NotificationItem, Volunteer, UserProfile } from "./src/types";

// Initialize Gemini safely
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Ensure Supabase is configured
if (!isSupabaseConfigured()) {
  console.error("CRITICAL ERROR: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
  process.exit(1);
}

// Fallback AI Analysis if Gemini fails or is unconfigured
function getFallbackAnalysis(incident: any) {
  return {
    severity: incident.severity || 'Medium',
    confidence: 0.5,
    summary: `[Fallback Analysis] Event reported: ${incident.title}. Awaiting further details.`,
    recommendedResources: ['Standard Response Unit'],
    recommendedHospital: 'Nearest Available Hospital',
    recommendedShelter: 'Nearest Available Shelter',
    evacuationAdvice: 'Follow local authority guidance.',
    estimatedResponseTime: '10-15 minutes'
  };
}

async function getGeminiIncidentAnalysis(incident: any) {
  if (!ai) {
    console.warn("GEMINI_API_KEY is not defined. Using fallback analysis.");
    return getFallbackAnalysis(incident);
  }

  try {
    const prompt = `Analyze the following emergency incident and generate critical tactical intelligence.
Title: ${incident.title}
Type: ${incident.type}
Threat Severity: ${incident.severity}
Description: ${incident.description}
Location: ${incident.location?.address || "GPS Coordinates " + incident.location?.lat + ", " + incident.location?.lng}
Reported By: ${incident.reportedBy}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite tactical AI incident dispatch commander. Analyze the incident details and output strict JSON aligning to the provided schema with no markdown formatting and no extra text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, description: "Must be exactly one of: Critical, High, Medium, Low" },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
            summary: { type: Type.STRING, description: "A concise tactical summary of the incident" },
            recommendedResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of recommended emergency resources" },
            recommendedHospital: { type: Type.STRING, description: "Name of the recommended hospital to route casualties to" },
            recommendedShelter: { type: Type.STRING, description: "Name of the recommended emergency shelter for displaced people" },
            evacuationAdvice: { type: Type.STRING, description: "Evacuation or immediate safety instructions" },
            estimatedResponseTime: { type: Type.STRING, description: "Estimated response time" }
          },
          required: [
            "severity", "confidence", "summary", "recommendedResources", 
            "recommendedHospital", "recommendedShelter", "evacuationAdvice", "estimatedResponseTime"
          ]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Gemini API");
    return JSON.parse(responseText.trim());
  } catch (err: any) {
    console.error("Gemini API error, invoking fallback analysis:", err);
    return getFallbackAnalysis(incident);
  }
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sentinel-ai-supabase", timestamp: new Date().toISOString() });
});

// --- Auth Endpoints (Mocked for Server-side if needed, but handled by client Supabase Auth mostly) ---
app.post("/api/auth/login", async (req, res) => {
  const { email, name, role } = req.body || {};
  return res.status(400).json({ error: "Auth is handled client-side via Supabase" });
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ success: true });
});

app.get("/api/auth/me", (_req, res) => {
  res.status(400).json({ error: "Must use Supabase client-side session logic." });
});

// --- INCIDENTS ---
app.get("/api/incidents", async (req, res) => {
  try {
    const incidents = await getIncidentsCollection();
    return res.json(incidents);
  } catch (error: any) {
    console.error("GET /api/incidents error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch incidents" });
  }
});

app.post("/api/incidents", async (req, res) => {
  try {
    const incidentData = req.body;
    if (!incidentData.title || !incidentData.type || !incidentData.severity) {
      return res.status(400).json({ error: "Missing required fields: title, type, severity" });
    }

    // Generate AI Analysis
    console.log(`Starting Gemini Tactical Intelligence Assessment for Incident: ${incidentData.title}`);
    const geminiResult = await getGeminiIncidentAnalysis(incidentData);
    
    const enhancedIncident = {
      ...incidentData,
      severity: geminiResult.severity.toLowerCase().trim(),
      aiAnalysis: {
        severity: geminiResult.severity.toLowerCase().trim(),
        category: `${incidentData.type} Incident`,
        summary: geminiResult.summary,
        recommendedActions: [
          geminiResult.evacuationAdvice,
          `Hospital: ${geminiResult.recommendedHospital}`,
          `Shelter: ${geminiResult.recommendedShelter}`
        ],
        requiredResources: geminiResult.recommendedResources
      },
      aiSummary: geminiResult.summary,
      recommendedHospital: geminiResult.recommendedHospital,
      recommendedShelter: geminiResult.recommendedShelter,
      recommendedResources: geminiResult.recommendedResources,
      evacuationAdvice: geminiResult.evacuationAdvice,
    };

    const docId = await addIncidentToFirestore(enhancedIncident);
    if (!docId) {
      throw new Error("Failed to save incident to Supabase");
    }

    return res.status(201).json({ id: docId, ...enhancedIncident });
  } catch (error: any) {
    console.error("POST /api/incidents error:", error);
    return res.status(500).json({ error: error.message || "Failed to create incident" });
  }
});

app.patch("/api/incidents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const success = await updateIncidentInFirestore(id, updates);
    if (success) {
      return res.json({ success: true, id, updates });
    }
    return res.status(404).json({ error: "Incident not found or update failed" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update incident" });
  }
});

app.delete("/api/incidents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteIncidentFromFirestore(id);
    if (success) {
      return res.json({ success: true, id });
    }
    return res.status(404).json({ error: "Incident not found or delete failed" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete incident" });
  }
});

// --- AI EXPERT ASSISTANT ---
app.post("/api/ai-consult", async (req, res) => {
  try {
    const { prompt, incidents } = req.body;
    if (!ai) {
      return res.json({ response: "AI service unavailable. GEMINI_API_KEY not configured." });
    }

    const incidentContext = Array.isArray(incidents) ? incidents.slice(0, 3).map((incident: any) => ({
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    })) : [];

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are a tactical operations AI advisor. Respond in concise plain text. User question: ${prompt}\nCurrent incidents context: ${JSON.stringify(incidentContext)}`,
      config: {
        systemInstruction: 'You are an elite incident command AI assistant. Give short tactical guidance.',
        temperature: 0.4,
      }
    });
    return res.json({ response: result.text });
  } catch (error: any) {
    return res.status(500).json({ error: 'AI consult failed' });
  }
});

// --- HOSPITALS ---
app.get("/api/hospitals", async (_req, res) => {
  try {
    const hospitals = await getHospitalsCollection();
    return res.json(hospitals);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch hospitals" });
  }
});

app.patch("/api/hospitals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateHospitalInFirestore(id, req.body);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: "Hospital not found" });
  } catch (error) {
    return res.status(500).json({ error: "Update failed" });
  }
});

// --- SHELTERS ---
app.get("/api/shelters", async (_req, res) => {
  try {
    const shelters = await getSheltersCollection();
    return res.json(shelters);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch shelters" });
  }
});

app.patch("/api/shelters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateShelterInFirestore(id, req.body);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: "Shelter not found" });
  } catch (error) {
    return res.status(500).json({ error: "Update failed" });
  }
});

// --- RESOURCES ---
app.get("/api/resources", async (_req, res) => {
  try {
    const resources = await getResourcesCollection();
    return res.json(resources);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch resources" });
  }
});

app.post("/api/resources", async (req, res) => {
  try {
    const id = await addResourceToFirestore(req.body);
    if (id) return res.status(201).json({ id, ...req.body });
    return res.status(500).json({ error: "Failed to add resource" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create resource" });
  }
});

app.patch("/api/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateResourceInFirestore(id, req.body);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    return res.status(500).json({ error: "Update failed" });
  }
});

// --- VOLUNTEERS ---
app.get("/api/volunteers", async (_req, res) => {
  try {
    const volunteers = await getVolunteersCollection();
    return res.json(volunteers);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch volunteers" });
  }
});

app.post("/api/volunteers", async (req, res) => {
  try {
    const id = await addVolunteerToFirestore(req.body);
    if (id) return res.status(201).json({ id, ...req.body });
    return res.status(500).json({ error: "Failed to add volunteer" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create volunteer" });
  }
});

app.patch("/api/volunteers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateVolunteerInFirestore(id, req.body);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    return res.status(500).json({ error: "Update failed" });
  }
});

// --- REPORTS ---
app.get("/api/reports", async (_req, res) => {
  try {
    const reports = await getReportsCollection();
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const id = await addReportToFirestore(req.body);
    if (id) return res.status(201).json({ id, ...req.body });
    return res.status(500).json({ error: "Failed to add report" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create report" });
  }
});

// --- NOTIFICATIONS ---
app.get("/api/notifications", async (_req, res) => {
  try {
    const notifications = await getNotificationsCollection();
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const id = await addNotificationToFirestore(req.body);
    if (id) return res.status(201).json({ id, ...req.body });
    return res.status(500).json({ error: "Failed to add notification" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create notification" });
  }
});

// Setup server start helper for non-Vercel environments (Local development)
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    const listenOnPort = (port: number) => {
      const server = app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${port}`);
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          const nextPort = port + 1;
          console.warn(`Port ${port} is busy; retrying on ${nextPort}.`);
          server.close();
          listenOnPort(nextPort);
        } else {
          console.error('Server startup failed:', error);
        }
      });
    };
    listenOnPort(PORT);
  }
}

startServer().catch(console.error);

export default app;
