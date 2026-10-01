export interface ParsedPdfResult {
  text: string;
  pageCount: number;
  info?: any;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
  try {
    // Dynamic import to prevent bundler client-side issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return {
      text: data.text || "",
      pageCount: data.numpages || 1,
      info: data.info,
    };
  } catch (error) {
    console.error("Error parsing PDF with pdf-parse:", error);
    // Graceful fallback for demo/prototype files
    const fallbackText = buffer.toString("utf-8");
    return {
      text: fallbackText.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, " "),
      pageCount: 1,
    };
  }
}
