import { DocumentType } from "@/types";
import { firDocumentConfig } from "./fir.schema";
import { cdrDocumentConfig } from "./cdr.schema";
import { bankDocumentConfig } from "./bank.schema";
import { genericDocumentConfig } from "./generic.schema";

export * from "./fir.schema";
export * from "./cdr.schema";
export * from "./bank.schema";
export * from "./generic.schema";

export interface DocumentSchemaConfig {
  type: DocumentType;
  name: string;
  description: string;
  promptInstructions: string;
}

export const SCHEMA_REGISTRY: Record<DocumentType, DocumentSchemaConfig> = {
  FIR: firDocumentConfig,
  CDR: cdrDocumentConfig,
  BANK_STATEMENT: bankDocumentConfig,
  POLICE_REPORT: genericDocumentConfig,
  OTHER: {
    type: "OTHER",
    name: "General Evidentiary Document",
    description: "Unclassified evidentiary artifact.",
    promptInstructions: `
Extract all entities (PERSON, PHONE, BANK_ACCOUNT, LOCATION, ORGANIZATION, VEHICLE, EVENT, TRANSACTION)
and relationships (USES, OWNS, CALLED, TRANSFERRED_TO, LOCATED_AT, ASSOCIATED_WITH).
Ensure strict JSON output with exact textual quotes for provenance.
`,
  },
};

/**
 * Get schema configuration for a document type.
 * Easily extensible for future document types (e.g. Forensics, WhatsApp chats, Geolocation logs).
 */
export function getSchemaForDocumentType(type: DocumentType): DocumentSchemaConfig {
  return SCHEMA_REGISTRY[type] || SCHEMA_REGISTRY.OTHER;
}
