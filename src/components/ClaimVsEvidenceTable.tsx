import React, { useState } from 'react';
import { ClaimItem, GapStatus, BoundaryCondition, VerificationChecklistItem, ClaimPerspectiveArgument } from '../types';
import { LatexRenderer } from './LatexRenderer';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  GitBranch,
  ListChecks,
  Users,
  HelpCircle,
  Award,
  Sparkles,
  Info,
  Scale,
  MessageSquare,
  LayoutGrid,
  Table as TableIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ClaimVsEvidenceTableProps {
  claims: ClaimItem[];
  onSelectClaim?: (claim: ClaimItem) => void;
}

export const ClaimVsEvidenceTable: React.FC<ClaimVsEvidenceTableProps> = ({
  claims,
  onSelectClaim,
}) => {
  const [filterStatus, setFilterStatus] = useState<GapStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'open_cards' | 'table'>('open_cards');
  const [collapsedClaims, setCollapsedClaims] = useState<Record<string, boolean>>({});

  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === 'all' || claim.gapStatus === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      claim.statement.toLowerCase().includes(q) ||
      claim.section.toLowerCase().includes(q) ||
      claim.evidenceSummary.toLowerCase().includes(q) ||
      claim.adversarialObjection.toLowerCase().includes(q) ||
      (claim.verdict?.verdictBadge && claim.verdict.verdictBadge.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const toggleClaimCollapse = (claimId: string) => {
    setCollapsedClaims((prev) => ({
      ...prev,
      [claimId]: !prev[claimId],
    }));
  };

  const expandAllClaims = () => {
    setCollapsedClaims({});
  };

  const collapseAllClaims = () => {
    const allCollapsed: Record<string, boolean> = {};
    claims.forEach((c) => {
      allCollapsed[c.id] = true;
    });
    setCollapsedClaims(allCollapsed);
  };

  const getStatusBadge = (status: GapStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Available / Proven</span>
          </span>
        );
      case 'partially_available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Partially Proven</span>
          </span>
        );
      case 'not_mentioned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Missing Gap</span>
          </span>
        );
    }
  };

  const getSupportBadge = (level: ClaimItem['supportLevel']) => {
    switch (level) {
      case 'strong':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Strong Proof</span>;
      case 'moderate':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">Moderate Support</span>;
      case 'weak':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-orange-100 text-orange-800 border border-orange-200">Weak / Author Asserted</span>;
      case 'unsupported':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-200">Unsupported Claim</span>;
    }
  };

  const getChecklistResultBadge = (result: VerificationChecklistItem['result']) => {
    switch (result) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Partial</span>
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Unsupported</span>
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
            <span>Missing Data</span>
          </span>
        );
    }
  };

  const getBoundaryStatusBadge = (status: BoundaryCondition['status']) => {
    switch (status) {
      case 'holds':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            HOLDS ✔
          </span>
        );
      case 'fails':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
            FAILS ✖
          </span>
        );
      case 'untested':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            UNTESTED ⚠
          </span>
        );
    }
  };

  const getPerspectiveVerdictBadge = (verdict: ClaimPerspectiveArgument['verdict']) => {
    switch (verdict) {
      case 'valid':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Valid Argument</span>;
      case 'contested':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">Contested / Disputed</span>;
      case 'unproven':
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">Unproven Assertion</span>;
    }
  };

  const availableCount = claims.filter((c) => c.gapStatus === 'available').length;
  const partialCount = claims.filter((c) => c.gapStatus === 'partially_available').length;
  const missingCount = claims.filter((c) => c.gapStatus === 'not_mentioned').length;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Table Header & Toolbar (Cohesive & Cleanly Aligned) */}
      <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-sans">
              <span>Explainable Claim vs. Evidence Matrix</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                {claims.length} Extracted Claims
              </span>
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Full-depth multi-perspective audit: every claim is deconstructed into boundary conditions (IF-THEN), empirical verification checklists, and adversarial challenges.
          </p>
        </div>

        {/* Unified Horizontal Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter claims, objections, verdicts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({claims.length})
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'available' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified ({availableCount})
              </button>
              <button
                onClick={() => setFilterStatus('partially_available')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'partially_available' ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Partial ({partialCount})
              </button>
              <button
                onClick={() => setFilterStatus('not_mentioned')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === 'not_mentioned' ? 'bg-rose-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Missing ({missingCount})
              </button>
            </div>

            {/* Expand All / Collapse All Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={expandAllClaims}
                className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1 font-medium"
                title="Expand All Claims"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Expand All</span>
              </button>
              <button
                onClick={collapseAllClaims}
                className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1 font-medium"
                title="Collapse All Claims"
              >
                <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODE 1: OPEN, FULL-PAGE ACADEMIC CLAIM DOSSIERS (ZERO CLICKS NEEDED) */}
      <div className="space-y-6">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            No claims match the active search query or filter tags.
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const isCollapsed = Boolean(collapsedClaims[claim.id]);

            return (
              <div
                key={claim.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 transition-all hover:border-slate-300"
              >
                {/* Claim Header Bar */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-2 max-w-4xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 font-mono text-xs font-bold flex items-center justify-center border border-indigo-200">
                        #{claim.claimNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {claim.section}
                      </span>
                      {getSupportBadge(claim.supportLevel)}
                      {claim.verdict && (
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          {claim.verdict.confidenceScore}% Confidence
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      <LatexRenderer text={claim.statement} />
                    </h4>
                  </div>

                  {/* Top Status Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start">
                    {getStatusBadge(claim.gapStatus)}
                    <button
                      onClick={() => toggleClaimCollapse(claim.id)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                      title={isCollapsed ? 'Expand Claim Details' : 'Collapse Claim Details'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT (SHOWN FULLY BY DEFAULT) */}
                {!isCollapsed && (
                  <div className="space-y-6 pt-1 animate-fadeIn">
                    {/* Two-Column Core Comparison: Evidence vs Adversarial Challenge */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Empirical Evidence Cited */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Empirical Evidence Presented in Paper:</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{claim.evidenceType}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          <LatexRenderer text={claim.evidenceSummary} />
                        </div>
                      </div>

                      {/* Right: Adversarial Objection & Challenge */}
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-sans flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>Adversarial Reviewer Challenge & Objection:</span>
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                          <LatexRenderer text={claim.adversarialObjection} />
                        </div>
                      </div>
                    </div>

                    {/* Section: Conditional Boundary Rules (IF-THEN Logic) */}
                    {claim.boundaryConditions && claim.boundaryConditions.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-indigo-600" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                            Boundary Conditions & Operating Limits (IF-THEN):
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {claim.boundaryConditions.map((bc, bIdx) => (
                            <div
                              key={bIdx}
                              className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 shadow-xs ${
                                bc.status === 'holds'
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : bc.status === 'fails'
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : 'bg-amber-50/50 border-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                {getBoundaryStatusBadge(bc.status)}
                                <span className="text-[11px] font-mono text-slate-500 font-medium">
                                  Confidence: <strong className="text-slate-900 capitalize">{bc.confidence}</strong>
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div className="font-bold text-slate-900 text-sm leading-snug">
                                  <LatexRenderer text={bc.condition} />
                                </div>
                                <div className="text-indigo-950 font-mono text-xs font-semibold leading-relaxed">
                                  <LatexRenderer text={bc.outcome} />
                                </div>
                              </div>

                              <div className="text-xs sm:text-[13px] text-slate-800 pt-2 border-t border-slate-200/80 leading-relaxed">
                                <LatexRenderer text={bc.explanation} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Verification Criteria Checklist */}
                    {claim.verificationChecklist && claim.verificationChecklist.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-indigo-600" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                            Empirical Criteria Checklist:
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {claim.verificationChecklist.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900">
                                  <LatexRenderer text={item.criterion} />
                                </div>
                                <div className="text-slate-600 text-xs leading-relaxed">
                                  <LatexRenderer text={item.details} />
                                </div>
                              </div>
                              <div className="shrink-0">{getChecklistResultBadge(item.result)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Multi-Perspective Debate */}
                    {claim.perspectiveArguments && claim.perspectiveArguments.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                            Stakeholder Perspectives & Counter-Arguments:
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {claim.perspectiveArguments.map((arg, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2 shadow-xs"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-indigo-900">
                                    {arg.viewpoint}
                                  </span>
                                  {getPerspectiveVerdictBadge(arg.verdict)}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-2 italic">
                                  "<LatexRenderer text={arg.argument} />"
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                                <strong className="text-slate-900 font-semibold">Proof / Caveat:</strong> <LatexRenderer text={arg.evidenceOrCaveat} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audited Verdict & Action Row */}
                    <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-700" />
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                            Audited Claim Verdict:
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-indigo-900">
                            <LatexRenderer text={claim.verdict?.verdictBadge || 'Empirically Supported within Stated Bounds'} />
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <LatexRenderer text={claim.verdict?.takeaway || claim.gapReasoning} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {claim.verdict?.scholarSearchQuery && (
                          <a
                            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(
                              claim.verdict.scholarSearchQuery
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <span>Google Scholar Query</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        )}

                        {onSelectClaim && (
                          <button
                            onClick={() => onSelectClaim(claim)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Interrogate Claim</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
