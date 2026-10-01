# Architecture Documentation — Cinder Bound

## 1. System Philosophy

Cinder Bound is built around a single, uncompromising premise:
> **Intelligence must be traceable to raw evidence.**

In forensic and criminal network investigations, automated intelligence that cannot cite its original source is inadmissible and operationally risky. Cinder Bound implements an end-to-end provenance pipeline where every graph node and edge is linked back to the exact document, page, and sentence where the fact originated.

```text
┌─────────────────┐
│  Raw Documents  │ (FIR.pdf, CDR.csv, Bank.csv, Dossier.txt)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client Parsers  │ (PDF text stream decoding, Papaparse, Text normalizers)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Type Detection  │ (Keyword heuristic & filename classifier)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Schema Registry │ (Independent schema definitions & extraction instructions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemma AI Engine │ (Gemma Provider abstraction / Heuristic offline fallback)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Structured JSON │ (Entities, Events, Relationships + Verbatim Provenance)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Builder  │ (Cross-document entity deduplication, degree, layout)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ React Flow View │ (Interactive canvas with click-through provenance highlighting)
└─────────────────┘
```

---

## 2. Layer & Module Responsibilities

### `src/types/index.ts`
Defines standard domain contracts:
- `EntityType`: `PERSON`, `PHONE`, `BANK_ACCOUNT`, `LOCATION`, `ORGANIZATION`, `VEHICLE`, `EVENT`, `TRANSACTION`
- `RelationshipType`: `USES`, `OWNS`, `CALLED`, `TRANSFERRED_TO`, `LOCATED_AT`, `ASSOCIATED_WITH`
- `ProvenanceInfo`: `documentId`, `documentName`, `page`, `sourceText`, `confidence`
- `ExtractionResult`: standard JSON returned by the AI

### `src/modules/schemas/`
Decouples domain knowledge from the AI inference engine.
- `fir.schema.ts`: Criminal case entities (accused, complainant, IPC sections, seized property).
- `cdr.schema.ts`: Telecommunication call records (MSISDN, IMEI, cell towers, duration).
- `bank.schema.ts`: Financial ledger records (accounts, beneficiaries, credit/debit tranches).
- `generic.schema.ts`: Unstructured intelligence dossiers and surveillance logs.
- `index.ts`: Central schema registry providing prompt guidelines without modifying the AI caller.

### `src/services/parser/`
Universal client-side file text extractors:
- `client-document-reader.ts`: Ingests `File` objects directly in the browser. Uses PDF text stream extraction, Papaparse for CSVs, and plain text cleaners.
- `document-detector.ts`: Inspects keywords to automatically classify uploaded files into FIR, CDR, Bank Statement, or Police Report.

### `src/services/ai/`
Pluggable AI provider abstraction:
- `ai-provider.interface.ts`: Standard interface `IAIProvider` with `extract(request: ExtractionRequest): Promise<ExtractionResult>`.
- `prompt-builder.ts`: Generates strict JSON schema prompts tailored to the document's type.
- `gemma-provider.ts`: Cloud/local Gemma client using Google AI Studio / Gemini 1.5 or Ollama.
- `heuristic-provider.ts`: Deterministic regex and pattern extraction engine for instant zero-configuration offline demos.
- `client-ai-extractor.ts`: High-level client orchestrator executing AI extraction and progress reporting.

### `src/services/storage/`
Local-first persistence:
- `local-storage.service.ts`: Stores uploaded documents, metadata, and extracted graphs inside browser `localStorage`.
- Zero backend dependencies required. Supports full JSON export and import for portable intelligence sharing.

### `src/modules/graph/`
Converts raw JSON extraction outputs into an interactive visual graph:
- `graph-builder.ts`: Merges duplicate entities appearing across multiple documents (e.g. suspect `Ravi Kumar` appearing in both an FIR and a Bank Statement).
- Calculates node connection degrees and circular/cluster layout coordinates.
- Maps entity types and relationships to custom React Flow nodes and styled edges.

---

## 3. How to Extend the System

### Adding a New Document Type (e.g., WhatsApp Chat Export)
1. Create `src/modules/schemas/whatsapp.schema.ts`:
   ```typescript
   export const whatsappDocumentConfig = {
     type: "WHATSAPP_CHAT",
     name: "WhatsApp Forensic Chat Export",
     promptInstructions: "Extract sender/receiver as PERSON/PHONE, messages discussing illegal activity as EVENT...",
   };
   ```
2. Register it in `src/modules/schemas/index.ts`.
3. Add keyword detection rules in `src/services/parser/document-detector.ts`.
*No changes are required to the AI engine or Graph Canvas!*

### Adding a New AI Model (e.g., Local Llama 3 or Mistral)
1. Implement the `IAIProvider` interface in `src/services/ai/`:
   ```typescript
   export class LlamaProvider implements IAIProvider {
     name = "Local Llama 3";
     modelIdentifier = "llama3:8b";
     async extract(request: ExtractionRequest): Promise<ExtractionResult> {
       // Call your inference endpoint...
     }
   }
   ```
2. Register it in `src/services/ai/index.ts`.
