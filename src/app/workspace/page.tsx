"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { EvidenceDocument } from "@/types";
import { LocalStorageService } from "@/services/storage/local-storage.service";
import { readEvidenceFileInBrowser } from "@/services/parser/client-document-reader";
import { ClientAIExtractor } from "@/services/ai/client-ai-extractor";
import { buildGraphFromDocuments } from "@/modules/graph/graph-builder";
import { DEMO_EVIDENCE_DOCUMENTS } from "@/config/demo-data";

import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { EvidenceSidebar } from "@/components/evidence/EvidenceSidebar";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { DocumentInspector } from "@/components/evidence/DocumentInspector";
import { SettingsModal } from "@/components/workspace/SettingsModal";

export default function WorkspacePage() {
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDocForInspector, setSelectedDocForInspector] = useState<EvidenceDocument | null>(null);
  const [inspectorHighlightSnippet, setInspectorHighlightSnippet] = useState<string | undefined>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState("");

  // Load documents from local storage on mount
  useEffect(() => {
    const savedDocs = LocalStorageService.getDocuments();
    if (savedDocs.length > 0) {
      setDocuments(savedDocs);
    } else {
      // Auto-load demo pack on first visit for instant delight!
      loadDemoPackInternal();
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage whenever documents change
  useEffect(() => {
    if (isInitialized) {
      // Update local storage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "cinder_bound_local_evidence_v1",
          JSON.stringify(documents)
        );
      }
    }
  }, [documents, isInitialized]);

  // AI Extraction pipeline for a document
  const processDocumentWithAI = useCallback(
    async (doc: EvidenceDocument, fileBlob?: Blob | File) => {
      // 1. Mark parsing
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: "parsing" } : d))
      );
      setProcessingStatusText(`Parsing text from ${doc.name}...`);

      try {
        // 2. Mark AI extracting
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: "extracting" } : d))
        );
        setProcessingStatusText(`Python Agent extracting entities from ${doc.name}...`);

        const extractionResult = await ClientAIExtractor.extractDocumentWithAI(
          {
            documentId: doc.id,
            documentName: doc.name,
            documentType: doc.type,
            rawText: doc.rawContent,
            pageCount: doc.pageCount || 1,
            fileBlob,
          },
          (status) => setProcessingStatusText(status)
        );

        // 3. Mark completed
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: "completed",
                  rawContent: (extractionResult as any)?.rawText || d.rawContent,
                  extractedData: extractionResult,
                }
              : d
          )
        );
      } catch (err: any) {
        console.error("Extraction error:", err);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, status: "error", error: err.message || "Extraction failed" }
              : d
          )
        );
      }
    },
    []
  );

  // Upload handler for multiple evidence files (PDF, CSV, TXT, DOC)
  const handleUploadFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      setProcessingStatusText(`Reading ${file.name}...`);
      try {
        const parsed = await readEvidenceFileInBrowser(file);
        const newDoc: EvidenceDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: parsed.name,
          type: parsed.detectedType,
          fileFormat: parsed.fileFormat,
          fileSize: parsed.fileSize,
          rawContent: parsed.rawContent,
          pageCount: parsed.pageCount,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        };

        // Add to state
        setDocuments((prev) => [newDoc, ...prev]);

        // Run AI extraction using Python agent & Ollama gemma4:2b
        await processDocumentWithAI(newDoc, file);
      } catch (err) {
        console.error("Failed to read file:", file.name, err);
      }
    }

    setIsProcessing(false);
    setProcessingStatusText("");
  };

  // Internal loader for demo pack
  const loadDemoPackInternal = async () => {
    setIsProcessing(true);
    setProcessingStatusText("Loading demonstration intelligence dossier...");

    const newDocs: EvidenceDocument[] = DEMO_EVIDENCE_DOCUMENTS.map((d) => ({
      ...d,
      status: "uploaded",
    }));

    setDocuments(newDocs);

    // Process each demo document through the AI extraction engine
    for (const doc of newDocs) {
      await processDocumentWithAI(doc);
    }

    setIsProcessing(false);
    setProcessingStatusText("");
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    LocalStorageService.removeDocument(id);
    if (selectedDocForInspector?.id === id) {
      setSelectedDocForInspector(null);
    }
  };

  const handleClearWorkspace = () => {
    if (confirm("Are you sure you want to clear all evidence files in this local workspace?")) {
      setDocuments([]);
      LocalStorageService.clearAll();
      setSelectedDocForInspector(null);
    }
  };

  // Connecting Graph back to original evidence
  const handleSelectDocumentFromGraph = (documentId: string, snippet?: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (doc) {
      setSelectedDocForInspector(doc);
      setInspectorHighlightSnippet(snippet);
    }
  };

  const handleSelectDocumentFromSidebar = (doc: EvidenceDocument) => {
    setSelectedDocForInspector(doc);
    setInspectorHighlightSnippet(undefined);
  };

  // Build reactive graph from all completed documents
  const graph = useMemo(() => {
    return buildGraphFromDocuments(documents);
  }, [documents]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080C14]">
      {/* Top Header */}
      <WorkspaceHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearWorkspace={handleClearWorkspace}
        documentCount={documents.length}
        entityCount={graph.stats.totalEntities}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Evidence Sidebar */}
        <EvidenceSidebar
          documents={documents}
          selectedDocumentId={selectedDocForInspector?.id || null}
          onSelectDocument={handleSelectDocumentFromSidebar}
          onUploadFiles={handleUploadFiles}
          onDeleteDocument={handleDeleteDocument}
          onLoadDemoPack={loadDemoPackInternal}
          isProcessing={isProcessing}
          processingStatusText={processingStatusText}
        />

        {/* Center / Right: Interactive Graph Canvas */}
        <main className="flex-1 h-full relative">
          <GraphCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            onSelectDocument={handleSelectDocumentFromGraph}
            onLoadDemoPack={loadDemoPackInternal}
          />
        </main>

        {/* Right Slide-over Inspector for Original Document & JSON */}
        {selectedDocForInspector && (
          <DocumentInspector
            document={selectedDocForInspector}
            highlightSnippet={inspectorHighlightSnippet}
            onClose={() => {
              setSelectedDocForInspector(null);
              setInspectorHighlightSnippet(undefined);
            }}
            onReExtract={(doc) => processDocumentWithAI(doc)}
          />
        )}
      </div>

      {/* Settings & Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {}}
        onImportWorkspace={(jsonStr) => {
          if (LocalStorageService.importWorkspace(jsonStr)) {
            setDocuments(LocalStorageService.getDocuments());
          }
        }}
      />
    </div>
  );
}
