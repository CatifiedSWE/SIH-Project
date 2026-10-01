import { FileFormat, DocumentType } from "@/types";
import { parseCsvContent } from "./csv.parser";
import { parsePdfBuffer } from "./pdf.parser";
import { parsePlainText } from "./text.parser";
import { detectDocumentType } from "./document-detector";

export * from "./document-detector";
export * from "./csv.parser";
export * from "./pdf.parser";
export * from "./text.parser";

export interface DocumentParseOutput {
  rawText: string;
  detectedType: DocumentType;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export async function parseDocument(
  fileBuffer: Buffer,
  fileName: string,
  fileFormat: FileFormat
): Promise<DocumentParseOutput> {
  let rawText = "";
  let pageCount = 1;
  const metadata: Record<string, any> = {};

  if (fileFormat === "pdf") {
    const pdfRes = await parsePdfBuffer(fileBuffer);
    rawText = pdfRes.text;
    pageCount = pdfRes.pageCount;
    metadata.info = pdfRes.info;
  } else if (fileFormat === "csv") {
    const csvString = fileBuffer.toString("utf-8");
    const csvRes = parseCsvContent(csvString);
    rawText = csvRes.formattedText;
    metadata.headers = csvRes.headers;
    metadata.rowCount = csvRes.rows.length;
  } else {
    // txt, doc, docx, logs
    const textString = fileBuffer.toString("utf-8");
    rawText = parsePlainText(textString);
  }

  const detectedType = detectDocumentType(fileName, rawText);

  return {
    rawText,
    detectedType,
    pageCount,
    metadata,
  };
}
