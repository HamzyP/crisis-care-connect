
import { GoogleGenAI } from "@google/genai";
import { Hospital } from '../types';

// Lazy initialization - only create client when needed and API key is available
const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key not configured");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeLogistics = async (hospitals: Hospital[]) => {
  try {
    const ai = getAI();
    const hospitalDataStr = JSON.stringify(hospitals.map(h => ({
      name: h.name,
      capacity: h.maxPatients,
      departments: h.departments.map(d => ({
        name: d.name,
        specialists: `${d.specialistCount} ${d.specialistTitle}`,
        supplies: d.inventory.map(i => ({
          item: i.name,
          stock: i.quantity,
          daysSupply: (i.quantity / (i.dailyUsageRate || 1)).toFixed(1)
        }))
      }))
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Role: Crisis Logistics Expert.
        Context: Active crisis zone. Data blackout imminent.
        Task: Analyze the following hospital inventory and staffing data.
        
        Data: ${hospitalDataStr}

        Output Requirement:
        1. Identify the SINGLE most critical shortage or staffing bottleneck (specifically mention specialist types like Trauma Surgeons or Urologists if critical).
        2. Suggest one immediate logistical movement.
        3. Keep it under 50 words. Concise, military style sitrep.
        
        Format: Plain text.
      `,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return "System Offline. AI Analysis unavailable.";
  }
};
