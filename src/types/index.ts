// ==========================================
// Cinder Bound — Core Types & Data Models
// ==========================================

export type EntityType =
  | "PERSON"
  | "PHONE"
  | "BANK_ACCOUNT"
  | "LOCATION"
  | "ORGANIZATION"
  | "VEHICLE"
  | "EVENT"
  | "TRANSACTION";

export type RelationshipType =
  | "USES"
  | "OWNS"
  | "CALLED"
  | "TRANSFERRED_TO"
  | "LOCATED_AT"
  | "ASSOCIATED_WITH";

export type DocumentType =
  | "FIR"
  | "CDR"
  | "BANK_STATEMENT"
  | "POLICE_REPORT"
  | "OTHER";

export type FileFormat = "pdf" | "csv" | "txt" | "doc" | "docx";

export interface ProvenanceInfo {
  documentId: string;
  documentName: string;
  page?: number;
  sourceText: string;
  confidence?: number;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  properties?: Record<string, string | number | boolean | null | undefined>;
  provenance: ProvenanceInfo;
}

export interface EventItem {
  id: string;
  name: string;
  type: string;
  timestamp?: string;
  description: string;
  location?: string;
  provenance: ProvenanceInfo;
}

export interface Relationship {
  id: string;
  source: string; // Entity or Event ID
  target: string; // Entity or Event ID
  type: RelationshipType;
  label?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  provenance: ProvenanceInfo;
}

export interface ExtractionResult {
  entities: Entity[];
  events: EventItem[];
  relationships: Relationship[];
}

export interface EvidenceDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileFormat: FileFormat;
  fileSize: number;
  rawContent: string;
  status: "uploaded" | "parsing" | "extracting" | "completed" | "error";
  error?: string;
  extractedData?: ExtractionResult;
  uploadedAt: string;
  pageCount?: number;
}

// React Flow Graph visualization types
export interface GraphNodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  type: EntityType;
  properties?: Record<string, any>;
  provenance: ProvenanceInfo;
  documentCount?: number;
  degree?: number;
  customColor?: string; // red, green, amber, purple, cyan, rose, blue, default
  containerId?: string; // ID of the container rectangle if grouped
}

export interface GroupNodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  color?: string;
  width?: number;
  height?: number;
  memberCount?: number;
  onDelete?: (id: string) => void;
  onResizeEnd?: (id: string, width: number, height: number) => void;
  onChangeColor?: (id: string, color: string) => void;
}

export interface GraphEdgeData {
  [key: string]: unknown;
  id: string;
  type: RelationshipType;
  label?: string;
  properties?: Record<string, any>;
  provenance: ProvenanceInfo;
}

