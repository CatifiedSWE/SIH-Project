import { DocumentType, ExtractionResult } from "@/types";

export interface ExtractionRequest {
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  content: string;
  pageCount?: number;
}

export interface IAIProvider {
  name: string;
  modelIdentifier: string;
  isAvailable(): boolean;
  extract(request: ExtractionRequest): Promise<ExtractionResult>;
}
