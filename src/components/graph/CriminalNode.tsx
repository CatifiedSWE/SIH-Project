"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Building2,
  Car,
  Calendar,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { EntityType, GraphNodeData } from "@/types";

const ENTITY_CONFIG: Record<
  EntityType,
  { label: string; bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PERSON: {
    label: "PERSON",
    bg: "bg-indigo-950/40",
    border: "border-indigo-500/40 hover:border-indigo-400",
    text: "text-indigo-400",
    icon: User,
  },
  PHONE: {
    label: "PHONE",
    bg: "bg-cyan-950/40",
    border: "border-cyan-500/40 hover:border-cyan-400",
    text: "text-cyan-400",
    icon: Phone,
  },
  BANK_ACCOUNT: {
    label: "BANK ACCOUNT",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/40 hover:border-emerald-400",
    text: "text-emerald-400",
    icon: CreditCard,
  },
  LOCATION: {
    label: "LOCATION",
    bg: "bg-rose-950/40",
    border: "border-rose-500/40 hover:border-rose-400",
    text: "text-rose-400",
    icon: MapPin,
  },
  ORGANIZATION: {
    label: "ORGANIZATION",
    bg: "bg-amber-950/40",
    border: "border-amber-500/40 hover:border-amber-400",
    text: "text-amber-400",
    icon: Building2,
  },
  VEHICLE: {
    label: "VEHICLE",
    bg: "bg-sky-950/40",
    border: "border-sky-500/40 hover:border-sky-400",
    text: "text-sky-400",
    icon: Car,
  },
  EVENT: {
    label: "EVENT",
    bg: "bg-purple-950/40",
    border: "border-purple-500/40 hover:border-purple-400",
    text: "text-purple-400",
    icon: Calendar,
  },
  TRANSACTION: {
    label: "TRANSACTION",
    bg: "bg-teal-950/40",
    border: "border-teal-500/40 hover:border-teal-400",
    text: "text-teal-400",
    icon: ArrowRightLeft,
  },
};

const CUSTOM_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  rose: { bg: "bg-rose-950/60", border: "border-rose-500/80 hover:border-rose-400", text: "text-rose-400" },
  emerald: { bg: "bg-emerald-950/60", border: "border-emerald-500/80 hover:border-emerald-400", text: "text-emerald-400" },
  amber: { bg: "bg-amber-950/60", border: "border-amber-500/80 hover:border-amber-400", text: "text-amber-400" },
  purple: { bg: "bg-purple-950/60", border: "border-purple-500/80 hover:border-purple-400", text: "text-purple-400" },
  cyan: { bg: "bg-cyan-950/60", border: "border-cyan-500/80 hover:border-cyan-400", text: "text-cyan-400" },
  indigo: { bg: "bg-indigo-950/60", border: "border-indigo-500/80 hover:border-indigo-400", text: "text-indigo-400" },
};

function CriminalNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData;
  const defaultConfig = ENTITY_CONFIG[nodeData.type] || ENTITY_CONFIG.PERSON;
  const customTheme = nodeData.customColor && CUSTOM_THEMES[nodeData.customColor] ? CUSTOM_THEMES[nodeData.customColor] : null;

  const config = customTheme
    ? { ...defaultConfig, bg: customTheme.bg, border: customTheme.border, text: customTheme.text }
    : defaultConfig;

  const Icon = config.icon;

  const subtitle =
    nodeData.properties?.role ||
    nodeData.properties?.accountNumber ||
    nodeData.properties?.msisdn ||
    nodeData.properties?.registrationNumber ||
    nodeData.properties?.category ||
    null;

  return (
    <div
      className={`relative min-w-[210px] max-w-[260px] rounded-lg border bg-slate-950/90 p-3 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected
          ? "border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-500/20 shadow-2xl scale-[1.02]"
          : `${config.border} shadow-black/60`
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-800"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-800"
      />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className={`p-1 rounded ${config.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${config.text}`} />
          </div>
          <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${config.text}`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {nodeData.containerId && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Grouped
            </span>
          )}
          {/* Degree count badge */}
          {(nodeData.degree ?? 0) > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {nodeData.degree} {nodeData.degree === 1 ? "link" : "links"}
            </span>
          )}
        </div>
      </div>

      {/* Entity Main Title */}
      <div className="text-sm font-semibold text-slate-100 truncate tracking-tight">
        {nodeData.label}
      </div>

      {/* Subtitle / Primary detail */}
      {subtitle && (
        <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
          {String(subtitle)}
        </div>
      )}

      {/* Document Provenance Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1 truncate max-w-[170px]" title={nodeData.provenance.documentName}>
          <FileText className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{nodeData.provenance.documentName}</span>
        </div>
        {(nodeData.documentCount ?? 1) > 1 && (
          <span className="shrink-0 font-mono text-[9px] px-1 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            +{nodeData.documentCount! - 1} docs
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-800"
      />
    </div>
  );
}

export const CriminalNode = memo(CriminalNodeComponent);
