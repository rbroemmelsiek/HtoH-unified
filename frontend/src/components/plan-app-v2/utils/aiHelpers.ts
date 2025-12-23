
import { GoogleGenAI } from "@google/genai";
import { PlanRow, PlanDocument, PlanRowType } from "../types";
import { findParent } from "./planHelpers";

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

/**
 * Autocomplete: Predicts the completion of a partial string.
 * Mimics Cursor Tab behavior.
 */
export const getAutocompleteSuggestion = async (
  partialText: string,
  row: PlanRow,
  plan: PlanDocument
): Promise<string> => {
  if (!partialText || partialText.length < 2) return "";

  __agentLog('H2','aiHelpers.ts:autocomplete:hasKey','autocomplete key check',{hasKey: !!process.env.API_KEY, keyLen: (process.env.API_KEY||'').length});

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const parent = findParent(plan.root, row.eid);
  const contextName = (parent as any)?.name || plan.name;
  const siblings = parent?.children.map(s => s.name).filter(n => n && n !== partialText) || [];

  const prompt = `
    Context: A hierarchical project plan titled "${plan.name}".
    Current Section: "${contextName}"
    Existing items: ${siblings.join(', ')}
    
    The user is typing a ${row.type} name: "${partialText}"
    
    Predict the rest of the text. 
    - Provide ONLY the remaining part of the string. 
    - DO NOT repeat the words the user has already typed ("${partialText}").
    - If the next word is not a continuation of the current word, INCLUDE a leading space.
    - If no logical completion, return nothing.
    - Keep it concise (1-5 words).
    - Example: User types "Book fli", you return "ghts to Paris".
    - Example: User types "Plan a trip", you return " to Yosemite".
  `;

    __agentLog('H2','aiHelpers.ts:autocomplete:request','autocomplete request',{model:'gemini-3-flash-preview', textLen: partialText.length});

  __agentLog('H2','aiHelpers.ts:bulk:request','bulk request',{model:'gemini-3-flash-preview', parentEid: parentRow.eid});

try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    
    let suggestion = response.text || "";
    
    // Safety check: strip any accidental repetition if the model ignored the instruction
    const lowerPartial = partialText.toLowerCase().trim();
    const lowerSugg = suggestion.toLowerCase().trim();
    
    if (lowerSugg.startsWith(lowerPartial)) {
      suggestion = suggestion.substring(partialText.length).trim();
      // Ensure we have a leading space if we trimmed text
      if (suggestion && !suggestion.startsWith(" ")) {
        suggestion = " " + suggestion;
      }
    }
    
    // Ensure if we have text and no space, and partial doesn't end in space, we add one
    if (suggestion && !suggestion.startsWith(" ") && !partialText.endsWith(" ")) {
        suggestion = " " + suggestion;
    }
    
    return suggestion;
  } catch (e) {
    __agentLog('H2','aiHelpers.ts:autocomplete:error','autocomplete error',{name: (e && e.name) ? e.name : typeof e, message: (e && e.message) ? e.message : String(e)});
    console.error("Autocomplete Error:", e);
    return "";
  }
};

/**
 * Bulk Generation: Generates a list of logical subtasks for a parent.
 */
export interface GeneratedTask {
  name: string;
  type: PlanRowType;
  tooltip: string;
}

export const getBulkSubtasks = async (
  parentRow: PlanRow,
  plan: PlanDocument
): Promise<GeneratedTask[]> => {
  __agentLog('H2','aiHelpers.ts:bulk:hasKey','bulk key check',{hasKey: !!process.env.API_KEY, keyLen: (process.env.API_KEY||'').length, parentEid: parentRow.eid});

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  const prompt = `
    Context: "${plan.name}" -> "${parentRow.name}"
    
    Task: Generate 5-7 logical, detailed subtasks for this section. 
    Mix types: 'checkbox' for actions, 'link' for resources, 'text' for headers.

    IMPORTANT: For each item, provide a "tooltip" which is a LONG, DETAILED CONTEXTUAL DESCRIPTION (30-50 words). 
    This tooltip must explain the reasoning, specific steps, and relationship to the parent goal to help guide an LLM agent.
    
    Return a valid JSON array of objects: [{"name": string, "type": "checkbox"|"text"|"link", "tooltip": string}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    __agentLog('H2','aiHelpers.ts:bulk:error','bulk error',{name: (e && e.name) ? e.name : typeof e, message: (e && e.message) ? e.message : String(e)});
    console.error("Bulk Generation Error:", e);
    return [];
  }
};

/**
 * Legacy suggestion for empty rows
 */
export const getTaskSuggestion = async (
  row: PlanRow,
  plan: PlanDocument
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const parent = findParent(plan.root, row.eid);
  if (!parent) return "";
  const contextName = (parent as any)?.eid ? (parent as any).name : plan.name;
  const siblings = parent.children.map(s => s.name).filter(Boolean);
  
  const prompt = `Suggest a concise name for a new ${row.type} in "${contextName}". 
    Existing items: ${siblings.join(', ')}. Return ONLY the text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (e) {
    return "";
  }
};
