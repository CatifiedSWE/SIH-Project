# Data Model Specification — Cinder Bound

## 1. Domain Types

### Entity
```typescript
interface Entity {
  id: string;                                    // Unique identifier (e.g. "person_ravi_kumar")
  name: string;                                  // Canonical name / title
  type: EntityType;                              // PERSON | PHONE | BANK_ACCOUNT | LOCATION | ...
  properties?: Record<string, string | number | boolean | null | undefined>;
  provenance: ProvenanceInfo;                    // Verifiable source evidence
}
```

### Event
```typescript
interface EventItem {
  id: string;
  name: string;
  type: string;                                  // ROBBERY | EXTORTION | RAID | ...
  timestamp?: string;                            // ISO 8601 string
  description: string;
  location?: string;
  provenance: ProvenanceInfo;
}
```

### Relationship
```typescript
interface Relationship {
  id: string;
  source: string;                                // Source entity/event ID
  target: string;                                // Target entity/event ID
  type: RelationshipType;                        // USES | OWNS | CALLED | TRANSFERRED_TO | ...
  label?: string;                                // Human-readable edge label (e.g. "Called (3x)")
  properties?: Record<string, string | number | boolean | null | undefined>;
  provenance: ProvenanceInfo;
}
```

### ProvenanceInfo
```typescript
interface ProvenanceInfo {
  documentId: string;                            // ID of the source evidence file
  documentName: string;                          // Human-readable file name (e.g. "FIR_001.pdf")
  page?: number;                                 // Page index (1-based)
  sourceText: string;                            // Verbatim quote from original document
  confidence?: number;                           // Extraction confidence (0.0 to 1.0)
}
```

### EvidenceDocument
```typescript
interface EvidenceDocument {
  id: string;
  name: string;
  type: DocumentType;                            // FIR | CDR | BANK_STATEMENT | POLICE_REPORT | OTHER
  fileFormat: "pdf" | "csv" | "txt" | "doc";
  fileSize: number;                              // Bytes
  rawContent: string;                            // Extracted text content
  status: "uploaded" | "parsing" | "extracting" | "completed" | "error";
  extractedData?: ExtractionResult;
  uploadedAt: string;
  pageCount?: number;
}
```

---

## 2. Graph Canvas Visual Model

When multiple `EvidenceDocument` objects are processed, `buildGraphFromDocuments()` merges them into React Flow visual nodes and edges:

### GraphNodeData
```typescript
interface GraphNodeData {
  id: string;
  label: string;
  type: EntityType;
  properties?: Record<string, any>;
  provenance: ProvenanceInfo;
  documentCount?: number;                        // Number of distinct evidence documents mentioning this entity
  degree?: number;                               // Number of active edges connected to this entity
}
```

### GraphEdgeData
```typescript
interface GraphEdgeData {
  id: string;
  type: RelationshipType;
  label?: string;
  properties?: Record<string, any>;
  provenance: ProvenanceInfo;
}
```
