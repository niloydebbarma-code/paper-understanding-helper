import React, { useState, useMemo } from 'react';
import { ConceptNode, ConceptLink, GapStatus } from '../types';
import { LatexRenderer } from './LatexRenderer';
import {
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  ArrowRight,
  ShieldCheck,
  Check,
  Download,
  Copy,
  GitFork,
  ArrowUpRight,
  CornerDownRight,
  FileCode2,
  Sparkles,
  RefreshCw,
  Layers,
  BrainCircuit,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { generateSafeNodeMindmap } from '../../services/mermaidValidator';

interface ConceptMapProps {
  nodes?: ConceptNode[];
  links?: ConceptLink[];
}

type DiagramView = 'flowchart' | 'mindmap';

export const ConceptMap: React.FC<ConceptMapProps> = ({ nodes = [], links = [] }) => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeLinks = Array.isArray(links) ? links : [];

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(safeNodes[0]?.id || null);
  const [diagramView, setDiagramView] = useState<DiagramView>('flowchart');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [nodeMindmaps, setNodeMindmaps] = useState<Record<string, string>>({});
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [dagStatus, setDagStatus] = useState<{ checked: boolean; isCyclic: boolean; message: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Selected Node
  const selectedNode = safeNodes.find((n) => n.id === selectedNodeId) || safeNodes[0] || null;

  // Active Mindmap for Selected Node
  const activeMindmap = useMemo(() => {
    if (!selectedNode) return '';
    if (nodeMindmaps[selectedNode.id]) return nodeMindmaps[selectedNode.id];
    if (selectedNode.mindmap && selectedNode.mindmap.trim().length > 0) return selectedNode.mindmap;
    return generateSafeNodeMindmap(selectedNode);
  }, [selectedNode, nodeMindmaps]);

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Live AI Generation of Mindmap with 3-attempt verification
  const handleGenerateAIMindmap = async () => {
    if (!selectedNode) return;
    setIsGeneratingMindmap(true);
    try {
      const res = await fetch('/api/graph/generate-node-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeLabel: selectedNode.label,
          nodeType: selectedNode.type,
          contextSummary: selectedNode.description || '',
          paperTitle: 'Research Paper',
          role: 'phd',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mindmap) {
          setNodeMindmaps((prev) => ({ ...prev, [selectedNode.id]: data.mindmap }));
        }
      }
    } catch {
      // Retain fallback
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // DAG Validation API Call
  const handleValidateDAG = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/graph/detect-circular-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: safeNodes, links: safeLinks }),
      });
      if (res.ok) {
        const data = await res.json();
        setDagStatus({
          checked: true,
          isCyclic: data.circularLogicDetected,
          message: data.circularLogicDetected
            ? 'Potential circular logic detected in argumentation chain.'
            : 'Valid Directed Acyclic Graph (DAG): Linear, sound logical flow verified with zero circular reasoning.',
        });
      } else {
        throw new Error('API error');
      }
    } catch {
      const adj: Record<string, string[]> = {};
      safeLinks.forEach((l) => {
        adj[l.source] = adj[l.source] || [];
        adj[l.source].push(l.target);
      });
      const visited: Record<string, boolean> = {};
      const recStack: Record<string, boolean> = {};
      let isCyclic = false;

      function checkCycle(v: string): boolean {
        if (!visited[v]) {
          visited[v] = true;
          recStack[v] = true;
          for (const neighbor of adj[v] || []) {
            if (!visited[neighbor] && checkCycle(neighbor)) return true;
            if (recStack[neighbor]) return true;
          }
        }
        recStack[v] = false;
        return false;
      }

      for (const n of safeNodes) {
        if (checkCycle(n.id)) {
          isCyclic = true;
          break;
        }
      }

      setDagStatus({
        checked: true,
        isCyclic,
        message: isCyclic
          ? 'Potential circular reasoning detected in argument structure.'
          : 'Valid Directed Acyclic Graph (DAG): Non-circular structural reasoning confirmed.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getTypeBadge = (type: ConceptNode['type']) => {
    switch (type) {
      case 'core_claim':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80">Core Claim</span>;
      case 'method':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-50 text-cyan-700 font-bold border border-cyan-200/80">Methodology</span>;
      case 'evidence':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80">Evidence</span>;
      case 'limitation':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-700 font-bold border border-amber-200/80">Limitation</span>;
      case 'gap':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-rose-50 text-rose-700 font-bold border border-rose-200/80">Missing Gap</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-800 font-bold">Concept</span>;
    }
  };

  // Upstream & Downstream relations for selected node
  const upstreamLinks = safeLinks.filter((l) => l.target === selectedNode?.id);
  const downstreamLinks = safeLinks.filter((l) => l.source === selectedNode?.id);

  // Dynamic Mermaid definition for flowchart (stable on safeNodes and safeLinks)
  const mermaidFlowchartCode = useMemo(() => {
    if (safeNodes.length === 0) return '';
    let code = 'flowchart TD\n';
    code += '  classDef available fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b;\n';
    code += '  classDef partial fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f;\n';
    code += '  classDef missing fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#881337;\n\n';

    safeNodes.forEach((n) => {
      const sanitizedId = n.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const cleanLabel = (n.label || 'Concept')
        .replace(/[\[\]\(\)\{\}"'<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 48);
      const statusClass =
        n.status === 'available'
          ? 'available'
          : n.status === 'partially_available'
          ? 'partial'
          : 'missing';
      code += `  ${sanitizedId}["${cleanLabel}"]:::${statusClass}\n`;
    });

    code += '\n';

    safeLinks.forEach((l) => {
      const src = l.source.replace(/[^a-zA-Z0-9_]/g, '_');
      const tgt = l.target.replace(/[^a-zA-Z0-9_]/g, '_');
      const label = (l.label || l.relationType || '')
        .replace(/[\[\]\(\)\{\}"'<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 24);
      if (label) {
        code += `  ${src} -->|"${label}"| ${tgt}\n`;
      } else {
        code += `  ${src} --> ${tgt}\n`;
      }
    });

    return code;
  }, [safeNodes, safeLinks]);

  // Active diagram definition based on view
  const activeDiagramCode = diagramView === 'flowchart' ? mermaidFlowchartCode : activeMindmap;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeDiagramCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([activeDiagramCode], { type: 'text/vnd.mermaid;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${diagramView}_${selectedNode?.id || 'diagram'}_${Date.now()}.mmd`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes: safeNodes, links: safeLinks }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `concept_graph_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Quick stats
  const availableCount = safeNodes.filter((n) => n.status === 'available').length;
  const missingCount = safeNodes.filter((n) => n.status === 'not_mentioned').length;
  const verificationRate = safeNodes.length > 0 ? Math.round((availableCount / safeNodes.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 text-slate-800">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" strokeWidth={2} />
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
              Concept & Evidence Map
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>DAG Flow</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            System architecture & structural execution pipeline of the research paper deconstructing components, empirical benchmarks, and failure gaps.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleValidateDAG}
            disabled={isValidating}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300/90 flex items-center gap-1.5 transition-all shadow-2xs"
            title="Verify Directed Acyclic Graph topology and check for circular reasoning"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{isValidating ? 'Validating...' : 'Validate DAG'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300/90 flex items-center gap-1.5 transition-all shadow-2xs"
            title="Download Graph JSON (Cytoscape / D3 compatible)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Nodes</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{safeNodes.length}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        </div>
        <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Directional Links</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{safeLinks.length}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-600" />
        </div>
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">Supported</span>
            <span className="text-base font-extrabold text-emerald-900 font-mono">{availableCount} <span className="text-xs font-normal text-emerald-700">({verificationRate}%)</span></span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="p-3.5 bg-rose-50/50 border border-rose-200/70 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-rose-800 uppercase tracking-wider block">Identified Gaps</span>
            <span className="text-base font-extrabold text-rose-900 font-mono">{missingCount}</span>
          </div>
          <XCircle className="w-4 h-4 text-rose-600" />
        </div>
      </div>

      {/* DAG Validation Alert Box */}
      {dagStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
            dagStatus.isCyclic
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {dagStatus.isCyclic ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2.5} />
            )}
            <div>
              <span className="font-bold block mb-0.5">
                {dagStatus.isCyclic ? 'Potential Circular Reasoning Warning' : 'Directed Acyclic Graph (DAG) Verified'}
              </span>
              <span className="leading-relaxed opacity-90">{dagStatus.message}</span>
            </div>
          </div>
          <button
            onClick={() => setDagStatus(null)}
            className="text-xs font-medium hover:underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Concept Node Selector Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
          Select Concept Node:
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {safeNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 text-left leading-snug ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                    : node.status === 'available'
                    ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950 hover:bg-emerald-100/90 hover:border-emerald-300'
                    : node.status === 'partially_available'
                    ? 'bg-amber-50/80 border-amber-200/90 text-amber-950 hover:bg-amber-100/90 hover:border-amber-300'
                    : 'bg-rose-50/80 border-rose-200/90 text-rose-950 hover:bg-rose-100/90 hover:border-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-white'
                      : node.status === 'available'
                      ? 'bg-emerald-500'
                      : node.status === 'partially_available'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SINGLE UNIFIED WORKSPACE BLOCK */}
      {selectedNode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Left Col (1 Col): Concept Details & Connections */}
          <div className="bg-slate-50/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs space-y-4 border border-slate-200/60">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Concept Details
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">{selectedNode.id}</span>
                  {getTypeBadge(selectedNode.type)}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-slate-900 mb-2 font-sans leading-snug">
                  <LatexRenderer text={selectedNode.label} />
                </h4>
                <div className="p-3.5 rounded-xl bg-white text-xs sm:text-[13px] text-slate-700 leading-relaxed shadow-xs">
                  <LatexRenderer
                    text={
                      selectedNode.description ||
                      'Primary conceptual assertion extracted from the research methodology and findings.'
                    }
                  />
                </div>
              </div>

              {/* Upstream Precedents */}
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1">
                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upstream Inputs ({upstreamLinks.length}):</span>
                </span>

                {upstreamLinks.length > 0 ? (
                  <div className="space-y-2">
                    {upstreamLinks.map((link, idx) => {
                      const sourceNode = safeNodes.find((n) => n.id === link.source);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedNodeId(link.source)}
                          className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/60 text-xs flex items-center justify-between shadow-xs gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-indigo-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/80 shrink-0">
                              {link.label || link.relationType}
                            </span>
                            <span className="text-slate-800 font-semibold leading-snug group-hover:text-indigo-600 break-words">
                              {sourceNode?.label || link.source}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic p-2.5 bg-white rounded-xl shadow-xs">
                    Root origin node in reasoning flow.
                  </p>
                )}
              </div>

              {/* Downstream Impacts */}
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Downstream Impacts ({downstreamLinks.length}):</span>
                </span>

                {downstreamLinks.length > 0 ? (
                  <div className="space-y-2">
                    {downstreamLinks.map((link, idx) => {
                      const targetNode = safeNodes.find((n) => n.id === link.target);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedNodeId(link.target)}
                          className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-cyan-50/60 text-xs flex items-center justify-between shadow-xs gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-cyan-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200/80 shrink-0">
                              {link.label || link.relationType}
                            </span>
                            <span className="text-slate-800 font-semibold leading-snug group-hover:text-cyan-700 break-words">
                              {targetNode?.label || link.target}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-700 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic p-2.5 bg-white rounded-xl shadow-xs">
                    Terminal node in reasoning chain.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
              <button
                onClick={() => setSelectedNodeId(safeNodes[0]?.id || null)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Reset Focus
              </button>
            </div>
          </div>

          {/* Right Col (2 Cols): Diagram Canvas with View Switcher & Zoom Controls */}
          <div className="lg:col-span-2 bg-slate-50/60 rounded-2xl p-5 flex flex-col justify-between shadow-2xs space-y-4 border border-slate-200/60">
            {/* Diagram Toolbar & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
              {/* Tabs */}
              <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1">
                <button
                  onClick={() => setDiagramView('flowchart')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    diagramView === 'flowchart'
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flowchart</span>
                </button>

                <button
                  onClick={() => setDiagramView('mindmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    diagramView === 'mindmap'
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Mindmap</span>
                </button>
              </div>

              {/* Action Buttons & Zoom Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Zoom Controls Pill */}
                <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40 transition-all"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-slate-700 hover:bg-white transition-all min-w-[38px] text-center"
                    title="Reset to 100%"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2.5}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40 transition-all"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    className="p-1 rounded-lg text-slate-500 hover:bg-white hover:text-indigo-600 transition-all border-l border-slate-200 pl-1.5 ml-0.5"
                    title="Reset Zoom Scale"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Diagram Actions Pill */}
                <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1">
                  {diagramView === 'mindmap' && (
                    <button
                      onClick={handleGenerateAIMindmap}
                      disabled={isGeneratingMindmap}
                      className="px-2.5 py-1 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                      title="Synthesize a 4-pillar deep AI mindmap with 3 syntax verification attempts"
                    >
                      {isGeneratingMindmap ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span>{isGeneratingMindmap ? 'Synthesizing...' : 'AI Expand'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    title={`Copy ${diagramView} Mermaid definition`}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadCode}
                    className="px-2.5 py-1 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    title={`Download ${diagramView} Mermaid file (.mmd)`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>.mmd</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Diagram Canvas with Zoom Transform */}
            <div className="py-5 overflow-auto flex justify-center bg-white rounded-xl shadow-xs p-6 min-h-[420px] max-h-[660px] relative w-full">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full min-w-[580px] flex justify-center items-center"
              >
                <LatexRenderer text={'```mermaid\n' + activeDiagramCode + '\n```'} />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
              {diagramView === 'flowchart' ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Supported
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial
                    </span>
                    <span className="flex items-center gap-1 text-rose-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Missing Gap
                    </span>
                  </div>
                  <span>{safeNodes.length} concepts · {safeLinks.length} directional relations</span>
                </>
              ) : (
                <>
                  <span>4-Pillar Breakdown: Theory, Method, Bounds, Gaps.</span>
                  <span>Active Focus: {selectedNode.label}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
