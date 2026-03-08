
import { Message, AppConfig, Agent } from "../types";
const GEMINI_PROXY_URL =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_GEMINI_PROXY_URL : undefined) ||
  "https://us-central1-htoh-3-0.cloudfunctions.net/geminiProxy";

const callGeminiProxy = async (action: string, payload: Record<string, unknown>) => {
  const response = await fetch(GEMINI_PROXY_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({action, ...payload}),
  });
  if (!response.ok) {
    throw new Error(`geminiProxy HTTP ${response.status}`);
  }
  return response.json();
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
  const payload = await callGeminiProxy("sendMessage", {
    history,
    newMessage,
    config,
    activeAgent,
  });
  return payload?.text || "No response generated.";
};

/**
 * Generates suggested follow-up prompts based on the conversation history.
 */
export const generateSuggestions = async (
  history: Message[],
  lastUserMessage: string,
  lastModelResponse: string
): Promise<string[]> => {
  try {
    const payload = await callGeminiProxy("suggestions", {
      history,
      lastUserMessage,
      lastModelResponse,
    });
    return Array.isArray(payload?.suggestions) ? payload.suggestions as string[] : [];
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

  try {
    const payload = await callGeminiProxy("tts", {text, voiceName});
    const base64Audio = String(payload?.base64 || "");
    if (!base64Audio) return null;
    const buffer = decodeBase64ToBuffer(base64Audio);
    if (!buffer) return null;
    return {buffer, mime: payload?.mime, base64: base64Audio};
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
