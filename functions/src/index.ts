import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest as onRequestV2} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import type {GoogleGenAI as GoogleGenAIClient} from "@google/genai";
import {Config, ApprovalMode, Storage} from "@google/gemini-cli-core";
import * as os from "os";

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
  | "academyTts"
  | "approveAction";

type SchemaField = {
  name?: string;
  label?: string;
  type?: string;
  options?: string[];
  enumCategory?: string;
  optionsSourceField?: string;
  optionsByValue?: Record<string, string[]>;
};

type SchemaTableDefinition = {
  id?: string;
  name?: string;
  schema?: SchemaField[];
  keyField?: string;
  labelField?: string;
};

const MESOP_TYPES = new Set([
  "Address", "App", "ChangeCounter", "ChangeLocation", "ChangeTimestamp",
  "Color", "Date", "DateTime", "Time", "Decimal", "Number", "Percent",
  "Price", "Progress", "Duration", "Email", "File", "Image", "LatLong",
  "LongText", "Name", "Phone", "Ref", "Signature", "Text", "Thumbnail",
  "Url", "Video", "XY", "Yes/No", "Enum", "EnumList", "Drawing", "PageBreak", "SectionHeader",
]);

function validateSchemaTableDefinition(def: SchemaTableDefinition): string[] {
  const errors: string[] = [];
  if (!def.id?.trim()) errors.push("Table definition missing id.");
  if (!def.name?.trim()) errors.push("Table definition missing name.");
  if (!def.keyField?.trim()) errors.push("Table definition missing keyField.");
  if (!def.labelField?.trim()) errors.push("Table definition missing labelField.");
  if (!Array.isArray(def.schema) || def.schema.length === 0) {
    errors.push("Table definition requires a non-empty schema array.");
    return errors;
  }

  const seen = new Set<string>();
  def.schema.forEach((field, idx) => {
    if (!field.name?.trim()) errors.push(`Field[${idx}] missing name.`);
    if (!field.label?.trim()) errors.push(`Field[${idx}] missing label.`);
    if (!field.type || !MESOP_TYPES.has(field.type)) {
      errors.push(`Field[${idx}] has invalid type "${String(field.type ?? "")}".`);
    }
    if (field.name) {
      if (seen.has(field.name)) errors.push(`Duplicate field name "${field.name}".`);
      seen.add(field.name);
    }

    if (field.optionsSourceField && !field.optionsByValue) {
      errors.push(`Field "${field.name ?? idx}" has optionsSourceField but no optionsByValue.`);
    }
    if (field.optionsByValue && !field.optionsSourceField) {
      errors.push(`Field "${field.name ?? idx}" has optionsByValue but no optionsSourceField.`);
    }
    if ((field.type === "Enum" || field.type === "EnumList") &&
        !field.options &&
        !field.enumCategory &&
        !field.optionsSourceField) {
      errors.push(`Field "${field.name ?? idx}" has no enum options source.`);
    }
  });

  return errors;
}

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

    if (action === "sendMessage" || action === "approveAction") {
      const history = Array.isArray(req.body?.history) ? req.body.history : [];
      const newMessage = String(req.body?.newMessage ?? "");
      const approvalMode = (req.body?.approvalMode as ApprovalMode) ?? ApprovalMode.PLAN;

      // Initialize Core Library
      const targetDir = os.tmpdir();
      const sessionId = req.body?.sessionId || `session-${Date.now()}`;
      const storage = new Storage(targetDir, sessionId);
      await storage.initialize();

      const coreConfig = new Config({
        sessionId,
        targetDir,
        cwd: targetDir,
        model: "gemini-2.5-flash",
        debugMode: true,
        approvalMode,
        plan: true,
        skillsSupport: true,
      });
      await coreConfig.initialize();

      const client = coreConfig.getGeminiClient();
      await client.initialize();

      // Convert history to Core format
      const coreHistory = history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{text: msg.text || msg.content || ""}],
      }));
      client.setHistory(coreHistory);

      const response = await client.generateContent("default" as any, [
        {role: "user", parts: [{text: newMessage}]},
      ], new AbortController().signal, "main" as any);

      const text = response.text || "No response generated.";

      res.status(200).json({
        ok: true, 
        text, 
        sessionId,
      });
      return;
    }

    const {GoogleGenAI} = await import("@google/genai");
    const ai: GoogleGenAIClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });

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

export const validateFormSchema = onRequest(async (req, res) => {
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
    const def = req.body?.tableDefinition as SchemaTableDefinition;
    const errors = validateSchemaTableDefinition(def ?? {});
    res.status(200).json({
      ok: errors.length === 0,
      errors,
    });
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ok: false, error: message});
    return;
  }
});

/**
 * Spanner Graph connectivity and optional read check.
 * Requires SPANNER_INSTANCE and SPANNER_DATABASE in functions env.
 * Optional: SPANNER_GRAPH_NAME (e.g. FinGraph) to run a trivial graph query.
 * Use a free trial instance to avoid cost: https://cloud.google.com/spanner/docs/free-trial-instance
 */
export const spannerGraphPing = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ok: false, error: "Use GET"});
    return;
  }

  const instanceId = process.env.SPANNER_INSTANCE ?? "";
  const databaseId = process.env.SPANNER_DATABASE ?? "";
  const graphName = process.env.SPANNER_GRAPH_NAME ?? "";

  if (!instanceId || !databaseId) {
    res.status(200).json({
      ok: true,
      configured: false,
      message:
        "Spanner Graph not configured. Set SPANNER_INSTANCE and SPANNER_DATABASE (and optionally SPANNER_GRAPH_NAME) in functions env. See docs/spanner-graph-setup.md.",
    });
    return;
  }

  try {
    const projectId = process.env.GCLOUD_PROJECT ?? process.env.VERTEX_PROJECT;
    if (!projectId) {
      res.status(500).json({ok: false, error: "Missing GCLOUD_PROJECT / VERTEX_PROJECT"});
      return;
    }

    const {Spanner} = await import("@google-cloud/spanner");
    const spanner = new Spanner({projectId});
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const [rows] = await database.run({sql: "SELECT 1 AS one"});
    const connected = rows.length > 0;

    if (!connected) {
      res.status(200).json({ok: false, configured: true, error: "Spanner returned no rows"});
      return;
    }

    let graphOk: boolean | null = null;
    let graphError: string | undefined;
    if (graphName) {
      try {
        const gql = `SELECT * FROM GRAPH_TABLE(${graphName} MATCH (n) RETURN n) LIMIT 1`;
        await database.run({sql: gql});
        graphOk = true;
      } catch (e) {
        graphOk = false;
        graphError = e instanceof Error ? e.message : String(e);
      }
    }

    res.status(200).json({
      ok: true,
      configured: true,
      spanner: "connected",
      graph: graphName ? (graphOk === true ? "ok" : graphError ?? "error") : "not_checked",
    });
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("spannerGraphPing failed", {message});
    res.status(500).json({ok: false, configured: true, error: message});
    return;
  }
});
