"use client";

import { JSX, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { NodeType, TreeNode } from "./project-structure-types";

type ProjectStructureGraphProps = {
  tree: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  typeLabel: (type: NodeType) => string;
};

type GraphNodeData = Record<string, unknown> & {
  label: JSX.Element;
  treeNode: TreeNode;
};

function getNodeStyle(node: TreeNode, isSelected: boolean) {
  if (isSelected) {
    return {
        border: "2px solid #f9fafb",
        background: "#000000",
        color: "#ffffff",
        borderRadius: 14,
        padding: 0,
        width: 220,
        boxShadow: "0 0 0 4px rgba(255,255,255,0.08), 0 16px 36px rgba(0,0,0,0.65)",
    };
  }

  if (!node.canRead) {
    return {
        border: "1px dashed #6b7280",
        background: "#1f2937",
        color: "#9ca3af",
        borderRadius: 14,
        padding: 0,
        width: 220,
        opacity: 0.75,
    };
  }

  return {
    border: "1px solid #374151",
    background: "#111827",
    color: "#f9fafb",
    borderRadius: 14,
    padding: 0,
    width: 220,
    boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
    };
}

function getNodeBadgeClass(nodeType: NodeType) {
  switch (nodeType) {
    case "AUDIT_AREA":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PROCESS":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "CONTROL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "TEST_STEP":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FINDING":
      return "bg-red-50 text-red-700 border-red-200";
    case "EVIDENCE":
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function buildGraph(
  tree: TreeNode[],
  selectedId: string | null,
  typeLabel: (type: NodeType) => string,
) {
  const nodes: Node<GraphNodeData>[] = [];
  const edges: Edge[] = [];

  let row = 0;

  function walk(
    items: TreeNode[],
    depth: number,
    parentId: string | null,
  ) {
    items.forEach((item) => {
      const currentRow = row;
      row += 1;

      const isSelected = selectedId === item.id;

      nodes.push({
        id: item.id,
        position: {
          x: depth * 290,
          y: currentRow * 115,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          treeNode: item,
          label: (
            <div className="space-y-2 px-3 py-3 text-left">
              <div
                className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  isSelected
                    ? "border-white/30 bg-white/10 text-white"
                    : getNodeBadgeClass(item.nodeType)
                }`}
              >
                {typeLabel(item.nodeType)}
              </div>

              <div className="line-clamp-2 text-sm font-semibold leading-snug">
                {item.label}
              </div>

              {!item.canRead && (
                <div className="text-[11px] opacity-70">
                  No read permission
                </div>
              )}
            </div>
          ),
        },
        style: getNodeStyle(item, isSelected),
      });

      if (parentId) {
        edges.push({
            id: `${parentId}-${item.id}`,
            source: parentId,
            target: item.id,
            type: "smoothstep",
            animated: selectedId === item.id || selectedId === parentId,
            style: {
                stroke: selectedId === item.id || selectedId === parentId ? "#ffffff" : "#6b7280",
                strokeWidth: selectedId === item.id || selectedId === parentId ? 2.5 : 1.5,
            },
            });
      }

      if (item.children.length > 0) {
        walk(item.children, depth + 1, item.id);
      }
    });
  }

  walk(tree, 0, null);

  return { nodes, edges };
}

export default function ProjectStructureGraph({
  tree,
  selectedId,
  onSelect,
  typeLabel,
}: ProjectStructureGraphProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(tree, selectedId, typeLabel),
    [tree, selectedId, typeLabel],
  );

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        zoomOnScroll
        panOnDrag
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => {
          onSelect(node.data.treeNode);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={18} />
        <MiniMap
        pannable
        zoomable
        nodeColor="#111827"
        maskColor="rgba(0,0,0,0.65)"
        style={{
            backgroundColor: "#020617",
            border: "1px solid #374151",
        }}
        />
      </ReactFlow>
    </div>
  );
}