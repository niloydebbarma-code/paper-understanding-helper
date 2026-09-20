import React from 'react';
import { UserRole } from '../types';
import { USER_ROLES } from '../data/userRoles';
import { X, Check, BookOpen, GraduationCap, Sparkles, Target, Microscope, Eye, Users, Briefcase } from 'lucide-react';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  phd: <Microscope className="w-5 h-5 text-purple-400" />,
  masters: <GraduationCap className="w-5 h-5 text-indigo-400" />,
  undergrad: <BookOpen className="w-5 h-5 text-blue-400" />,
  independent: <Eye className="w-5 h-5 text-teal-400" />,
  reviewer: <Target className="w-5 h-5 text-rose-400" />,
  communicator: <Sparkles className="w-5 h-5 text-amber-400" />,
  educator: <Users className="w-5 h-5 text-emerald-400" />,
  practitioner: <Briefcase className="w-5 h-5 text-cyan-400" />,
};

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-sans">Select Your Research Perspective</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Adapts the adversarial analysis, language complexity (B2/C1/C2), and explanation focus to match your goal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50">
          {USER_ROLES.map((role) => {
            const isSelected = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  onSelectRole(role.id);
                  onClose();
                }}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between group shadow-xs ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-700'}`}>
                      {ROLE_ICONS[role.id]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors font-sans">
                        {role.title}
                      </h3>
                      <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {role.badge}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="p-1 rounded-full bg-indigo-600 text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed font-sans">
                  {role.description}
                </p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="italic truncate max-w-[240px] font-sans">"{role.perspective}"</span>
                  <span className="font-mono text-indigo-700 font-semibold shrink-0">{role.readingLevel.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>You can switch your role perspective at any time during analysis.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-xs"
          >
            Confirm Perspective
          </button>
        </div>
      </div>
    </div>
  );
};
