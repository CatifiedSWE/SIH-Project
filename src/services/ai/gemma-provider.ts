import { ExtractionResult } from "@/types";
import { ExtractionRequest, IAIProvider } from "./ai-provider.interface";
import { buildGemmaExtractionPrompt } from "./prompt-builder";
import { HeuristicGemmaProvider } from "./heuristic-provider";

export class GemmaProvider implements IAIProvider {
  name = "Gemma Intelligence Extraction Provider";
  modelIdentifier = "gemma-2-9b-it";
  private heuristicFallback = new HeuristicGemmaProvider();

  isAvailable(): boolean {
    return Boolean(
      process.env.GEMMA_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OLLAMA_URL
    );
  }

  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const apiKey = process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY;
    const prompt = buildGemmaExtractionPrompt(
      request.documentType,
      request.documentName,
      request.content
    );

    // If an API key is provided, invoke the Google Generative Language API
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!response.ok) {
          console.warn(`Gemma API returned status ${response.status}. Falling back to Heuristic Engine.`);
          return this.heuristicFallback.extract(request);
        }

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawJsonText) {
          // Parse JSON, strip any markdown backticks if present
          const cleanJson = rawJsonText.replace(/```json\s*|```/g, "").trim();
          const parsed = JSON.parse(cleanJson);

          return {
            entities: (parsed.entities || []).map((e: any) => ({
              ...e,
              provenance: {
                documentId: request.documentId,
                documentName: request.documentName,
                page: e.provenance?.page || 1,
                sourceText: e.provenance?.sourceText || e.name,
                confidence: e.provenance?.confidence || 0.95,
              },
            })),
            events: (parsed.events || []).map((ev: any) => ({
              ...ev,
              provenance: {
                documentId: request.documentId,
                documentName: request.documentName,
                page: ev.provenance?.page || 1,
                sourceText: ev.provenance?.sourceText || ev.name,
                confidence: ev.provenance?.confidence || 0.9,
              },
            })),
            relationships: (parsed.relationships || []).map((r: any) => ({
              ...r,
              provenance: {
                documentId: request.documentId,
                documentName: request.documentName,
                page: r.provenance?.page || 1,
                sourceText: r.provenance?.sourceText || r.label || r.type,
                confidence: r.provenance?.confidence || 0.95,
              },
            })),
          };
        }
      } catch (err) {
        console.error("Gemma API extraction error, employing fallback:", err);
      }
    }

    // Default to deterministic heuristic provider for prototype robustness
    return this.heuristicFallback.extract(request);
  }
}
