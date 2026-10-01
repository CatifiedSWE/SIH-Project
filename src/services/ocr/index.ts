/**
 * OCR Service Abstraction
 * Supports pluggable OCR providers (Tesseract, Google Cloud Vision, AWS Textract)
 * for scanned police documents and non-selectable image PDFs.
 */

export interface IOCRService {
  name: string;
  extractTextFromImage(imageBuffer: Buffer): Promise<string>;
}

export class MockOCRService implements IOCRService {
  name = "Standard OCR Service";

  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    // In prototype, return decoded buffer text or placeholder
    return imageBuffer.toString("utf-8");
  }
}

export const defaultOCRService = new MockOCRService();
