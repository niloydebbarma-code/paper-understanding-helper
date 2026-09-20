import React from 'react';
import { UserRole, PaperAnalysis } from '../types';
import { USER_ROLES, getRoleDetail } from '../data/userRoles';
import { FileText, ShieldAlert, Sparkles, BookOpen, RefreshCw, Terminal, Layers } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeAnalysis: PaperAnalysis | null;
  onNewPaper: () => void;
  onOpenRoleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  activeAnalysis,
  onNewPaper,
  onOpenRoleModal,
}) => {
  const roleDetail = getRoleDetail(currentRole);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 px-4 lg:px-8 py-3.5 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding (Clean, Uncluttered & Compact) */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNewPaper}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none font-sans">
              The Agentic Research Reviewer
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-indigo-50 text-indigo-700">
              Peer-Review Engine
            </span>
          </div>
        </div>

        {/* Right Controls: Role Lens & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end w-full sm:w-auto">
          {/* Active Paper Quick Rigor & Transparency Badge */}
          {activeAnalysis && (
            <div className="hidden xl:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 text-xs">
              <div className="flex items-center gap-1.5" title="Overall Methodological Rigor Score">
                <span className="text-slate-600 font-medium">Rigor:</span>
                <span className={`font-bold font-mono ${
                  activeAnalysis.overallRigorScore >= 80 ? 'text-emerald-700' :
                  activeAnalysis.overallRigorScore >= 60 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {activeAnalysis.overallRigorScore}/100
                </span>
              </div>
              <div className="w-px h-3 bg-slate-300" />
              <div className="flex items-center gap-1.5" title="Source Data Transparency Score">
                <span className="text-slate-600 font-medium">Transparency:</span>
                <span className={`font-bold font-mono ${
                  activeAnalysis.transparencyScore >= 80 ? 'text-emerald-700' :
                  activeAnalysis.transparencyScore >= 60 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {activeAnalysis.transparencyScore}/100
                </span>
              </div>
            </div>
          )}

          {/* User Role Selector Badge */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 text-xs font-semibold transition-all group border border-slate-200/80"
            title="Change User Perspective / Lens"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            <span className="text-slate-600 font-normal">Role:</span>
            <span className="font-bold text-slate-900">
              {roleDetail.title.split('/')[0]}
            </span>
            <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 rounded-md font-mono font-bold">
              {roleDetail.badge}
            </span>
          </button>

          {/* New Paper Button */}
          {activeAnalysis && (
            <button
              onClick={onNewPaper}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
