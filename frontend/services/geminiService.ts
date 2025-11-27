import { GoogleGenAI, Type } from "@google/genai";

// Function to initialize Gemini Client
const getAiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    return new GoogleGenAI({ apiKey });
};

export interface AiFilterSuggestion {
    needsFilter: string[];
    recommendedStationIds: string[];
    userIntent: 'DONOR' | 'SEEKER' | 'UNKNOWN';
}

/**
 * Uses Gemini to interpret a user's free text input
 * and suggests relevant filters or actions.
 */
export const analyzeUserMessage = async (message: string, availableStationData: string): Promise<AiFilterSuggestion> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
        User message: "${message}"
        Current Stations Data (JSON summary): ${availableStationData}
        
        Analyze the user's message (which is likely in Cantonese/Traditional Chinese).
        1. Determine if they are a 'DONOR' (offering help/items, driving) or 'SEEKER' (looking for help).
        2. Identify key item categories mentioned (e.g., "水", "毛毯", "尿片").
        3. Based on the station data provided, find station IDs that strictly match the user's intent. 
           - If DONOR, find stations where 'needs' include the items.
           - If SEEKER, find stations where 'offerings' include the items.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        userIntent: { type: Type.STRING, enum: ['DONOR', 'SEEKER', 'UNKNOWN'] },
                        needsFilter: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "List of standardized item categories detected (in Chinese)" 
                        },
                        recommendedStationIds: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "List of relevant station IDs"
                        }
                    },
                    required: ['userIntent', 'needsFilter', 'recommendedStationIds']
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AiFilterSuggestion;
        }
        throw new Error("No response text");
    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return { needsFilter: [], recommendedStationIds: [], userIntent: 'UNKNOWN' };
    }
};
