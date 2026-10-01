import { Node, Edge } from "@xyflow/react";
import { Entity, EntityType, EvidenceDocument, GraphEdgeData, GraphNodeData, Relationship } from "@/types";

export interface GraphBuildResult {
  nodes: Node<GraphNodeData>[];
  edges: Edge<GraphEdgeData>[];
  stats: {
    totalEntities: number;
    totalRelationships: number;
    entityTypeCounts: Record<EntityType, number>;
  };
}

/**
 * Normalizes entity names to assist cross-document resolution.
 */
function normalizeEntityKey(type: EntityType, name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${type}_${clean}`;
}

export function buildGraphFromDocuments(documents: EvidenceDocument[]): GraphBuildResult {
  const completedDocs = documents.filter((d) => d.status === "completed" && d.extractedData);

  const mergedEntities = new Map<
    string,
    {
      entity: Entity;
      provenances: Entity["provenance"][];
      connectedEdgeCount: number;
    }
  >();

  const rawRelationships: Relationship[] = [];
  const entityIdAliasMap = new Map<string, string>(); // oldId -> mergedId

  // 1. Collect and merge entities across documents
  for (const doc of completedDocs) {
    if (!doc.extractedData) continue;

    for (const ent of doc.extractedData.entities) {
      const key = normalizeEntityKey(ent.type, ent.name);
      if (mergedEntities.has(key)) {
        const existing = mergedEntities.get(key)!;
        existing.provenances.push(ent.provenance);
        // Merge properties
        existing.entity.properties = {
          ...existing.entity.properties,
          ...ent.properties,
        };
        entityIdAliasMap.set(ent.id, existing.entity.id);
      } else {
        const canonicalId = `node_${key}`;
        entityIdAliasMap.set(ent.id, canonicalId);
        mergedEntities.set(key, {
          entity: {
            ...ent,
            id: canonicalId,
          },
          provenances: [ent.provenance],
          connectedEdgeCount: 0,
        });
      }
    }

    // Collect relationships
    for (const rel of doc.extractedData.relationships) {
      rawRelationships.push(rel);
    }
  }

  // 2. Resolve relationships to canonical node IDs
  const edges: Edge<GraphEdgeData>[] = [];
  const seenEdgeKeys = new Set<string>();

  for (const rel of rawRelationships) {
    const sourceId = entityIdAliasMap.get(rel.source) || rel.source;
    const targetId = entityIdAliasMap.get(rel.target) || rel.target;

    // Only add edge if both endpoints exist or target is an event
    if (!sourceId || !targetId || sourceId === targetId) continue;

    const edgeKey = `${sourceId}_${rel.type}_${targetId}`;
    if (seenEdgeKeys.has(edgeKey)) continue;
    seenEdgeKeys.add(edgeKey);

    // Update degree count
    const srcEnt = Array.from(mergedEntities.values()).find((v) => v.entity.id === sourceId);
    if (srcEnt) srcEnt.connectedEdgeCount++;
    const tgtEnt = Array.from(mergedEntities.values()).find((v) => v.entity.id === targetId);
    if (tgtEnt) tgtEnt.connectedEdgeCount++;

    const isAnimated = rel.type === "TRANSFERRED_TO" || rel.type === "CALLED";

    edges.push({
      id: `edge_${rel.id || edgeKey}`,
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      animated: isAnimated,
      label: rel.label || rel.type.replace(/_/g, " "),
      data: {
        id: rel.id,
        type: rel.type,
        label: rel.label || rel.type,
        properties: rel.properties,
        provenance: rel.provenance,
      },
      style: {
        stroke: getEdgeColor(rel.type),
        strokeWidth: 2,
      },
    });
  }

  // 3. Layout calculation: Circular / Force-concentric arrangement
  const nodes: Node<GraphNodeData>[] = [];
  const entityList = Array.from(mergedEntities.values());
  const count = entityList.length;

  const entityTypeCounts: Record<EntityType, number> = {
    PERSON: 0,
    PHONE: 0,
    BANK_ACCOUNT: 0,
    LOCATION: 0,
    ORGANIZATION: 0,
    VEHICLE: 0,
    EVENT: 0,
    TRANSACTION: 0,
  };

  const centerX = 450;
  const centerY = 350;
  const radius = Math.max(220, count * 35);

  entityList.forEach((item, index) => {
    const { entity, provenances, connectedEdgeCount } = item;
    entityTypeCounts[entity.type] = (entityTypeCounts[entity.type] || 0) + 1;

    // Angle distribution with subtle radius jitter for cluster aesthetics
    const angle = (2 * Math.PI * index) / Math.max(count, 1);
    const radOffset = index % 2 === 0 ? 0 : 50;
    const x = centerX + (radius + radOffset) * Math.cos(angle);
    const y = centerY + (radius + radOffset) * Math.sin(angle);

    nodes.push({
      id: entity.id,
      type: "criminalNode",
      position: { x, y },
      data: {
        id: entity.id,
        label: entity.name,
        type: entity.type,
        properties: entity.properties,
        provenance: entity.provenance,
        documentCount: provenances.length,
        degree: connectedEdgeCount,
      },
    });
  });

  return {
    nodes,
    edges,
    stats: {
      totalEntities: nodes.length,
      totalRelationships: edges.length,
      entityTypeCounts,
    },
  };
}

function getEdgeColor(type: string): string {
  switch (type) {
    case "TRANSFERRED_TO":
      return "#10B981"; // Emerald
    case "CALLED":
      return "#06B6D4"; // Cyan
    case "USES":
      return "#6366F1"; // Indigo
    case "OWNS":
      return "#F59E0B"; // Amber
    case "LOCATED_AT":
      return "#F43F5E"; // Rose
    case "ASSOCIATED_WITH":
    default:
      return "#8B5CF6"; // Purple
  }
}
