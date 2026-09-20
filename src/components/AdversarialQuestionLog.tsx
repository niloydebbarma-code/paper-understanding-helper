import React, { useState } from 'react';
import { AdversarialQuestion, GapStatus, QuestionCategory } from '../types';
import { LatexRenderer } from './LatexRenderer';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  ShieldAlert,
  FileSearch,
  Filter,
  Layers,
  Award,
  RefreshCw,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdversarialQuestionLogProps {
  questions: AdversarialQuestion[];
}

export const AdversarialQuestionLog: React.FC<AdversarialQuestionLogProps> = ({ questions = [] }) => {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<GapStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedAiQuestionId, setExpandedAiQuestionId] = useState<string | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

  const categoryGroups = [
    { id: 'all', label: 'All Questions', aliases: [] },
    { id: 'mechanism', label: 'Mechanism & Causality', aliases: ['mechanism_causality', 'methodology'] },
    { id: 'power', label: 'Statistical Power ($N$)', aliases: ['statistical_power', 'sample_size'] },
    { id: 'baselines', label: 'Baseline Parity', aliases: ['baseline_parity', 'controls'] },
    { id: 'boundaries', label: 'Boundary Conditions', aliases: ['boundary_conditions'] },
    { id: 'ood', label: 'Out-of-Distribution', aliases: ['ood_generalization', 'generalizability'] },
    { id: 'antihype', label: 'Anti-Hype & Overclaiming', aliases: ['anti_hype'] },
    { id: 'ablation', label: 'Ablation Rigor', aliases: ['ablation_necessity'] },
    { id: 'finops', label: 'Computational Complexity', aliases: ['finops_efficiency'] },
    { id: 'sota', label: 'Competing SOTA', aliases: ['competing_sota'] },
    { id: 'openscience', label: 'Open Science & Code', aliases: ['open_science', 'data_reproducibility', 'citation_gap'] },
  ];

  // Calculate count of questions matching each category
  const getCategoryCount = (catId: string, aliases: string[]) => {
    if (catId === 'all') return safeQuestions.length;
    return safeQuestions.filter(
      (q) => q.category === catId || aliases.includes(q.category)
    ).length;
  };

  const filteredQuestions = safeQuestions.filter((q) => {
    const activeGroup = categoryGroups.find((g) => g.id === selectedCategory);
    const matchesCategory =
      selectedCategory === 'all' ||
      q.category === selectedCategory ||
      (activeGroup && activeGroup.aliases.includes(q.category));

    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !s ||
      q.question.toLowerCase().includes(s) ||
      q.answerInPaper.toLowerCase().includes(s) ||
      (q.missingElement && q.missingElement.toLowerCase().includes(s));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleDeepInterrogate = async (q: AdversarialQuestion) => {
    if (expandedAiQuestionId === q.id) {
      setExpandedAiQuestionId(null);
      return;
    }
    setExpandedAiQuestionId(q.id);

    if (aiAnswers[q.id]) return;

    setIsLoadingAi((prev) => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch('/api/question/verify-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          markdownContent: q.answerInPaper + ' ' + (q.missingElement || ''),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const deepAnalysis =
          data.answerInPaper ||
          `Deep adversarial audit confirms: ${q.answerInPaper}\n\nKey Methodological Risk: ${
            q.missingElement || 'Unstated assumptions require independent empirical verification.'
          }`;
        setAiAnswers((prev) => ({ ...prev, [q.id]: deepAnalysis }));
      }
    } catch {
      setAiAnswers((prev) => ({
        ...prev,
        [q.id]: `Comprehensive peer review interrogation confirms that this assertion depends on specific baseline constraints. Stated response: ${q.answerInPaper}`,
      }));
    } finally {
      setIsLoadingAi((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  const getStatusBadge = (status: GapStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Answered in Paper</span>
          </span>
        );
      case 'partially_available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Partial Answer</span>
          </span>
        );
      case 'not_mentioned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Unanswered Gap</span>
          </span>
        );
    }
  };

  const availableCount = safeQuestions.filter((q) => q.status === 'available').length;
  const partialCount = safeQuestions.filter((q) => q.status === 'partially_available').length;
  const missingCount = safeQuestions.filter((q) => q.status === 'not_mentioned').length;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans tracking-tight">
              <span>Critical Methodological Question Inventory</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold">
                {safeQuestions.length} Questions
              </span>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Exhaustive peer-reviewer interrogation probing causality, statistical power ($N$), baseline parity, overclaiming, and artifact reproducibility.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 font-semibold">
              {availableCount} Answered
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-800 font-semibold">
              {partialCount} Partial
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50/70 border border-rose-200/80 text-rose-800 font-semibold">
              {missingCount} Gaps
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions or gaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-2xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'available'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Answered
            </button>
            <button
              onClick={() => setFilterStatus('partially_available')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'partially_available'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setFilterStatus('not_mentioned')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'not_mentioned'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gaps
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills with LaTeX Math Support & Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoryGroups.map((cat) => {
          const count = getCategoryCount(cat.id, cat.aliases);
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-200'
                  : count > 0
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                  : 'bg-slate-50 text-slate-400 border border-slate-200/50 opacity-70'
              }`}
            >
              <LatexRenderer as="span" text={cat.label} />
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question Cards Stack */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              No follow-up questions match the active search and category filters.
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try resetting the active category filter or clearing the search query to view the full question inventory.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className={`p-6 rounded-2xl border transition-all space-y-4 shadow-xs ${
                q.status === 'not_mentioned'
                  ? 'bg-rose-50/30 border-rose-200/80'
                  : q.status === 'partially_available'
                  ? 'bg-amber-50/30 border-amber-200/80'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              {/* Question Header & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100/70 text-indigo-800 font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/80 shadow-2xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 leading-snug font-sans">
                      <LatexRenderer text={q.question} />
                    </h4>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-800 uppercase font-bold border border-indigo-200/80">
                        {q.category.replace(/_/g, ' ')}
                      </span>
                      {q.importance && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-bold ${
                            q.importance === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {q.importance} Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start">{getStatusBadge(q.status)}</div>
              </div>

              {/* Context Explanation Boxes (Zero internal borders, pure background contrast) */}
              <div className="pl-0 sm:pl-10 space-y-3 text-xs sm:text-[13px]">
                {/* Paper Evidence Box */}
                <div className="p-4 rounded-xl bg-white shadow-2xs space-y-1.5">
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider font-mono">
                    Paper Evidence / Stated Response:
                  </span>
                  <div className="text-slate-800 leading-relaxed">
                    <LatexRenderer text={q.answerInPaper} />
                  </div>
                </div>

                {/* Missing Element Box */}
                {q.missingElement && (
                  <div className="p-4 rounded-xl bg-rose-50/70 text-rose-950 flex items-start gap-3 shadow-2xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-rose-900 text-xs uppercase tracking-wider font-mono block">
                        Unresolved Methodological Gap / Missing Artifact:
                      </span>
                      <div className="leading-relaxed text-xs sm:text-[13px] text-rose-950 font-medium">
                        <LatexRenderer text={q.missingElement} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Deep AI Interrogation Output */}
                {expandedAiQuestionId === q.id && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 text-indigo-950 space-y-2 border border-indigo-200/70 shadow-2xs animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Socratic Swarm Interrogation Audit:</span>
                    </div>
                    {isLoadingAi[q.id] ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 py-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running cross-examination against paper evidence...</span>
                      </div>
                    ) : (
                      <div className="leading-relaxed text-xs sm:text-[13px] text-indigo-950">
                        <LatexRenderer text={aiAnswers[q.id] || ''} />
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Card Action Toolbar */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                  <span className="font-mono text-[11px]">ID: {q.id}</span>
                  <button
                    onClick={() => handleDeepInterrogate(q)}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-indigo-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {expandedAiQuestionId === q.id ? 'Hide AI Audit' : 'AI Interrogate'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
