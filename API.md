# API & Service Contracts — Cinder Bound

## 1. Overview

Cinder Bound is built as a self-contained, client-first application where services communicate through strongly-typed TypeScript interfaces. This design ensures that adding a backend server (e.g. Supabase, FastAPI, or Node.js) in the future requires zero changes to the UI or graph components.

---

## 2. Core Service Interfaces

### AI Extractor Service (`ClientAIExtractor`)

```typescript
static async extractDocumentWithAI(
  options: ClientExtractionOptions,
  onProgress?: (status: string) => void
): Promise<ExtractionResult>
```

**Parameters:**
- `options.documentId`: `string`
- `options.documentName`: `string`
- `options.documentType`: `"FIR" | "CDR" | "BANK_STATEMENT" | "POLICE_REPORT" | "OTHER"`
- `options.rawText`: `string` (Extracted plain text of the document)
- `options.pageCount`: `number` (optional, defaults to 1)
- `options.apiKey`: `string` (optional, overrides stored API key)
- `onProgress`: Callback receiving human-readable status updates (e.g. `"Sending document to AI Model..."`)

**Returns:**
- `Promise<ExtractionResult>` (`{ entities: Entity[]; events: EventItem[]; relationships: Relationship[] }`)

---

### Document Reader Service (`readEvidenceFileInBrowser`)

```typescript
export async function readEvidenceFileInBrowser(
  file: File
): Promise<ClientParsedDocument>
```

**Input:** Browser native `File` object (PDF, CSV, TXT, DOC).  
**Output:**
```typescript
interface ClientParsedDocument {
  name: string;
  fileFormat: "pdf" | "csv" | "txt" | "doc";
  fileSize: number;
  detectedType: DocumentType;
  rawContent: string;
  pageCount: number;
}
```

---

### Local Storage Vault (`LocalStorageService`)

```typescript
class LocalStorageService {
  static getDocuments(): EvidenceDocument[];
  static saveDocument(doc: EvidenceDocument): void;
  static updateDocument(id: string, updates: Partial<EvidenceDocument>): void;
  static removeDocument(id: string): void;
  static clearAll(): void;
  static getSettings(): WorkspaceSettings;
  static saveSettings(settings: Partial<WorkspaceSettings>): void;
  static exportWorkspace(): string;
  static importWorkspace(jsonString: string): boolean;
}
```

---

### Graph Builder (`buildGraphFromDocuments`)

```typescript
export function buildGraphFromDocuments(
  documents: EvidenceDocument[]
): GraphBuildResult
```

**Input:** Array of completed `EvidenceDocument` objects with extracted data.  
**Output:**
```typescript
interface GraphBuildResult {
  nodes: Node<GraphNodeData>[];
  edges: Edge<GraphEdgeData>[];
  stats: {
    totalEntities: number;
    totalRelationships: number;
    entityTypeCounts: Record<EntityType, number>;
  };
}
```
