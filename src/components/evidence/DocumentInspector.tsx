"use client";

import React, { useState } from "react";
import { EvidenceDocument } from "@/types";
import {
  FileText,
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";

interface DocumentInspectorProps {
  document: EvidenceDocument | null;
  highlightSnippet?: string;
  onClose: () => void;
  onReExtract?: (doc: EvidenceDocument) => void;
}

export function DocumentInspector({
  document,
  highlightSnippet,
  onClose,
  onReExtract,
}: DocumentInspectorProps) {
  const [activeTab, setActiveTab] = useState<"ORIGINAL" | "JSON" | "ENTITIES">("ORIGINAL");
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const handleCopyJson = () => {
    if (document.extractedData) {
      navigator.clipboard.writeText(JSON.stringify(document.extractedData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = document.rawContent.split("\n");

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[620px] bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-40 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 truncate max-w-sm">
              {document.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {document.type}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {Math.round(document.fileSize / 1024)} KB • {document.fileFormat.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950 text-xs font-mono">
        <button
          onClick={() => setActiveTab("ORIGINAL")}
          className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === "ORIGINAL"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Original Evidence
        </button>
        <button
          onClick={() => setActiveTab("JSON")}
          className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === "JSON"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> Structured JSON
        </button>
        <button
          onClick={() => setActiveTab("ENTITIES")}
          className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === "ENTITIES"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Extracted ({document.extractedData?.entities.length || 0})
        </button>

        {onReExtract && (
          <button
            onClick={() => onReExtract(document)}
            className="ml-auto text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 py-1 px-2 rounded bg-cyan-950/60 border border-cyan-800 hover:bg-cyan-900/60"
          >
            <Sparkles className="w-3 h-3" /> Re-Extract
          </button>
        )}
      </div>

      {/* Tab 1: Original Evidence Text Viewer */}
      {activeTab === "ORIGINAL" && (
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 bg-[#0B0F17] leading-relaxed">
          {highlightSnippet && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="font-semibold block">Active Provenance Highlight:</strong>
                <span className="italic">"{highlightSnippet}"</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {lines.map((line, idx) => {
              const isHighlighted =
                highlightSnippet &&
                highlightSnippet.length > 5 &&
                line.toLowerCase().includes(highlightSnippet.toLowerCase().slice(0, 30));

              return (
                <div
                  key={idx}
                  className={`flex gap-3 py-0.5 px-2 rounded font-mono ${
                    isHighlighted
                      ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-400 font-semibold"
                      : "hover:bg-slate-900/60"
                  }`}
                >
                  <span className="text-slate-600 select-none w-7 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line || " "}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Structured JSON View */}
      {activeTab === "JSON" && (
        <div className="flex-1 flex flex-col bg-[#090D14] overflow-hidden">
          <div className="p-2.5 px-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AI JSON Payload Schema</span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
              {document.extractedData
                ? JSON.stringify(document.extractedData, null, 2)
                : "No extracted JSON data available yet."}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Extracted Entities List */}
      {activeTab === "ENTITIES" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0F17]">
          {document.extractedData?.entities.map((entity) => (
            <div
              key={entity.id}
              className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-semibold">
                  {entity.type}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {entity.id}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-100">
                {entity.name}
              </div>

              {entity.properties && Object.keys(entity.properties).length > 0 && (
                <div className="mt-2 text-xs font-mono text-slate-400 space-y-0.5">
                  {Object.entries(entity.properties).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-500">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/80 italic font-mono">
                "{entity.provenance.sourceText}"
              </div>
            </div>
          ))}

          {/* Relationships */}
          {document.extractedData?.relationships && document.extractedData.relationships.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Document Relationships ({document.extractedData.relationships.length})
              </h4>
              <div className="space-y-2">
                {document.extractedData.relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/30 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-cyan-400 font-semibold truncate">{rel.source}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] border border-purple-800 shrink-0">
                        {rel.type}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-cyan-400 font-semibold truncate">{rel.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
