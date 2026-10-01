"use client";

import React, { memo, useState } from "react";
import { NodeProps, NodeResizer } from "@xyflow/react";
import { GroupNodeData } from "@/types";
import { Folder, Trash2, Edit2, Check, Palette } from "lucide-react";

export const GROUP_COLORS: Record<
  string,
  { border: string; bg: string; text: string; headerBg: string; ring: string; dot: string }
> = {
  cyan: {
    border: "border-cyan-500/50",
    bg: "bg-cyan-950/20",
    text: "text-cyan-300",
    headerBg: "bg-cyan-900/70 border-cyan-500/40",
    ring: "ring-cyan-500/30",
    dot: "bg-cyan-500",
  },
  emerald: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-950/20",
    text: "text-emerald-300",
    headerBg: "bg-emerald-900/70 border-emerald-500/40",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
  amber: {
    border: "border-amber-500/50",
    bg: "bg-amber-950/20",
    text: "text-amber-300",
    headerBg: "bg-amber-900/70 border-amber-500/40",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
  },
  rose: {
    border: "border-rose-500/50",
    bg: "bg-rose-950/20",
    text: "text-rose-300",
    headerBg: "bg-rose-900/70 border-rose-500/40",
    ring: "ring-rose-500/30",
    dot: "bg-rose-500",
  },
  purple: {
    border: "border-purple-500/50",
    bg: "bg-purple-950/20",
    text: "text-purple-300",
    headerBg: "bg-purple-900/70 border-purple-500/40",
    ring: "ring-purple-500/30",
    dot: "bg-purple-500",
  },
  indigo: {
    border: "border-indigo-500/50",
    bg: "bg-indigo-950/20",
    text: "text-indigo-300",
    headerBg: "bg-indigo-900/70 border-indigo-500/40",
    ring: "ring-indigo-500/30",
    dot: "bg-indigo-500",
  },
};

function GroupContainerNodeComponent({ data, selected, id }: NodeProps) {
  const nodeData = data as unknown as GroupNodeData;
  const colorKey = (nodeData.color as string) || "cyan";
  const theme = GROUP_COLORS[colorKey] || GROUP_COLORS.cyan;

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((nodeData.label as string) || "Intelligence Group");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const memberCount = (nodeData.memberCount as number) ?? 0;

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    nodeData.label = label;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof (nodeData as any).onDelete === "function") {
      (nodeData as any).onDelete(id);
    }
  };

  const handlePickColor = (newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    nodeData.color = newColor;
    if (typeof (nodeData as any).onChangeColor === "function") {
      (nodeData as any).onChangeColor(id, newColor);
    }
    setShowColorPicker(false);
  };

  return (
    <>
      {/* Interactive Resizer Handles - visible when container is selected */}
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={260}
        minHeight={160}
        lineClassName="border-cyan-400"
        handleClassName="w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-900 rounded-sm shadow-lg hover:scale-125 transition-transform"
        onResize={(_, params) => {
          nodeData.width = params.width;
          nodeData.height = params.height;
        }}
        onResizeEnd={(_, params) => {
          nodeData.width = params.width;
          nodeData.height = params.height;
          if (typeof (nodeData as any).onResizeEnd === "function") {
            (nodeData as any).onResizeEnd(id, params.width, params.height);
          }
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          minWidth: "260px",
          minHeight: "160px",
        }}
        className={`rounded-2xl border-2 border-dashed transition-all relative select-none ${theme.bg} ${
          selected ? `border-cyan-400 ring-2 ${theme.ring} shadow-xl shadow-cyan-500/10` : theme.border
        }`}
      >
        {/* Top Header Tag */}
        <div className="absolute -top-4 left-4 z-10 flex items-center gap-1.5 pointer-events-auto">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-xl backdrop-blur-md text-xs font-mono font-semibold ${theme.headerBg} ${theme.text}`}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            {isEditing ? (
              <form onSubmit={handleSaveTitle} className="flex items-center gap-1">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  autoFocus
                  className="bg-slate-950 px-1.5 py-0.5 rounded text-white text-xs border border-slate-700 focus:outline-none w-36 font-mono"
                />
                <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[200px]">{label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-slate-400 hover:text-white"
                  title="Rename container"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Member count pill */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-slate-300 font-mono">
              {memberCount} {memberCount === 1 ? "block" : "blocks"}
            </span>

            {/* Container Color Palette Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker((prev) => !prev);
                }}
                className="text-slate-400 hover:text-white p-0.5"
                title="Change container color"
              >
                <Palette className="w-3 h-3" />
              </button>

              {showColorPicker && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-6 left-0 flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-lg shadow-2xl z-30"
                >
                  {Object.entries(GROUP_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      onClick={(e) => handlePickColor(key, e)}
                      className={`w-3.5 h-3.5 rounded-full ${c.dot} hover:scale-125 transition-transform`}
                      title={key}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delete Group Container Button */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shadow-md"
            title="Dissolve group container (preserves blocks)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Empty State Prompt */}
        {memberCount === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            <div className="border border-dashed border-slate-700/60 rounded-xl px-4 py-3 bg-slate-900/30">
              <span className="text-xs font-mono text-slate-400">
                Drop entity blocks here to group automatically
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-1">
                Resize container by selecting and dragging corner handles
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const GroupContainerNode = memo(GroupContainerNodeComponent);
