"use client";

import React, { useState } from "react";
import {
  FolderPlus,
  Palette,
  X,
  Square,
  Ungroup,
} from "lucide-react";

interface GraphActionDockProps {
  selectedNodeCount: number;
  hasGroupedSelected?: boolean;
  onGroupSelected: (groupName?: string, color?: string) => void;
  onUngroupSelected?: () => void;
  onChangeColor: (colorKey: string) => void;
  onAddEmptyGroup: () => void;
  onClearSelection: () => void;
}

const COLOR_PALETTE = [
  { key: "rose", label: "Red / Alert", bg: "bg-rose-500", ring: "ring-rose-400" },
  { key: "amber", label: "Amber / Warning", bg: "bg-amber-500", ring: "ring-amber-400" },
  { key: "emerald", label: "Emerald / Verified", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { key: "cyan", label: "Cyan / Telecom", bg: "bg-cyan-500", ring: "ring-cyan-400" },
  { key: "purple", label: "Purple / Syndicate", bg: "bg-purple-500", ring: "ring-purple-400" },
  { key: "indigo", label: "Indigo / Entity", bg: "bg-indigo-500", ring: "ring-indigo-400" },
  { key: "default", label: "Default Type", bg: "bg-slate-700", ring: "ring-slate-400" },
];

export function GraphActionDock({
  selectedNodeCount,
  hasGroupedSelected,
  onGroupSelected,
  onUngroupSelected,
  onChangeColor,
  onAddEmptyGroup,
  onClearSelection,
}: GraphActionDockProps) {
  const [isGroupNaming, setIsGroupNaming] = useState(false);
  const [groupName, setGroupName] = useState("Suspect Syndicate");
  const [selectedGroupColor, setSelectedGroupColor] = useState("cyan");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    onGroupSelected(groupName.trim() || "Intelligence Group", selectedGroupColor);
    setIsGroupNaming(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-3 bg-slate-950/90 backdrop-blur-xl border border-slate-800 px-4 py-2.5 rounded-2xl shadow-2xl shadow-black/80">
        {selectedNodeCount > 0 ? (
          <>
            {/* Selection Counter */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                {selectedNodeCount} {selectedNodeCount === 1 ? "block" : "blocks"} selected
              </span>
            </div>

            {/* Group Option */}
            {isGroupNaming ? (
              <form onSubmit={handleCreateGroup} className="flex items-center gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name..."
                  autoFocus
                  className="bg-slate-900 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none w-44"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-semibold transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroupNaming(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsGroupNaming(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
                title="Wrap selected blocks in a new container"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Group into Container
              </button>
            )}

            {/* Ungroup selected if any are grouped */}
            {hasGroupedSelected && onUngroupSelected && (
              <button
                onClick={onUngroupSelected}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
                title="Ungroup selected blocks from their containers"
              >
                <Ungroup className="w-3.5 h-3.5" /> Ungroup
              </button>
            )}

            {/* Color Palette Picker */}
            <div className="flex items-center gap-1.5 pl-2 pr-2 border-l border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-slate-400" /> Color:
              </span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.key}
                  onClick={() => onChangeColor(c.key)}
                  title={`Color: ${c.label}`}
                  className={`w-5 h-5 rounded-full ${c.bg} transition-all hover:scale-125 focus:outline-none hover:ring-2 ${c.ring}`}
                />
              ))}
            </div>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Persistent State when no nodes selected */
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            {/* Rectangle Tool Icon Button */}
            <button
              onClick={onAddEmptyGroup}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 font-semibold"
              title="Add a resizable rectangle container box"
            >
              <Square className="w-4 h-4 text-cyan-400" />
              <span>+ Rectangle Container</span>
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Drag block over container to auto-group • Shift+click or drag-box to select & color
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
