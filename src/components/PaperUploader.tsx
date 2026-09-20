import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { SAMPLE_PAPERS, SamplePaper } from '../data/samplePapers';
import { USER_ROLES, getRoleDetail } from '../data/userRoles';
import { LatexRenderer } from './LatexRenderer';
import { Upload, FileText, Sparkles, BookOpen, AlertCircle, ArrowRight, Check, ShieldAlert, Cpu, HeartPulse } from 'lucide-react';

interface PaperUploaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onAnalyze: (payload: { paperText: string; paperName: string; isPdf?: boolean; pdfBase64?: string }) => void;
  onSelectSample: (sample: SamplePaper) => void;
  isAnalyzing: boolean;
}

const MULTI_AGENT_STEPS = [
  'IDP Layer: PDF Linearization to Academic Markdown (.md) & S3 Archiving...',
  'Agent 1 (Amazon Nova Micro): Structural Claim & Methodology Extraction...',
  'Agent 2 (Anthropic Claude Opus 4.5): Adversarial Reviewer & Methodological Challenge Generation...',
  'Agent 3 (Amazon Nova Pro / Lite): Empirical Evidence Cross-Checking & Gap Verification...',
  'Agent 4 (Meta Llama 3.3 70B): Citation, Paywall & Missing Dependency Audit...',
  'Agent 5 (Amazon Nova Micro): Role-Adaptive Synthesis & DynamoDB Checkpointing...'
];

export const PaperUploader: React.FC<PaperUploaderProps> = ({
  currentRole,
  onSelectRole,
  onAnalyze,
  onSelectSample,
  isAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('samples');
  const [pastedText, setPastedText] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleDetail = getRoleDetail(currentRole);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev < MULTI_AGENT_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500); // Simulate agent handoffs
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (activeTab === 'upload' && selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          const resultStr = reader.result as string;
          const base64Data = resultStr.split(',')[1];
          onAnalyze({
            paperText: `PDF Document: ${selectedFile.name}`,
            paperName: selectedFile.name.replace('.pdf', ''),
            isPdf: true,
            pdfBase64: base64Data,
          });
        };
        reader.readAsDataURL(selectedFile);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          onAnalyze({
            paperText: reader.result as string,
            paperName: selectedFile.name,
            isPdf: false,
          });
        };
        reader.readAsText(selectedFile);
      }
    } else if (activeTab === 'paste' && pastedText.trim()) {
      onAnalyze({
        paperText: pastedText,
        paperName: paperTitle.trim() || 'Pasted Research Paper',
        isPdf: false,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn text-slate-900">
      {/* Hero Banner (Standardized Consistent Branding) */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" strokeWidth={2} />
          <span>Single-Paper Depth Over Multi-Paper Breadth</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Critically Interrogate Your Research Paper
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
          Unlike passive explainers or broad citation graph matchers, <strong className="text-slate-900 font-semibold">The Agentic Research Reviewer</strong> performs adversarial, claim-by-claim audits on a single paper—evaluating empirical proofs, boundary conditions, and inaccessible datasets.
        </p>
      </div>

      {/* Main Mode Selector & Input Container */}
      <div className="space-y-6">
        {/* Clean Segmented Mode Selector */}
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <button
              onClick={() => setActiveTab('samples')}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'samples'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Landmark Benchmarks (Instant)</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Upload PDF Document</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Paste Paper Text</span>
            </button>
          </div>
        </div>

        {/* Input Views */}
        <div>
          {/* TAB 1: SAMPLES (Multi-Disciplinary Landmark Papers with Full Uncut Abstracts) */}
          {activeTab === 'samples' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-600">
                  Select a pre-loaded landmark benchmark across Computer Science, Medicine, Economics, or Physics:
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {SAMPLE_PAPERS.length} Benchmarks Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SAMPLE_PAPERS.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between group space-y-4 shadow-sm"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800">
                          {sample.field}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                          {sample.year}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                        <LatexRenderer text={sample.title} />
                      </h3>

                      <div className="text-[14.5px] sm:text-[15px] text-slate-700 leading-[1.65] font-normal">
                        <LatexRenderer text={sample.abstract} />
                      </div>
                    </div>

                    {/* Secondary Ghost Button to Eliminate Neon Clutter */}
                    <button
                      onClick={() => onSelectSample(sample)}
                      disabled={isAnalyzing}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all group-hover:bg-indigo-100 shadow-xs"
                    >
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center">
                          <span>Multi-Agent Swarm Processing...</span>
                          <span className="text-[10px] opacity-90 mt-0.5">{MULTI_AGENT_STEPS[loadingStepIdx]}</span>
                        </div>
                      ) : (
                        <>
                          <span>Examine This Paper ({roleDetail.title.split('/')[0]})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] bg-white ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/40'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="p-3.5 rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-base text-slate-900 font-serif">{selectedFile.name}</span>
                    <span className="text-xs text-slate-600 font-mono">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for adversarial extraction
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-bold text-base text-slate-900 font-serif block">
                        Drag and drop your research paper PDF here
                      </span>
                      <span className="text-xs text-slate-500 font-mono mt-1 block">
                        Supports PDF, Text (.txt), or Markdown (.md)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isAnalyzing ? (
                    <div className="w-full text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Multi-Agent Swarm Orchestrating...</span>
                      </div>
                      <span className="text-[10px] text-indigo-100 font-mono opacity-90">{MULTI_AGENT_STEPS[loadingStepIdx]}</span>
                    </div>
                  ) : (
                    <>
                      <span>Start Adversarial Analysis ({roleDetail.title.split('/')[0]})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 3: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4 max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 font-serif">Paper Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Attention Is All You Need"
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 font-serif">Paper Full Text or Abstract + Methods</label>
                <textarea
                  rows={8}
                  placeholder="Paste paper text, abstract, claims, and methodology sections here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed shadow-xs"
                />
              </div>

              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || !pastedText.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isAnalyzing ? (
                  <div className="w-full text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Multi-Agent Swarm Orchestrating...</span>
                    </div>
                    <span className="text-[10px] text-indigo-100 font-mono opacity-90">{MULTI_AGENT_STEPS[loadingStepIdx]}</span>
                  </div>
                ) : (
                  <>
                    <span>Analyze Pasted Text ({roleDetail.title.split('/')[0]})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
