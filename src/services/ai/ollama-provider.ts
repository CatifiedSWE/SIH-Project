import { ExtractionResult, Entity, EventItem, Relationship, EntityType, RelationshipType } from "@/types";
import { ExtractionRequest, IAIProvider } from "./ai-provider.interface";
import { buildGemmaExtractionPrompt } from "./prompt-builder";

export class OllamaGemmaProvider implements IAIProvider {
  name = "Local Ollama Gemma Engine";
  modelIdentifier = "gemma4:2b";
  private baseUrl: string;

  constructor(baseUrl: string = "http://127.0.0.1:11434") {
    this.baseUrl = baseUrl;
  }

  isAvailable(): boolean {
    return true;
  }

  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const prompt = buildGemmaExtractionPrompt(
      request.documentType,
      request.documentName,
      request.content
    );

    let rawJsonText = "";

    // 1. First attempt: call local proxy /api/ollama (works across all browsers with zero CORS issues)
    try {
      const proxyRes = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelIdentifier,
          prompt,
        }),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        rawJsonText = data.response;
      }
    } catch (e) {
      console.warn("Proxy call to /api/ollama failed, trying direct 127.0.0.1:11434...", e);
    }

    // 2. Second attempt: call direct http://127.0.0.1:11434/api/generate
    if (!rawJsonText) {
      const directRes = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelIdentifier,
          prompt,
          format: "json",
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 2048,
          },
        }),
      });

      if (!directRes.ok) {
        throw new Error(`Ollama returned status ${directRes.status}: ${directRes.statusText}`);
      }

      const data = await directRes.json();
      rawJsonText = data.response;
    }

    if (!rawJsonText) {
      throw new Error("No response received from Ollama model");
    }

    // Clean JSON and strip code block markers if present
    const cleanJson = rawJsonText
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Normalize entity types to match schema
    const entities: Entity[] = (parsed.entities || []).map((e: any, idx: number) => {
      let normalizedType: EntityType = "PERSON";
      const rawType = (e.type || "").toUpperCase().replace(/[\s-]/g, "_");

      if (rawType.includes("PHONE")) normalizedType = "PHONE";
      else if (rawType.includes("BANK") || rawType.includes("ACCOUNT")) normalizedType = "BANK_ACCOUNT";
      else if (rawType.includes("LOC") || rawType.includes("CITY") || rawType.includes("ADDRESS")) normalizedType = "LOCATION";
      else if (rawType.includes("ORG") || rawType.includes("COMPANY") || rawType.includes("GANG")) normalizedType = "ORGANIZATION";
      else if (rawType.includes("VEHICLE") || rawType.includes("CAR")) normalizedType = "VEHICLE";
      else if (rawType.includes("EVENT") || rawType.includes("CRIME")) normalizedType = "EVENT";
      else if (rawType.includes("TRANS") || rawType.includes("PAYMENT")) normalizedType = "TRANSACTION";
      else normalizedType = "PERSON";

      const entId = e.id || `ent_${request.documentId}_${idx}`;

      return {
        id: entId,
        name: e.name || "Unknown Entity",
        type: normalizedType,
        properties: e.properties || {},
        provenance: {
          documentId: request.documentId,
          documentName: request.documentName,
          page: e.provenance?.page || 1,
          sourceText: e.provenance?.sourceText || e.sourceText || e.name || "Identified in document",
          confidence: e.provenance?.confidence || 0.95,
        },
      };
    });

    const events: EventItem[] = (parsed.events || []).map((ev: any, idx: number) => ({
      id: ev.id || `ev_${request.documentId}_${idx}`,
      name: ev.name || "Incident Event",
      type: ev.type || "CRIMINAL_CASE",
      timestamp: ev.timestamp,
      description: ev.description || ev.name,
      location: ev.location,
      provenance: {
        documentId: request.documentId,
        documentName: request.documentName,
        page: ev.provenance?.page || 1,
        sourceText: ev.provenance?.sourceText || ev.sourceText || ev.name,
        confidence: ev.provenance?.confidence || 0.92,
      },
    }));

    const relationships: Relationship[] = (parsed.relationships || []).map((r: any, idx: number) => {
      let relType: RelationshipType = "ASSOCIATED_WITH";
      const rawRel = (r.type || "").toUpperCase().replace(/[\s-]/g, "_");

      if (rawRel.includes("USE")) relType = "USES";
      else if (rawRel.includes("OWN")) relType = "OWNS";
      else if (rawRel.includes("CALL")) relType = "CALLED";
      else if (rawRel.includes("TRANS")) relType = "TRANSFERRED_TO";
      else if (rawRel.includes("LOCAT")) relType = "LOCATED_AT";
      else relType = "ASSOCIATED_WITH";

      return {
        id: r.id || `rel_${request.documentId}_${idx}`,
        source: r.source,
        target: r.target,
        type: relType,
        label: r.label || relType.replace(/_/g, " "),
        properties: r.properties || {},
        provenance: {
          documentId: request.documentId,
          documentName: request.documentName,
          page: r.provenance?.page || 1,
          sourceText: r.provenance?.sourceText || r.sourceText || r.label || "Connected in evidence",
          confidence: r.provenance?.confidence || 0.94,
        },
      };
    });

    return {
      entities,
      events,
      relationships,
    };
  }
}
