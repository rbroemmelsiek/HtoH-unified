
import { BookPageData, LessonDifficulty } from "../types";

export class GeminiService {
  private bookContext: string;
  private readonly proxyUrl: string;

  constructor(_apiKey: string, bookData: BookPageData[]) {
    this.bookContext = JSON.stringify(bookData);
    this.proxyUrl =
      (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_GEMINI_PROXY_URL : undefined) ||
      "https://us-central1-htoh-3-0.cloudfunctions.net/geminiProxy";
  }

  private async callProxy(action: string, payload: Record<string, unknown>) {
    const response = await fetch(this.proxyUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({action, ...payload}),
    });
    if (!response.ok) {
      throw new Error(`geminiProxy HTTP ${response.status}`);
    }
    return response.json();
  }

  async getChatResponse(
    message: string, 
    currentPage: number, 
    history: { role: string, content: string }[],
    isLesson: boolean = false,
    difficulty: LessonDifficulty | null = null
  ) {
    const payload = await this.callProxy("academyChat", {
      message,
      currentPage,
      history,
      isLesson,
      difficulty,
      bookContext: this.bookContext,
    });

    return {
      text: payload?.text || "",
      navHint: payload?.navHint,
      isCorrect: payload?.isCorrect,
    };
  }

  async generateTTS(text: string): Promise<string> {
    const payload = await this.callProxy("academyTts", {text});
    return String(payload?.base64 || "");
  }
}
