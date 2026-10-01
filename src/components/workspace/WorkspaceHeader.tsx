"use client";

import React from "react";
import Link from "next/link";
import {
  Network,
  Settings,
  Trash2,
  Cpu,
  ArrowLeft,
  HardDrive,
  Sparkles,
} from "lucide-react";

interface WorkspaceHeaderProps {
  onOpenSettings: () => void;
  onClearWorkspace: () => void;
  documentCount: number;
  entityCount: number;
}

export function WorkspaceHeader({
  onOpenSettings,
  onClearWorkspace,
  documentCount,
  entityCount,
}: WorkspaceHeaderProps) {
  return (
    <header className="h-14 bg-[#090D14] border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0 select-none">
      {/* Brand & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Return to Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <Network className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              CINDER BOUND
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400/90 font-medium">
              INVESTIGATOR WORKSPACE
            </span>
          </div>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Storage Vault</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ollama: gemma4:2b (127.0.0.1:11434)</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors"
          title="Configure AI & Local Backup"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {documentCount > 0 && (
          <button
            onClick={onClearWorkspace}
            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 text-xs font-mono transition-colors"
            title="Clear all local evidence"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
