import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest as onRequestV2} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import type {GoogleGenAI as GoogleGenAIClient} from "@google/genai";

setGlobalOptions({maxInstances: 10});

export const hello = onRequestV2((req, res) => {
  logger.info("hello called", {method: req.method, path: req.path});
  res.status(200).send("Hello from Firebase!");
});

export const pingVertex = onRequest(async (_req, res) => {
  try {
    const project = process.env.VERTEX_PROJECT ?? process.env.GCLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION ?? "global";
    const {GoogleGenAI} = await import("@google/genai");

    const ai: GoogleGenAIClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Reply with: Vertex AI is connected.",
    });

    res.status(200).json({
      ok: true,
      text: response.text ?? "",
    });
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ok: false, error: message});
    return;
  }
});

type PlanAiMode = "autocomplete" | "bulkSubtasks" | "taskSuggestion";
type GeminiProxyAction =
  | "sendMessage"
  | "suggestions"
  | "tts"
  | "academyChat"
  | "academyTts";

export const planAiAssist = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ok: false, error: "Use POST"});
    return;
  }

  try {
    const mode = (req.body?.mode as PlanAiMode | undefined) ?? "autocomplete";
    const prompt = String(req.body?.prompt ?? "").trim();
    if (!prompt) {
      res.status(400).json({ok: false, error: "Missing prompt"});
      return;
    }

    const project = process.env.VERTEX_PROJECT ?? process.env.GCLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION ?? "global";
    const {GoogleGenAI} = await import("@google/genai");
    const ai: GoogleGenAIClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: mode === "bulkSubtasks" ? {responseMimeType: "application/json"} : undefined,
    });
    const text = response.text ?? "";

    if (mode === "bulkSubtasks") {
      let tasks: unknown = [];
      try {
        tasks = JSON.parse(text || "[]");
      } catch (_error) {
        tasks = [];
      }
      res.status(200).json({ok: true, tasks});
      return;
    }

    res.status(200).json({ok: true, text});
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("planAiAssist failed", {message});
    res.status(500).json({ok: false, error: message});
    return;
  }
});

export const geminiProxy = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ok: false, error: "Use POST"});
    return;
  }

  try {
    const action = String(req.body?.action ?? "") as GeminiProxyAction;
    const project = process.env.VERTEX_PROJECT ?? process.env.GCLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION ?? "global";
    const {GoogleGenAI} = await import("@google/genai");
    const ai: GoogleGenAIClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });

    if (action === "sendMessage") {
      const history = Array.isArray(req.body?.history) ? req.body.history : [];
      const newMessage = String(req.body?.newMessage ?? "");
      const config = req.body?.config ?? {};
      const activeAgent = req.body?.activeAgent ?? {};
      let effectiveSystemInstruction = String(activeAgent.systemInstruction ?? "");
      const tools = Array.isArray(activeAgent.tools) ? activeAgent.tools : [];
      const customEndpoints = Array.isArray(activeAgent.customEndpoints) ? activeAgent.customEndpoints : [];
      if (tools.length > 0) {
        effectiveSystemInstruction += `\n\n[Available Tools]: ${tools.join(", ")}`;
        effectiveSystemInstruction += `\n\n[WIDGET INSTRUCTIONS]
If the user's request matches a tool capability, use the specific tag in your response:
- "Calendar Integration": Use "[[WIDGET:Calendar]]" for scheduling or appointments.
- "Google Maps API": Use "[[WIDGET:Maps]]" for showing specific locations, addresses, or directions.
- "Google Places API": Use "[[WIDGET:Places]]" for listing businesses, restaurants, or real estate listings.
- "YouTube Data API": Use "[[WIDGET:YouTube]]" for showing relevant video content, tutorials, or property tours.
- "Graph Widget": Use "[[WIDGET:Graph]]" for visualizing data like revenue, expenses, or stats.
- "Forms Library": Use "[[WIDGET:Forms]]" for helping the user fill out transaction forms.
- "Contacts Directory": Use "[[WIDGET:Contacts]]" for showing contacts.
Only use one widget tag per response if necessary.`;
        if (customEndpoints.length > 0) {
          effectiveSystemInstruction += `\n[Custom APIs]: ${customEndpoints.join(", ")}.`;
        }
      }
      if (config?.corpusData) {
        effectiveSystemInstruction += `\n\n=== KNOWLEDGE BASE (CORPUS) ===\n${String(config.corpusData)}\n\n=== END KNOWLEDGE BASE ===\nUse this if relevant.`;
      }
      const chatHistory = history.slice(-15).map((msg: {role?: string; text?: string}) => ({
        role: msg.role ?? "user",
        parts: [{text: msg.text ?? ""}],
      }));
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: chatHistory,
        config: {systemInstruction: effectiveSystemInstruction, temperature: 0.7},
      });
      const result = await chat.sendMessage({message: newMessage});
      res.status(200).json({ok: true, text: result.text ?? "No response generated."});
      return;
    }

    if (action === "suggestions") {
      const lastUserMessage = String(req.body?.lastUserMessage ?? "");
      const lastModelResponse = String(req.body?.lastModelResponse ?? "");
      const prompt = `
Analyze the following conversation snippet and generate 4 short, relevant follow-up questions or actions.
User: "${lastUserMessage}"
AI: "${lastModelResponse}"
The suggestions should be concise (under 10 words).
Return strictly a JSON array of strings.
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {responseMimeType: "application/json"},
      });
      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(response.text ?? "[]") as string[];
      } catch (_err) {
        suggestions = [];
      }
      res.status(200).json({ok: true, suggestions});
      return;
    }

    if (action === "tts") {
      const text = String(req.body?.text ?? "");
      const voiceName = String(req.body?.voiceName ?? "Puck");
      const fetchAudio = async (model: string, useMime: boolean) => {
        const response = await ai.models.generateContent({
          model,
          contents: [{role: "user", parts: [{text}]}],
          ...(useMime ? {generationConfig: {responseMimeType: "audio/mp3"}} : {}),
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {voiceName},
              },
            },
          },
        });
        const inlinePart = response?.candidates?.[0]?.content?.parts?.find(
          (part: {inlineData?: {data?: string; mimeType?: string}}) => part.inlineData
        );
        return {
          base64: inlinePart?.inlineData?.data ?? "",
          mime: inlinePart?.inlineData?.mimeType ?? "audio/mpeg",
        };
      };
      let audio = await fetchAudio("gemini-2.5-flash-preview-tts", true);
      if (!audio.base64) {
        audio = await fetchAudio("gemini-2.5-flash", false);
      }
      res.status(200).json({ok: true, ...audio});
      return;
    }

    if (action === "academyChat") {
      const message = String(req.body?.message ?? "");
      const currentPage = Number(req.body?.currentPage ?? 1);
      const isLesson = Boolean(req.body?.isLesson);
      const difficulty = String(req.body?.difficulty ?? "");
      const bookContext = String(req.body?.bookContext ?? "[]");
      const tutorInstruction = isLesson ?
        `You are currently in LESSON MODE (Difficulty: ${difficulty}).
1. If the user hasn't started, present a scenario or question related to the "Code of Ethics".
2. If the user answered a previous question, provide instant feedback.
3. Use the book data to formulate real estate case studies.
4. You can suggest a navHint page number.` :
        `You are the "Ai Ethics Advisor" for HomeToHome.Ai. Use the book context.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction: `${tutorInstruction}
The user is currently viewing page ${currentPage}.
Book Context: ${bookContext}
Respond in JSON format with: text, optional navHint, optional isCorrect.`,
          responseMimeType: "application/json",
        },
      });
      let parsed: {text?: string; navHint?: number; isCorrect?: boolean} = {};
      try {
        parsed = JSON.parse(response.text ?? "{}");
      } catch (_err) {
        parsed = {text: response.text ?? ""};
      }
      res.status(200).json({ok: true, ...parsed});
      return;
    }

    if (action === "academyTts") {
      const text = String(req.body?.text ?? "");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{role: "user", parts: [{text: `Read this lesson part clearly: ${text}`}]}],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: "Kore"},
            },
          },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";
      res.status(200).json({ok: true, base64});
      return;
    }

    res.status(400).json({ok: false, error: "Unsupported action"});
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("geminiProxy failed", {message});
    res.status(500).json({ok: false, error: message});
    return;
  }
});
