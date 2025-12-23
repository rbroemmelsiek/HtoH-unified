
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, AppConfig, Agent } from "../types";

// Get API key from multiple sources for compatibility with Google AI Studio and Vite
const getApiKey = (): string => {
  // Try import.meta.env (Vite/modern bundlers) - Vite requires VITE_ prefix
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as any).env;
    if (env) {
       const key = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY || env.GEMINI_API_KEY;
       if (key) return key;
    }
  }
  // Try process.env (Node.js/Vite define)
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (key) return key;
  }
  // Try global variables (Google AI Studio or manual injection)
  if (typeof window !== 'undefined') {
    const key = (window as any).GEMINI_API_KEY || (window as any).API_KEY;
    if (key) return key;
  }
  if (typeof globalThis !== 'undefined') {
    const key = (globalThis as any).GEMINI_API_KEY || (globalThis as any).API_KEY;
    if (key) return key;
  }
  // Fall back to empty string (Google AI Studio may auto-authenticate)
  return '';
};

const API_KEY = getApiKey();

// Debug: Log if API key is found (don't log the actual key!)
if (typeof window !== 'undefined') {
  console.log('[Gemini] API Key loaded:', API_KEY ? `Yes (${API_KEY.substring(0, 8)}...)` : 'No - check .env file has VITE_GEMINI_API_KEY');
}

const createClient = () => {
  if (!API_KEY) {
    console.error('[Gemini] No API key found! Make sure .env has VITE_GEMINI_API_KEY=your_key_here');
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Sends a message to the Gemini API, incorporating the corpus and system instructions.
 */
export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  config: AppConfig,
  activeAgent: Agent
): Promise<string> => {
  const ai = createClient();
  
  // Construct the effective system instruction
  let effectiveSystemInstruction = `${activeAgent.systemInstruction}`;
  
  // Include tools in prompt context
  if (activeAgent.tools && activeAgent.tools.length > 0) {
    effectiveSystemInstruction += `\n\n[Available Tools]: ${activeAgent.tools.join(', ')}`;
    
    // Instructions for summoning widgets
    effectiveSystemInstruction += `\n\n[WIDGET INSTRUCTIONS]
    If the user's request matches a tool capability, use the specific tag in your response:
    - "Calendar Integration": Use "[[WIDGET:Calendar]]" for scheduling or appointments.
    - "Google Maps API": Use "[[WIDGET:Maps]]" for showing specific locations, addresses, or directions. If a physical address is mentioned or implied, default to showing this.
    - "Google Places API": Use "[[WIDGET:Places]]" for listing businesses, restaurants, or real estate listings.
    - "YouTube Data API": Use "[[WIDGET:YouTube]]" for showing relevant video content, tutorials, or property tours.
    - "Graph Widget": Use "[[WIDGET:Graph]]" for visualizing data like revenue, expenses, or stats.
    - "Forms Library": Use "[[WIDGET:Forms]]" for helping the user fill out transaction forms, agreements, or legal documents.
    - "Contacts Directory": Use "[[WIDGET:Contacts]]" for showing the list of people, service providers, or vendors associated with the transaction.
    
    Only use one widget tag per response if necessary.
    `;
    
    if (activeAgent.customEndpoints && activeAgent.customEndpoints.length > 0) {
       effectiveSystemInstruction += `\n[Custom APIs]: ${activeAgent.customEndpoints.join(', ')}. You can act as if you are querying these endpoints.`;
    }
  }
  
  // If corpus data exists, append it to the system instruction for context/grounding
  if (config.corpusData) {
    effectiveSystemInstruction += `\n\n=== KNOWLEDGE BASE (CORPUS) ===\n${config.corpusData}\n\n=== END KNOWLEDGE BASE ===\nIdeally, answer based on the Knowledge Base above if relevant to the query.`;
  }

  // Transform history for the API
  const chatHistory = history.slice(-15).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: chatHistory,
    config: {
      systemInstruction: effectiveSystemInstruction,
      temperature: 0.7, 
    }
  });

  const result = await chat.sendMessage({
    message: newMessage
  });

  return result.text || "No response generated.";
};

/**
 * Generates suggested follow-up prompts based on the conversation history.
 */
export const generateSuggestions = async (
  history: Message[],
  lastUserMessage: string,
  lastModelResponse: string
): Promise<string[]> => {
  const ai = createClient();

  const prompt = `
    Analyze the following conversation snippet and generate 4 short, relevant follow-up questions or actions the user might want to take next.
    
    User: "${lastUserMessage}"
    AI: "${lastModelResponse}"
    
    The suggestions should be concise (under 10 words).
    Return strictly a JSON array of strings.
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = result.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.warn("Error generating suggestions (likely quota exceeded):", error);
    // Fallback suggestions to prevent UI breakage
    return [
      "Tell me more about this",
      "What are the risks?",
      "Can you summarize?",
      "Explain the details"
    ];
  }
};

/**
 * Generates speech from text using Gemini 2.5 Flash TTS
 */
export interface TTSResult {
  buffer: ArrayBuffer;
  mime?: string;
  base64?: string;
}

export const textToSpeech = async (text: string, voiceName: string = 'Puck'): Promise<TTSResult | null> => {
  const ai = createClient();
  console.log('[TTS] Generating audio with voice', voiceName);

  const decodeBase64ToBuffer = (base64Audio: string): ArrayBuffer | null => {
    // Strip data URL prefix if present
    const payload = base64Audio.includes(",") ? base64Audio.split(",").pop() || "" : base64Audio;
    // Normalize possible base64url and pad
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    try {
      const binaryString = atob(padded);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (e) {
      console.error("[TTS] Failed to base64-decode audio", e);
      return null;
    }
  };

  const fetchAudio = async (model: string, useMime: boolean) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text }] }],
      // generationConfig is required to request mp3 when supported
      ...(useMime ? { generationConfig: { responseMimeType: "audio/mp3" } } : {}),
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlinePart = response?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );
    const base64Audio = inlinePart?.inlineData?.data;
    const mime = inlinePart?.inlineData?.mimeType;

    if (!base64Audio) {
      console.error(`[TTS] No audio data returned from model ${model}. Full response:`, JSON.stringify(response, null, 2));
      return null;
    }
    const buffer = decodeBase64ToBuffer(base64Audio);
    if (!buffer) return null;
    return { buffer, mime, base64: base64Audio };
  };

  try {
    // Try dedicated TTS preview model first (with mime hint)
    const primary = await fetchAudio("gemini-2.5-flash-preview-tts", true);
    if (primary) {
      console.log("[TTS] Primary model returned audio buffer");
      return primary;
    }

    // Fallback to standard model with audio modality
    const fallback = await fetchAudio("gemini-2.5-flash", false);
    if (fallback) {
      console.log("[TTS] Fallback model returned audio buffer");
    }
    return fallback;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
