"use client";

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CriminalNode } from "./CriminalNode";
import { GroupContainerNode } from "./GroupContainerNode";
import { GraphActionDock } from "./GraphActionDock";
import { EntityType, GraphEdgeData, GraphNodeData, GroupNodeData } from "@/types";
import {
  Search,
  Sparkles,
  FileText,
  ExternalLink,
  X,
  ShieldAlert,
  Filter,
  Square,
  Folder,
  Ungroup,
  Plus,
} from "lucide-react";

interface GraphCanvasProps {
  nodes: Node<GraphNodeData | GroupNodeData>[];
  edges: Edge<GraphEdgeData>[];
  onSelectDocument?: (documentId: string, snippet?: string) => void;
  onLoadDemoPack?: () => void;
}

export function GraphCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onSelectDocument,
  onLoadDemoPack,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node<any>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  useEffect(() => {
    setNodes(initialNodes as Node<any>[]);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Selection state
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("ALL");

  // Track position during container dragging so child blocks move along
  const containerDragPosRef = useRef<Record<string, { x: number; y: number }>>({});

  const nodeTypes = useMemo(
    () => ({
      criminalNode: CriminalNode,
      groupContainer: GroupContainerNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "criminalNode") {
      setSelectedNode(node.data as unknown as GraphNodeData);
      setSelectedEdge(null);
    }
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.data as unknown as GraphEdgeData);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Multi-selection tracking for lower action dock
  const selectedNodes = useMemo(() => {
    return nodes.filter((n) => n.selected && n.type === "criminalNode");
  }, [nodes]);

  const hasGroupedSelected = useMemo(() => {
    return selectedNodes.some((n) => Boolean((n.data as GraphNodeData).containerId));
  }, [selectedNodes]);

  // Delete container handler: dissolves container and ungroups member blocks
  const handleDeleteContainer = useCallback(
    (containerId: string) => {
      setNodes((prev) =>
        prev
          .filter((n) => n.id !== containerId)
          .map((n) => {
            if (n.type === "criminalNode" && (n.data as GraphNodeData).containerId === containerId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  containerId: undefined,
                },
              };
            }
            return n;
          })
      );
      setSelectedNode((prev) =>
        prev && prev.containerId === containerId ? { ...prev, containerId: undefined } : prev
      );
    },
    [setNodes]
  );

  // Resize container handler
  const handleResizeContainer = useCallback(
    (containerId: string, width: number, height: number) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === containerId
            ? {
                ...n,
                style: { ...n.style, width, height },
                data: {
                  ...n.data,
                  width,
                  height,
                },
              }
            : n
        )
      );
    },
    [setNodes]
  );

  // Change container color handler
  const handleChangeContainerColor = useCallback(
    (containerId: string, color: string) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === containerId
            ? {
                ...n,
                data: {
                  ...n.data,
                  color,
                },
              }
            : n
        )
      );
    },
    [setNodes]
  );

  // Handle grouping of selected blocks into a new container
  const handleGroupSelected = useCallback(
    (groupName?: string, colorKey?: string) => {
      if (selectedNodes.length === 0) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      selectedNodes.forEach((n) => {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x);
        maxY = Math.max(maxY, n.position.y);
      });

      const width = Math.max(520, maxX - minX + 320);
      const height = Math.max(360, maxY - minY + 200);
      const groupId = `group_${Date.now()}`;

      const newGroupNode: Node<GroupNodeData> = {
        id: groupId,
        type: "groupContainer",
        position: { x: minX - 40, y: minY - 60 },
        zIndex: -1,
        style: { width, height },
        data: {
          id: groupId,
          label: groupName || "Suspect Module",
          color: colorKey || "cyan",
          width,
          height,
          memberCount: selectedNodes.length,
          onDelete: handleDeleteContainer,
          onResizeEnd: handleResizeContainer,
          onChangeColor: handleChangeContainerColor,
        },
      };

      // Set containerId on all selected nodes
      const selectedIds = new Set(selectedNodes.map((n) => n.id));
      setNodes((prev) => [
        newGroupNode,
        ...prev.map((n) => {
          if (selectedIds.has(n.id)) {
            return {
              ...n,
              selected: false,
              data: {
                ...n.data,
                containerId: groupId,
              },
            };
          }
          return { ...n, selected: false };
        }),
      ]);

      if (selectedNode && selectedIds.has(selectedNode.id)) {
        setSelectedNode((prev) => (prev ? { ...prev, containerId: groupId } : null));
      }
    },
    [selectedNodes, selectedNode, setNodes, handleDeleteContainer, handleResizeContainer, handleChangeContainerColor]
  );

  // Handle ungrouping all selected blocks
  const handleUngroupSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    setNodes((prev) =>
      prev.map((n) => {
        if (selectedIds.has(n.id) && n.type === "criminalNode") {
          return {
            ...n,
            data: {
              ...n.data,
              containerId: undefined,
            },
          };
        }
        return n;
      })
    );

    if (selectedNode && selectedIds.has(selectedNode.id)) {
      setSelectedNode((prev) => (prev ? { ...prev, containerId: undefined } : null));
    }
  }, [selectedNodes, selectedNode, setNodes]);

  // Handle color change for selected blocks
  const handleChangeColor = useCallback(
    (colorKey: string) => {
      const colorVal = colorKey === "default" ? undefined : colorKey;
      setNodes((prev) =>
        prev.map((node) => {
          if (node.selected && node.type === "criminalNode") {
            return {
              ...node,
              data: {
                ...node.data,
                customColor: colorVal,
              },
            };
          }
          return node;
        })
      );
      if (selectedNode && selectedNodes.some((n) => n.id === selectedNode.id)) {
        setSelectedNode((prev) => (prev ? { ...prev, customColor: colorVal } : null));
      }
    },
    [selectedNodes, selectedNode, setNodes]
  );

  // Handle adding an empty resizable rectangle container box
  const handleAddEmptyGroup = useCallback(() => {
    const groupId = `group_${Date.now()}`;
    const width = 500;
    const height = 350;

    const newGroupNode: Node<GroupNodeData> = {
      id: groupId,
      type: "groupContainer",
      position: { x: 260 + (nodes.filter((n) => n.type === "groupContainer").length * 50), y: 160 },
      zIndex: -1,
      style: { width, height },
      data: {
        id: groupId,
        label: "Syndicate Container",
        color: "cyan",
        width,
        height,
        memberCount: 0,
        onDelete: handleDeleteContainer,
        onResizeEnd: handleResizeContainer,
        onChangeColor: handleChangeContainerColor,
      },
    };
    setNodes((prev) => [newGroupNode, ...prev]);
  }, [nodes, setNodes, handleDeleteContainer, handleResizeContainer, handleChangeContainerColor]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  // DRAG HANDLERS: Moving container moves member blocks, dropping block checks container collision
  const onNodeDragStart = useCallback((_: any, node: Node) => {
    if (node.type === "groupContainer") {
      containerDragPosRef.current[node.id] = { x: node.position.x, y: node.position.y };
    }
  }, []);

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      if (node.type === "groupContainer") {
        const lastPos = containerDragPosRef.current[node.id];
        if (lastPos) {
          const dx = node.position.x - lastPos.x;
          const dy = node.position.y - lastPos.y;
          if (dx !== 0 || dy !== 0) {
            containerDragPosRef.current[node.id] = { x: node.position.x, y: node.position.y };
            setNodes((currentNodes) =>
              currentNodes.map((n) => {
                if (n.type === "criminalNode" && (n.data as GraphNodeData).containerId === node.id) {
                  return {
                    ...n,
                    position: {
                      x: n.position.x + dx,
                      y: n.position.y + dy,
                    },
                  };
                }
                return n;
              })
            );
          }
        } else {
          containerDragPosRef.current[node.id] = { x: node.position.x, y: node.position.y };
        }
      }
    },
    [setNodes]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (node.type === "groupContainer") {
        delete containerDragPosRef.current[node.id];
        return;
      }

      // Entity block dropped -> Auto-detect container collision
      if (node.type === "criminalNode") {
        const nodeX = node.position.x;
        const nodeY = node.position.y;
        const nodeCenterX = nodeX + 110;
        const nodeCenterY = nodeY + 50;

        setNodes((prev) => {
          let targetContainerId: string | undefined = undefined;

          // Find container whose bounding box contains the dropped node
          for (const n of prev) {
            if (n.type === "groupContainer") {
              const cX = n.position.x;
              const cY = n.position.y;
              const cWidth = Number(
                (n.data as GroupNodeData).width || (typeof n.style?.width === "number" ? n.style.width : 500)
              );
              const cHeight = Number(
                (n.data as GroupNodeData).height || (typeof n.style?.height === "number" ? n.style.height : 350)
              );

              const isInside =
                (nodeCenterX >= cX && nodeCenterX <= cX + cWidth && nodeCenterY >= cY && nodeCenterY <= cY + cHeight) ||
                (nodeX >= cX && nodeX <= cX + cWidth && nodeY >= cY && nodeY <= cY + cHeight);

              if (isInside) {
                targetContainerId = n.id;
                break;
              }
            }
          }

          const currentContainerId = (node.data as GraphNodeData).containerId;
          if (targetContainerId === currentContainerId) {
            return prev;
          }

          if (selectedNode && selectedNode.id === node.id) {
            setSelectedNode((prevSel) =>
              prevSel ? { ...prevSel, containerId: targetContainerId } : null
            );
          }

          return prev.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  containerId: targetContainerId,
                },
              };
            }
            return n;
          });
        });
      }
    },
    [selectedNode, setNodes]
  );

  // Manual Inspector Actions: Ungroup node
  const handleUngroupNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const targetNode = prev.find((n) => n.id === nodeId);
        const container = prev.find(
          (n) => n.type === "groupContainer" && n.id === (targetNode?.data as GraphNodeData)?.containerId
        );

        let newPos = targetNode?.position || { x: 100, y: 100 };
        if (container) {
          const cWidth = Number(
            (container.data as GroupNodeData).width ||
              (typeof container.style?.width === "number" ? container.style.width : 500)
          );
          // Place node outside container on the right
          newPos = {
            x: container.position.x + cWidth + 40,
            y: container.position.y,
          };
        }

        return prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              position: newPos,
              data: {
                ...n.data,
                containerId: undefined,
              },
            };
          }
          return n;
        });
      });

      setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, containerId: undefined } : prev));
    },
    [setNodes]
  );

  // Manual Inspector Actions: Assign node into specific container
  const handleAssignNodeToContainer = useCallback(
    (nodeId: string, targetContainerId: string) => {
      setNodes((prev) => {
        const container = prev.find((n) => n.id === targetContainerId);
        if (!container) return prev;

        // Count how many blocks are already inside this container
        const existingMembers = prev.filter(
          (n) =>
            n.type === "criminalNode" &&
            (n.data as GraphNodeData).containerId === targetContainerId &&
            n.id !== nodeId
        );

        const idx = existingMembers.length;
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        // Position neatly inside the container box
        const insideX = container.position.x + 30 + col * 220;
        const insideY = container.position.y + 60 + row * 120;

        return prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              position: { x: insideX, y: insideY },
              data: {
                ...n.data,
                containerId: targetContainerId,
              },
            };
          }
          return n;
        });
      });

      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, containerId: targetContainerId } : prev
      );
    },
    [setNodes]
  );

  // Manual Inspector Actions: Create new container around this block
  const handleCreateContainerForNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const targetNode = prev.find((n) => n.id === nodeId);
        if (!targetNode) return prev;

        const groupId = `group_${Date.now()}`;
        const width = 500;
        const height = 350;

        const newGroupNode: Node<GroupNodeData> = {
          id: groupId,
          type: "groupContainer",
          position: { x: targetNode.position.x - 40, y: targetNode.position.y - 60 },
          zIndex: -1,
          style: { width, height },
          data: {
            id: groupId,
            label: `${(targetNode.data as GraphNodeData).label || "Suspect"} Syndicate`,
            color: "cyan",
            width,
            height,
            memberCount: 1,
            onDelete: handleDeleteContainer,
            onResizeEnd: handleResizeContainer,
            onChangeColor: handleChangeContainerColor,
          },
        };

        return [
          newGroupNode,
          ...prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    containerId: groupId,
                  },
                }
              : n
          ),
        ];
      });

      setSelectedNode((prev) => {
        if (!prev || prev.id !== nodeId) return prev;
        return { ...prev, containerId: `group_${Date.now()}` };
      });
    },
    [setNodes, handleDeleteContainer, handleResizeContainer, handleChangeContainerColor]
  );

  // Compute live member counts for each container
  const displayNodes = useMemo(() => {
    const memberCounts: Record<string, number> = {};

    nodes.forEach((n) => {
      if (n.type === "criminalNode") {
        const cId = (n.data as GraphNodeData).containerId;
        if (cId) {
          memberCounts[cId] = (memberCounts[cId] || 0) + 1;
        }
      }
    });

    return nodes
      .map((node) => {
        if (node.type === "groupContainer") {
          const count = memberCounts[node.id] || 0;
          return {
            ...node,
            data: {
              ...node.data,
              memberCount: count,
              onDelete: handleDeleteContainer,
              onResizeEnd: handleResizeContainer,
              onChangeColor: handleChangeContainerColor,
            },
          };
        }
        return node;
      })
      .filter((node) => {
        if (node.type === "groupContainer") return true;

        const data = node.data as unknown as GraphNodeData;
        const matchesSearch =
          searchQuery === "" ||
          data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (data.properties &&
            JSON.stringify(data.properties).toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFilter =
          activeTypeFilter === "ALL" || data.type === activeTypeFilter;

        return matchesSearch && matchesFilter;
      });
  }, [nodes, searchQuery, activeTypeFilter, handleDeleteContainer, handleResizeContainer, handleChangeContainerColor]);

  const activeTypes: EntityType[] = useMemo(() => {
    const set = new Set<EntityType>();
    nodes.forEach((n) => {
      if (n.type === "criminalNode") {
        set.add((n.data as unknown as GraphNodeData).type);
      }
    });
    return Array.from(set);
  }, [nodes]);

  const criminalNodeCount = nodes.filter((n) => n.type === "criminalNode").length;
  const containerCount = nodes.filter((n) => n.type === "groupContainer").length;

  // Available container nodes for inspector dropdown
  const allContainers = useMemo(() => {
    return nodes.filter((n) => n.type === "groupContainer");
  }, [nodes]);

  const currentSelectedContainer = useMemo(() => {
    if (!selectedNode?.containerId) return null;
    return allContainers.find((c) => c.id === selectedNode.containerId) || null;
  }, [allContainers, selectedNode]);

  return (
    <div className="relative w-full h-full bg-[#080C14] text-slate-100 overflow-hidden select-none">
      {/* Top Filter and Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search entity, phone, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-48 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Rectangle Tool Button in Top Bar */}
          <button
            onClick={handleAddEmptyGroup}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 text-xs font-mono font-medium transition-all shadow-lg shadow-cyan-500/10"
            title="Create a new resizable rectangle container box"
          >
            <Square className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Rectangle Tool</span>
          </button>
        </div>

        {/* Entity Category Filter Pills */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-lg overflow-x-auto max-w-full">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-500" /> Filter:
          </span>
          <button
            onClick={() => setActiveTypeFilter("ALL")}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              activeTypeFilter === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            ALL ({criminalNodeCount})
          </button>
          {activeTypes.map((type) => {
            const count = nodes.filter(
              (n) => n.type === "criminalNode" && (n.data as unknown as GraphNodeData).type === type
            ).length;
            return (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeTypeFilter === type
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>

        {/* Stats Pill */}
        <div className="hidden lg:flex items-center gap-3 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Entities: <strong className="text-white">{criminalNodeCount}</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            Containers: <strong className="text-cyan-300">{containerCount}</strong>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            Relationships: <strong className="text-white">{edges.length}</strong>
          </div>
        </div>
      </div>

      {/* React Flow Core */}
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={false}
        panOnDrag={[1, 2]}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1e293b"
        />
        <Controls
          className="!bg-slate-900 !border-slate-800 !text-slate-300 !fill-slate-300 !shadow-2xl rounded-lg overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "groupContainer") return "transparent";
            const data = n.data as unknown as GraphNodeData;
            switch (data.type) {
              case "PERSON": return "#6366f1";
              case "PHONE": return "#06b6d4";
              case "BANK_ACCOUNT": return "#10b981";
              case "LOCATION": return "#f43f5e";
              case "ORGANIZATION": return "#f59e0b";
              case "VEHICLE": return "#0284c7";
              case "EVENT": return "#a855f7";
              default: return "#64748b";
            }
          }}
          maskColor="rgba(11, 15, 23, 0.85)"
          className="!bg-slate-950/90 !border !border-slate-800 !rounded-lg !overflow-hidden"
        />
      </ReactFlow>

      {/* LOWER WINDOW: Action Dock for Rectangle Tool, Grouping & Changing Colors */}
      <GraphActionDock
        selectedNodeCount={selectedNodes.length}
        hasGroupedSelected={hasGroupedSelected}
        onGroupSelected={handleGroupSelected}
        onUngroupSelected={handleUngroupSelected}
        onChangeColor={handleChangeColor}
        onAddEmptyGroup={handleAddEmptyGroup}
        onClearSelection={handleClearSelection}
      />

      {/* Empty State Banner if no nodes */}
      {criminalNodeCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-100 tracking-tight">
            Graph Canvas Ready
          </h3>
          <p className="text-sm text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Upload evidence files on the left sidebar to let the AI extract entities and generate the connected graph.
          </p>
          {onLoadDemoPack && (
            <button
              onClick={onLoadDemoPack}
              className="mt-6 pointer-events-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" /> Load Demo Intelligence Pack
            </button>
          )}
        </div>
      )}

      {/* Side Inspector Drawer for Selected Node / Relationship */}
      {selectedNode && (
        <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-5 shadow-2xl z-20 transition-all max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                {selectedNode.type}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {selectedNode.id}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Node Name */}
          <div className="mt-4">
            <div className="text-lg font-bold text-slate-100 tracking-tight">
              {selectedNode.label}
            </div>
            {selectedNode.properties?.role && (
              <div className="text-xs text-cyan-400 font-mono mt-0.5">
                Role: {String(selectedNode.properties.role)}
              </div>
            )}
          </div>

          {/* Color Switcher inside Inspector */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Node Accent Color
            </span>
            <div className="flex items-center gap-2">
              {[
                { key: "rose", bg: "bg-rose-500" },
                { key: "amber", bg: "bg-amber-500" },
                { key: "emerald", bg: "bg-emerald-500" },
                { key: "cyan", bg: "bg-cyan-500" },
                { key: "purple", bg: "bg-purple-500" },
                { key: "indigo", bg: "bg-indigo-500" },
                { key: "default", bg: "bg-slate-700" },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    const colorVal = c.key === "default" ? undefined : c.key;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, customColor: colorVal } }
                          : n
                      )
                    );
                    setSelectedNode((prev) => (prev ? { ...prev, customColor: colorVal } : null));
                  }}
                  className={`w-5 h-5 rounded-full ${c.bg} transition-all hover:scale-125 focus:outline-none`}
                />
              ))}
            </div>
          </div>

          {/* CONTAINER / SYNDICATE GROUPING SECTION (BELOW LABEL COLOR) */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" /> Container Group
              </span>
              {currentSelectedContainer && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Grouped
                </span>
              )}
            </div>

            {currentSelectedContainer ? (
              /* Already in a container: Show container info, Ungroup button, or switch container */
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[180px]">
                      {(currentSelectedContainer.data as GroupNodeData).label || "Syndicate Container"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(currentSelectedContainer.data as GroupNodeData).memberCount || 1} blocks
                  </span>
                </div>

                {/* Ungroup Button: Moves block outside container */}
                <button
                  onClick={() => handleUngroupNode(selectedNode.id)}
                  className="w-full py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
                  title="Remove from container and move outside"
                >
                  <Ungroup className="w-3.5 h-3.5" /> Ungroup (Move Outside)
                </button>

                {/* Switch to another container if more than 1 exist */}
                {allContainers.length > 1 && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Move into another container:
                    </label>
                    <select
                      value={selectedNode.containerId || ""}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        if (targetId && targetId !== selectedNode.containerId) {
                          handleAssignNodeToContainer(selectedNode.id, targetId);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      {allContainers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {(c.data as GroupNodeData).label || c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* Not currently grouped: dropdown to select container or create new container */
              <div className="space-y-2.5 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                {allContainers.length > 0 ? (
                  <>
                    <label className="text-[10px] font-mono text-slate-400 block">
                      Assign to container (moves block inside):
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignNodeToContainer(selectedNode.id, e.target.value);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="" disabled>
                        -- Select Container to Join --
                      </option>
                      {allContainers.map((c) => {
                        const cData = c.data as GroupNodeData;
                        return (
                          <option key={c.id} value={c.id}>
                            {cData.label || c.id} ({cData.memberCount || 0} blocks)
                          </option>
                        );
                      })}
                    </select>
                  </>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 block text-center py-1">
                    No container boxes on canvas yet
                  </span>
                )}

                <button
                  onClick={() => handleCreateContainerForNode(selectedNode.id)}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all"
                  title="Create a new container box around this block"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Container for this Block
                </button>
              </div>
            )}
          </div>

          {/* Entity Properties */}
          {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
            <div className="mt-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Extracted Attributes
              </span>
              <div className="mt-2 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {Object.entries(selectedNode.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start text-xs font-mono">
                    <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                    <span className="text-slate-200 font-semibold text-right max-w-[180px] truncate">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidentiary Provenance */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" /> Evidentiary Provenance
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Confidence: {Math.round((selectedNode.provenance.confidence ?? 0.95) * 100)}%
              </span>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-2">
                <span className="truncate flex items-center gap-1 font-semibold text-slate-200">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  {selectedNode.provenance.documentName}
                </span>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                  Page {selectedNode.provenance.page || 1}
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded border border-slate-800 italic leading-relaxed font-sans">
                "{selectedNode.provenance.sourceText}"
              </div>

              {onSelectDocument && (
                <button
                  onClick={() =>
                    onSelectDocument(
                      selectedNode.provenance.documentId,
                      selectedNode.provenance.sourceText
                    )
                  }
                  className="mt-3 w-full py-1.5 px-3 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Inspect in Original Evidence
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side Inspector Drawer for Selected Relationship */}
      {selectedEdge && (
        <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-5 shadow-2xl z-20 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              {selectedEdge.type}
            </span>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4">
            <div className="text-base font-bold text-slate-100 tracking-tight">
              {selectedEdge.label || selectedEdge.type}
            </div>
          </div>

          {selectedEdge.properties && Object.keys(selectedEdge.properties).length > 0 && (
            <div className="mt-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Connection Details
              </span>
              <div className="mt-2 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {Object.entries(selectedEdge.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start text-xs font-mono">
                    <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                    <span className="text-slate-200 font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Document Provenance
            </span>

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-2">
                <span className="truncate flex items-center gap-1 font-semibold text-slate-200">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  {selectedEdge.provenance.documentName}
                </span>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                  Page {selectedEdge.provenance.page || 1}
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded border border-slate-800 italic leading-relaxed font-sans">
                "{selectedEdge.provenance.sourceText}"
              </div>

              {onSelectDocument && (
                <button
                  onClick={() =>
                    onSelectDocument(
                      selectedEdge.provenance.documentId,
                      selectedEdge.provenance.sourceText
                    )
                  }
                  className="mt-3 w-full py-1.5 px-3 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Inspect in Original Evidence
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
