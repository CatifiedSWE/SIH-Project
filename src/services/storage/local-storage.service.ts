import { EvidenceDocument } from "@/types";

const STORAGE_KEY = "cinder_bound_local_evidence_v1";
const SETTINGS_KEY = "cinder_bound_local_settings_v1";

export interface WorkspaceSettings {
  apiKey?: string;
  model: string;
  providerType: "ollama" | "gemini" | "simulation";
  ollamaUrl?: string;
}

export const defaultSettings: WorkspaceSettings = {
  apiKey: "",
  model: "gemma4:2b",
  providerType: "ollama",
  ollamaUrl: "http://127.0.0.1:11434",
};

export class LocalStorageService {
  /**
   * Retrieve all saved evidence documents stored in the user's browser.
   */
  static getDocuments(): EvidenceDocument[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as EvidenceDocument[];
    } catch (e) {
      console.error("Failed to load local evidence documents:", e);
      return [];
    }
  }

  /**
   * Save or update an evidence document locally.
   */
  static saveDocument(doc: EvidenceDocument): void {
    if (typeof window === "undefined") return;
    try {
      const docs = this.getDocuments();
      const existingIdx = docs.findIndex((d) => d.id === doc.id);
      if (existingIdx >= 0) {
        docs[existingIdx] = doc;
      } else {
        docs.unshift(doc);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error("Failed to save local evidence document:", e);
    }
  }

  /**
   * Update fields of a specific document.
   */
  static updateDocument(id: string, updates: Partial<EvidenceDocument>): void {
    if (typeof window === "undefined") return;
    const docs = this.getDocuments();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx >= 0) {
      docs[idx] = { ...docs[idx], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    }
  }

  /**
   * Remove a document by ID from local storage.
   */
  static removeDocument(id: string): void {
    if (typeof window === "undefined") return;
    const docs = this.getDocuments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }

  /**
   * Clear all stored local documents.
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get workspace settings (e.g. local API key, model selection).
   */
  static getSettings(): WorkspaceSettings {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch {
      return defaultSettings;
    }
  }

  /**
   * Save workspace settings locally.
   */
  static saveSettings(settings: Partial<WorkspaceSettings>): void {
    if (typeof window === "undefined") return;
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  /**
   * Export the entire local workspace state as a JSON file download.
   */
  static exportWorkspace(): string {
    const docs = this.getDocuments();
    const settings = this.getSettings();
    return JSON.stringify(
      {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        documents: docs,
        settings: { ...settings, apiKey: undefined }, // Omit API key for security
      },
      null,
      2
    );
  }

  /**
   * Import workspace state from a JSON string.
   */
  static importWorkspace(jsonString: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.documents)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.documents));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
