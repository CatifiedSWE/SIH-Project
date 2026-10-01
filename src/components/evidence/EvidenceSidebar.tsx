"use client";

import React, { useRef, useState } from "react";
import { EvidenceDocument, DocumentType } from "@/types";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Layers,
  ChevronRight,
  Eye,
} from "lucide-react";

interface EvidenceSidebarProps {
  documents: EvidenceDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: EvidenceDocument) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onDeleteDocument: (id: string) => void;
  onLoadDemoPack: () => void;
  isProcessing?: boolean;
  processingStatusText?: string;
}

export function EvidenceSidebar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFiles,
  onDeleteDocument,
  onLoadDemoPack,
  isProcessing = false,
  processingStatusText = "",
}: EvidenceSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getStatusBadge = (doc: EvidenceDocument) => {
    switch (doc.status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {doc.extractedData?.entities.length || 0} entities
          </span>
        );
      case "extracting":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> AI Extracting
          </span>
        );
      case "parsing":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Parsing
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Clock className="w-3 h-3" /> Uploaded
          </span>
        );
    }
  };

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-[#0B0F17] border-r border-slate-800 text-slate-200 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              EVIDENCE VAULT
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              {documents.length} {documents.length === 1 ? "document" : "documents"} loaded
            </p>
          </div>
        </div>

        {/* Load Demo Pack Button */}
        <button
          onClick={onLoadDemoPack}
          title="Load sample FIR, CDR, and Bank records"
          className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Sparkles className="w-3 h-3" /> Demo Pack
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="p-3.5 border-b border-slate-800/60">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.txt,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            isDragging
              ? "border-cyan-400 bg-cyan-500/10 scale-[0.99]"
              : "border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-600"
          }`}
        >
          <div className="p-2 rounded-full bg-slate-800/80 text-cyan-400 mb-2">
            <Upload className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-200">
            Upload Evidence Files
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 font-mono">
            PDF, CSV, TXT, DOC (Multiple files)
          </span>
        </div>
      </div>

      {/* Global Processing Banner */}
      {isProcessing && (
        <div className="px-4 py-2.5 bg-cyan-950/40 border-b border-cyan-800/50 flex items-center gap-2.5 text-xs text-cyan-300 font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
          <span className="truncate">{processingStatusText || "Processing evidence..."}</span>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <FileText className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
            <p className="text-xs font-mono">No evidence uploaded yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Drop files above or load the demo intelligence pack.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocumentId === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`group p-3 rounded-lg border cursor-pointer transition-all duration-150 relative ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/5"
                    : "bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">{getFormatIcon(doc.fileFormat)}</div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300">
                        {doc.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {doc.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round(doc.fileSize / 1024)} KB
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    title="Remove document"
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  {getStatusBadge(doc)}
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5 font-mono">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between bg-slate-950">
        <span>Files Stored Locally</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Client Only
        </span>
      </div>
    </div>
  );
}
