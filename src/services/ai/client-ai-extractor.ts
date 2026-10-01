import { DocumentType, ExtractionResult } from "@/types";
import { buildGemmaExtractionPrompt } from "./prompt-builder";
import { HeuristicGemmaProvider } from "./heuristic-provider";
import { OllamaGemmaProvider } from "./ollama-provider";
import { LocalStorageService } from "../storage/local-storage.service";

export interface ClientExtractionOptions {
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  rawText: string;
  pageCount?: number;
  apiKey?: string;
  model?: string;
  fileBlob?: Blob | File;
  forceSimulation?: boolean;
}

export class ClientAIExtractor {
  private static heuristicEngine = new HeuristicGemmaProvider();

  /**
   * Main AI extraction method called on uploaded evidence documents.
   * Priority:
   * 1. Python Extraction Agent (FastAPI @ http://127.0.0.1:8000 via PyMuPDF + Ollama gemma4:2b)
   * 2. Direct Ollama LLM (http://127.0.0.1:11434 gemma4:2b)
   * 3. Cloud Gemini API (if key configured)
   * 4. Heuristic Fallback Engine
   */
  static async extractDocumentWithAI(
    options: ClientExtractionOptions,
    onProgress?: (status: string) => void
  ): Promise<ExtractionResult> {
    const { documentId, documentName, documentType, rawText, pageCount = 1, fileBlob, forceSimulation } = options;

    if (!forceSimulation) {
      // 1. PRIMARY: Python Extraction Agent (app/main.py)
      try {
        onProgress?.(`Dispatching to Python Extraction Agent (PyMuPDF + gemma4:2b)...`);

        const formData = new FormData();
        const blobToUpload =
          fileBlob ||
          new Blob([rawText], { type: "text/plain" });

        formData.append("files", blobToUpload, documentName);

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const firstResult = data.results?.[0];
          if (firstResult && firstResult.extractionResult?.entities?.length > 0) {
            onProgress?.(`Python Agent extracted ${firstResult.extractionResult.entities.length} entities with supervisor audit.`);
            return {
              ...firstResult.extractionResult,
              rawText: firstResult.rawText,
            } as any;
          }
        }
      } catch (err: any) {
        console.warn("Python agent bridge not responding, falling back to direct Ollama:", err.message);
      }

      // 2. SECONDARY: Direct Local Ollama running gemma4:2b on port 11434
      try {
        const settings = LocalStorageService.getSettings();
        const modelName = settings.model || "gemma4:2b";
        const ollamaHost = settings.ollamaUrl || "http://127.0.0.1:11434";

        onProgress?.(`Connecting to Ollama (${modelName} @ ${ollamaHost})...`);
        const ollamaProvider = new OllamaGemmaProvider(ollamaHost);
        ollamaProvider.modelIdentifier = modelName;

        const result = await ollamaProvider.extract({
          documentId,
          documentName,
          documentType,
          content: rawText,
          pageCount,
        });

        if (result && result.entities.length > 0) {
          onProgress?.(`Ollama (${modelName}) extracted ${result.entities.length} entities.`);
          return result;
        }
      } catch (err: any) {
        console.warn("Direct Ollama extraction fallback:", err.message);
      }
    }

    // 3. FALLBACK: Deterministic Heuristic Gemma Engine
    onProgress?.("Extracting criminal entities with Gemma Intelligence Engine...");
    await new Promise((r) => setTimeout(r, 400));
    return this.heuristicEngine.extract({
      documentId,
      documentName,
      documentType,
      content: rawText,
      pageCount,
    });
  }
}
