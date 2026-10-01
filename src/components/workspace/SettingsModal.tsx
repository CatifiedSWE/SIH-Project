"use client";

import React, { useState } from "react";
import { LocalStorageService, WorkspaceSettings } from "@/services/storage/local-storage.service";
import { Key, Bot, X, Check, ShieldCheck, Download, Upload, AlertCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
  onImportWorkspace: (jsonStr: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
  onImportWorkspace,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<WorkspaceSettings>(() =>
    LocalStorageService.getSettings()
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    LocalStorageService.saveSettings(settings);
    setSavedSuccess(true);
    onSettingsSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExport = () => {
    const data = LocalStorageService.exportWorkspace();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinder-bound-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onImportWorkspace(text);
          onClose();
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold tracking-tight">AI & Workspace Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* AI Model Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
              Extraction AI Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, providerType: "ollama" })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  settings.providerType === "ollama"
                    ? "border-cyan-500 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold text-cyan-300">Local Ollama</div>
                <div className="text-[10px] text-slate-400 mt-1">gemma4:2b on port 11434</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, providerType: "gemini" })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  settings.providerType === "gemini"
                    ? "border-cyan-500 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold text-indigo-300">Cloud Gemini</div>
                <div className="text-[10px] text-slate-400 mt-1">Google AI Studio API</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, providerType: "simulation" })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  settings.providerType === "simulation"
                    ? "border-cyan-500 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold text-emerald-300">Built-in Parser</div>
                <div className="text-[10px] text-slate-400 mt-1">Offline Heuristics</div>
              </button>
            </div>
          </div>

          {/* Ollama Configuration Inputs */}
          {settings.providerType === "ollama" && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ollama Endpoint Configuration
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Ready
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Ollama Host URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaUrl || "http://127.0.0.1:11434"}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Ollama Model Identifier
                </label>
                <input
                  type="text"
                  value={settings.model || "gemma4:2b"}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Cloud API Key Input */}
          {settings.providerType === "gemini" && (
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Google AI Studio Key</span>
                <span className="text-[10px] text-slate-500 font-sans lowercase">stored in browser only</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="AIzaSy... (leave blank for local Ollama)"
                  value={settings.apiKey || ""}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Backup / Export / Import */}
          <div className="pt-4 border-t border-slate-800">
            <span className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
              Local Workspace Backup
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
              </button>
              <label className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
