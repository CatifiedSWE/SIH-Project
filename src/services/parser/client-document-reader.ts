import Papa from "papaparse";
import { DocumentType, FileFormat } from "@/types";
import { detectDocumentType } from "./document-detector";

export interface ClientParsedDocument {
  name: string;
  fileFormat: FileFormat;
  fileSize: number;
  detectedType: DocumentType;
  rawContent: string;
  pageCount: number;
}

/**
 * Extracts plain text from a PDF ArrayBuffer directly in the browser
 * without requiring any server-side dependencies.
 */
export async function extractTextFromPdfInBrowser(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  // Method 1: Check if PDF.js is available on window or dynamically load it
  if (typeof window !== "undefined") {
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += `[PAGE ${i}]\n${pageText}\n\n`;
        }
        return { text: fullText.trim(), pageCount: numPages };
      }
    } catch (e) {
      console.warn("PDF.js dynamic parsing fallback:", e);
    }
  }

  // Method 2: High-accuracy binary text stream decoder for client-side PDFs
  const bytes = new Uint8Array(arrayBuffer);
  let binaryString = "";
  // Process in chunks to prevent stack limits
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  // Look for text blocks in PDF streams: BT ... ET
  const textBlocks: string[] = [];
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;
  let pageCount = 1;

  // Count pages if /Type /Page exists
  const pageMatches = binaryString.match(/\/Type\s*\/Page\b/g);
  if (pageMatches && pageMatches.length > 0) {
    pageCount = pageMatches.length;
  }

  while ((match = btEtRegex.exec(binaryString)) !== null) {
    const blockContent = match[1];
    // Extract text in parentheses (text) or hex <hex>
    const stringRegex = /\((.*?)\)\s*T[jJ]|\((.*?)\)\s*'|\((.*?)\)\s*"/g;
    let sMatch;
    let line = "";
    while ((sMatch = stringRegex.exec(blockContent)) !== null) {
      const captured = sMatch[1] || sMatch[2] || sMatch[3];
      if (captured) {
        // Clean escaped characters
        const cleaned = captured
          .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\([nrtbf\\()])/g, (_, ch) => {
            switch (ch) {
              case "n": return "\n";
              case "r": return "\r";
              case "t": return "\t";
              default: return ch;
            }
          });
        line += cleaned + " ";
      }
    }
    if (line.trim().length > 0) {
      textBlocks.push(line.trim());
    }
  }

  let extracted = textBlocks.join("\n");

  // If text streams were compressed and returned empty, extract printable strings from the buffer
  if (extracted.trim().length < 20) {
    const printableRegex = /[\x20-\x7E\r\n\t]{4,}/g;
    const foundStrings = binaryString.match(printableRegex) || [];
    // Filter out PDF internal syntax keywords
    const filtered = foundStrings.filter(s =>
      !s.startsWith("/") &&
      !s.startsWith("endobj") &&
      !s.startsWith("xref") &&
      !s.includes("FontDescriptor")
    );
    extracted = filtered.join("\n");
  }

  return {
    text: extracted.trim() || "Empty PDF document or encrypted content.",
    pageCount: Math.max(pageCount, 1),
  };
}

/**
 * Universal browser-side reader for all supported file formats.
 */
export async function readEvidenceFileInBrowser(file: File): Promise<ClientParsedDocument> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  let fileFormat: FileFormat = "txt";

  if (ext === "pdf") fileFormat = "pdf";
  else if (ext === "csv") fileFormat = "csv";
  else if (ext === "doc" || ext === "docx") fileFormat = "doc";
  else fileFormat = "txt";

  let rawContent = "";
  let pageCount = 1;

  if (fileFormat === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdfRes = await extractTextFromPdfInBrowser(arrayBuffer);
    rawContent = pdfRes.text;
    pageCount = pdfRes.pageCount;
  } else if (fileFormat === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    const headers = parsed.meta.fields || [];
    let formatted = `CSV CALL / TRANSACTION DUMP (${parsed.data.length} records):\n`;
    formatted += `Columns: ${headers.join(" | ")}\n\n`;
    parsed.data.forEach((row, i) => {
      const entries = Object.entries(row)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      formatted += `[Record ${i + 1}] ${entries}\n`;
    });
    rawContent = formatted;
  } else {
    // txt, doc, etc.
    rawContent = await file.text();
  }

  const detectedType = detectDocumentType(fileName, rawContent);

  return {
    name: fileName,
    fileFormat,
    fileSize: file.size,
    detectedType,
    rawContent,
    pageCount,
  };
}
