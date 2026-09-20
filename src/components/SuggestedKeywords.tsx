import React, { useState } from 'react';
import { SearchKeywordSuggestion } from '../types';
import { LatexRenderer } from './LatexRenderer';
import { ExternalLink, Copy, Check, Compass, Search, Sparkles } from 'lucide-react';

interface SuggestedKeywordsProps {
  suggestions: SearchKeywordSuggestion[];
}

export const SuggestedKeywords: React.FC<SuggestedKeywordsProps> = ({ suggestions }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getCategoryBadge = (category: SearchKeywordSuggestion['category']) => {
    switch (category) {
      case 'replication':
        return <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-100 text-indigo-900">Replication & Verification</span>;
      case 'competing_method':
        return <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-200 text-slate-800">Competing Approaches</span>;
      case 'theoretical_foundation':
        return <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-100 text-indigo-900">Theoretical Foundation</span>;
      case 'data_source':
        return <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-200 text-slate-800">Datasets & Repos</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              Suggested Search Keywords for Independent Follow-Up
            </h3>
          </div>
          <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">
            Targeted search queries to encourage independent critical verification on Google Scholar, PubMed, or arXiv rather than full AI reliance.
          </p>
        </div>
      </div>

      {/* Keywords Grid (Natural Whitespace & Borderless Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 transition-all flex flex-col justify-between group shadow-xs space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                {getCategoryBadge(item.category)}
              </div>

              <div className="p-3.5 rounded-xl bg-white font-mono text-xs text-indigo-950 font-semibold mb-3 leading-snug shadow-xs">
                "<LatexRenderer text={item.keyword} />"
              </div>

              <div className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900 font-semibold">Purpose:</strong> <LatexRenderer text={item.purpose} />
              </div>
            </div>

            {/* Action Buttons with Secondary Styling (No Competing Neon Overload) */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
              <button
                onClick={() => handleCopy(item.keyword, idx)}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-xs"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                    <span className="text-emerald-800 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                    <span>Copy Query</span>
                  </>
                )}
              </button>

              <a
                href={item.queryUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>Scholar Search</span>
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
