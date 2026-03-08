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
