
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BookPageData, LessonDifficulty } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private bookContext: string;

  constructor(apiKey: string, bookData: BookPageData[]) {
    this.ai = new GoogleGenAI({ apiKey });
    this.bookContext = JSON.stringify(bookData);
  }

  async getChatResponse(
    message: string, 
    currentPage: number, 
    history: { role: string, content: string }[],
    isLesson: boolean = false,
    difficulty: LessonDifficulty | null = null
  ) {
    const tutorInstruction = isLesson 
      ? `You are currently in LESSON MODE (Difficulty: ${difficulty}). 
         1. If the user hasn't started, present a scenario or question related to the "Code of Ethics".
         2. If the user answered a previous question, provide instant feedback (Correct/Incorrect + why).
         3. Use the book data to formulate real estate case studies.
         4. You can suggest a 'navHint' to a specific page to help them find the answer.`
      : `You are the "Ai Ethics Advisor" for HomeToHome.Ai. Use the book context to answer questions professionally.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `${tutorInstruction}
        The user is currently viewing page ${currentPage}. 
        Book Context: ${this.bookContext}
        
        Respond in JSON format with:
        1. "text": Your response (the lesson question or feedback).
        2. "navHint": (Optional) A page number to jump to.
        3. "isCorrect": (Optional, for feedback) boolean if they answered correctly.
        
        Always maintain a helpful, risk-mitigating, and ethical tone.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            navHint: { type: Type.INTEGER },
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["text"]
        }
      }
    });

    try {
      const responseText = response.text || "{}";
      return JSON.parse(responseText);
    } catch (e) {
      return { text: response.text || "" };
    }
  }

  async generateTTS(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this lesson part clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  }
}
