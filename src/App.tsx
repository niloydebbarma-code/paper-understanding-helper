import React, { useState } from 'react';
import { UserRole, PaperAnalysis, ClaimItem } from './types';
import { SAMPLE_PAPERS, SamplePaper } from './data/samplePapers';
import { getRoleDetail } from './data/userRoles';
import { Header } from './components/Header';
import { RoleSelectorModal } from './components/RoleSelectorModal';
import { PaperUploader } from './components/PaperUploader';
import { ClaimVsEvidenceTable } from './components/ClaimVsEvidenceTable';
import { AdversarialQuestionLog } from './components/AdversarialQuestionLog';
import { MissingSourceManager } from './components/MissingSourceManager';
import { ConceptMap } from './components/ConceptMap';
import { SuggestedKeywords } from './components/SuggestedKeywords';
import { FloatingChatWidget } from './components/FloatingChatWidget';
import { ExportReportModal } from './components/ExportReportModal';
import { PdfDocumentViewer } from './components/PdfDocumentViewer';
import { LatexRenderer } from './components/LatexRenderer';
import {
  FileText,
  ShieldAlert,
  Table,
  HelpCircle,
  Network,
  AlertCircle,
  Compass,
  MessageSquare,
  Download,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('phd');
  const [activeAnalysis, setActiveAnalysis] = useState<PaperAnalysis | null>(SAMPLE_PAPERS[0].analysis);
  const [viewMode, setViewMode] = useState<'single_page' | 'tabs'>('single_page');
  const [activeDashboardTab, setActiveDashboardTab] = useState<
    'claims' | 'questions' | 'concept_map' | 'missing_sources' | 'keywords'
  >('claims');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState<string | null>(null);

  // Modals / Drawers
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const roleDetail = getRoleDetail(currentRole);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handler for analyzing custom uploaded paper or pasted text
  const handleAnalyzePaper = async (payload: {
    paperText: string;
    paperName: string;
    isPdf?: boolean;
    pdfBase64?: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    if (payload.pdfBase64) {
      setUploadedPdfBase64(payload.pdfBase64);
    } else {
      setUploadedPdfBase64(null);
    }

    try {
      const res = await fetch('/api/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperText: payload.paperText,
          paperName: payload.paperName,
          role: currentRole,
          isPdf: payload.isPdf,
          pdfBase64: payload.pdfBase64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze paper.');
      }

      const data: PaperAnalysis = await res.json();
      setActiveAnalysis(data);
      setActiveDashboardTab('claims');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during paper analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for 1-click sample paper selection
  const handleSelectSample = async (sample: SamplePaper) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setUploadedPdfBase64(null);

    // If role matches default PhD and sample already has instant analysis pre-computed, use it directly!
    if (currentRole === 'phd' && sample.analysis) {
      setActiveAnalysis(sample.analysis);
      setActiveDashboardTab('claims');
      setIsAnalyzing(false);
      return;
    }

    // Otherwise run live persona adaptation on Bedrock
    await handleAnalyzePaper({
      paperText: sample.fullText,
      paperName: sample.title,
    });
  };

  // Handler for uploading supplementary material file
  const handleUploadSupplementary = async (supplementaryText: string, sourceName: string) => {
    if (!activeAnalysis) return;

    setIsReanalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/reanalyze-supplementary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalAnalysis: activeAnalysis,
          supplementaryText,
          sourceName,
          role: currentRole,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to re-analyze paper with supplementary source.');
      }

      const updatedData: PaperAnalysis = await res.json();
      setActiveAnalysis(updatedData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-analyze supplementary source.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleSelectClaimForChat = (_claim: ClaimItem) => {
    setIsChatOpen(true);
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (!activeAnalysis) return;

    setIsAnalyzing(true);
    try {
      const currentSample = SAMPLE_PAPERS.find((s) => s.analysis.paperId === activeAnalysis.paperId);
      const textToUse = currentSample?.fullText || activeAnalysis.markdownContent || activeAnalysis.executiveSummary;

      const res = await fetch('/api/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperText: textToUse,
          paperName: activeAnalysis.title,
          role: newRole,
        }),
      });

      if (res.ok) {
        const data: PaperAnalysis = await res.json();
        setActiveAnalysis(data);
      }
    } catch (err) {
      console.warn('Role adaptation re-run notice:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        activeAnalysis={activeAnalysis}
        onNewPaper={() => {
          setActiveAnalysis(null);
          setUploadedPdfBase64(null);
        }}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-bold">Analysis Warning: </span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Paper Ingestion Section (Uploader & Benchmarks) */}
        {!activeAnalysis ? (
          <PaperUploader
            currentRole={currentRole}
            onSelectRole={handleRoleChange}
            onAnalyze={handleAnalyzePaper}
            onSelectSample={handleSelectSample}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          /* Active Review Dashboard Workspace */
          <div className="space-y-8 animate-fadeIn">
            {/* Top Paper Summary & Lens Ribbon Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 font-mono">
                    {activeAnalysis.journalOrConference || 'Peer-Review Session'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-500">{activeAnalysis.year || '2026'}</span>
                  {activeAnalysis.documentMetadata && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono font-bold text-slate-700">
                        📄 {activeAnalysis.documentMetadata.totalPages} Pages
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight font-sans">
                  {activeAnalysis.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {Array.isArray(activeAnalysis.authors) ? activeAnalysis.authors.join(', ') : 'Research Authors'}
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm leading-relaxed space-y-2 shadow-xs">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Role-Adapted Summary ({roleDetail.badge}):</span>
                  </div>
                  <div className="text-slate-800 leading-relaxed">
                    <LatexRenderer text={activeAnalysis.roleAdaptedOverview} />
                  </div>
                </div>
              </div>

              {/* Right Side Stats & Actions */}
              <div className="flex flex-col gap-3 shrink-0 min-w-[240px] w-full lg:w-auto">
                {/* Scores Block */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Methodological Rigor:</span>
                    <span className={`font-mono font-bold text-sm ${
                      activeAnalysis.overallRigorScore >= 80 ? 'text-emerald-700' :
                      activeAnalysis.overallRigorScore >= 60 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {activeAnalysis.overallRigorScore}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        activeAnalysis.overallRigorScore >= 80 ? 'bg-emerald-600' :
                        activeAnalysis.overallRigorScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeAnalysis.overallRigorScore}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">Data Transparency:</span>
                    <span className={`font-mono font-bold text-sm ${
                      activeAnalysis.transparencyScore >= 80 ? 'text-emerald-700' :
                      activeAnalysis.transparencyScore >= 60 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {activeAnalysis.transparencyScore}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        activeAnalysis.transparencyScore >= 80 ? 'bg-emerald-600' :
                        activeAnalysis.transparencyScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeAnalysis.transparencyScore}%` }}
                    />
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                    title="Open Original Research Paper in PDF Viewer"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Original PDF</span>
                  </button>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Socratic Chat</span>
                  </button>

                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium border border-slate-300 flex items-center justify-center transition-colors shadow-xs"
                    title="Export Critical Report"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode Switcher & Quick Navigation Bar */}
            <div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* 5 Core Academic Jump Anchors */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none text-xs min-w-0 flex-1">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider pl-1 pr-1 hidden xl:inline-block shrink-0">
                  Jump To:
                </span>
                <button
                  onClick={() => scrollToSection('section-claims')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all font-semibold flex items-center gap-2 shrink-0 shadow-xs group"
                >
                  <Table className="w-4 h-4 text-slate-600 group-hover:text-slate-900" strokeWidth={1.75} />
                  <span>1. Claims Matrix</span>
                </button>

                <button
                  onClick={() => scrollToSection('section-questions')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all font-semibold flex items-center gap-2 shrink-0 shadow-xs group"
                >
                  <HelpCircle className="w-4 h-4 text-slate-600 group-hover:text-slate-900" strokeWidth={1.75} />
                  <span>2. Question Inventory</span>
                </button>

                <button
                  onClick={() => scrollToSection('section-concept-map')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all font-semibold flex items-center gap-2 shrink-0 shadow-xs group"
                >
                  <Network className="w-4 h-4 text-slate-600 group-hover:text-slate-900" strokeWidth={1.75} />
                  <span>3. Concept Map</span>
                </button>

                <button
                  onClick={() => scrollToSection('section-missing-sources')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all font-semibold flex items-center gap-2 shrink-0 shadow-xs group"
                >
                  <AlertCircle className="w-4 h-4 text-slate-600 group-hover:text-slate-900" strokeWidth={1.75} />
                  <span>4. Missing Sources</span>
                </button>

                <button
                  onClick={() => scrollToSection('section-keywords')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all font-semibold flex items-center gap-2 shrink-0 shadow-xs group"
                >
                  <Compass className="w-4 h-4 text-slate-600 group-hover:text-slate-900" strokeWidth={1.75} />
                  <span>5. Search Queries</span>
                </button>
              </div>

              {/* View Mode Segmented Control */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setViewMode('single_page')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      viewMode === 'single_page'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    📜 Single-Page
                  </button>
                  <button
                    onClick={() => setViewMode('tabs')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      viewMode === 'tabs'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    📑 Tabbed Mode
                  </button>
                </div>
              </div>
            </div>

            {/* MODE 1: CONTINUOUS SINGLE-PAGE SERIAL STREAM */}
            {viewMode === 'single_page' && (
              <div className="space-y-10 animate-fadeIn">
                {/* 1. Claim vs Evidence Matrix */}
                <section id="section-claims" className="scroll-mt-36">
                  <ClaimVsEvidenceTable
                    claims={activeAnalysis.claims}
                    onSelectClaim={handleSelectClaimForChat}
                  />
                </section>

                {/* 2. Scientific-Debate Follow-Up Question Inventory */}
                <section id="section-questions" className="scroll-mt-36">
                  <AdversarialQuestionLog questions={activeAnalysis.questions} />
                </section>

                {/* 3. Concept & Evidence Map */}
                <section id="section-concept-map" className="scroll-mt-36">
                  <ConceptMap nodes={activeAnalysis.nodes} links={activeAnalysis.links} />
                </section>

                {/* 4. Missing Sources & Data Availability */}
                <section id="section-missing-sources" className="scroll-mt-36">
                  <MissingSourceManager
                    missingSources={activeAnalysis.missingSources}
                    supplementaryUploaded={activeAnalysis.supplementarySourcesUploaded}
                    onUploadSupplementary={handleUploadSupplementary}
                    isReanalyzing={isReanalyzing}
                  />
                </section>

                {/* 5. Suggested Search Queries */}
                <section id="section-keywords" className="scroll-mt-36">
                  <SuggestedKeywords suggestions={activeAnalysis.suggestedKeywords} />
                </section>
              </div>
            )}

            {/* MODE 2: CLASSIC TABBED VIEW */}
            {viewMode === 'tabs' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
                  <button
                    onClick={() => setActiveDashboardTab('claims')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      activeDashboardTab === 'claims'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span>Claim vs Evidence Matrix ({activeAnalysis.claims.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveDashboardTab('questions')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      activeDashboardTab === 'questions'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Question Inventory ({activeAnalysis.questions.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveDashboardTab('concept_map')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      activeDashboardTab === 'concept_map'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Network className="w-4 h-4" />
                    <span>Concept Map</span>
                  </button>

                  <button
                    onClick={() => setActiveDashboardTab('missing_sources')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      activeDashboardTab === 'missing_sources'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Missing Sources & Data ({activeAnalysis.missingSources.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveDashboardTab('keywords')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      activeDashboardTab === 'keywords'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Suggested Search Queries</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {activeDashboardTab === 'claims' && (
                    <ClaimVsEvidenceTable
                      claims={activeAnalysis.claims}
                      onSelectClaim={handleSelectClaimForChat}
                    />
                  )}

                  {activeDashboardTab === 'questions' && (
                    <AdversarialQuestionLog questions={activeAnalysis.questions} />
                  )}

                  {activeDashboardTab === 'concept_map' && (
                    <ConceptMap nodes={activeAnalysis.nodes} links={activeAnalysis.links} />
                  )}

                  {activeDashboardTab === 'missing_sources' && (
                    <MissingSourceManager
                      missingSources={activeAnalysis.missingSources}
                      supplementaryUploaded={activeAnalysis.supplementarySourcesUploaded}
                      onUploadSupplementary={handleUploadSupplementary}
                      isReanalyzing={isReanalyzing}
                    />
                  )}

                  {activeDashboardTab === 'keywords' && (
                    <SuggestedKeywords suggestions={activeAnalysis.suggestedKeywords} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Academic Footer */}
      <footer className="mt-16 py-6 border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-sans text-slate-800">
            <span className="font-bold text-slate-900">The Agentic Research Reviewer</span>
            <span className="text-slate-300">•</span>
            <span>Single-Paper Adversarial Audit Engine</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-sans text-xs">
            <span>Powered by Amazon Bedrock Multi-Agent Swarm</span>
          </div>
        </div>
      </footer>

      {/* Floating Socratic Peer Reviewer Chat Widget */}
      {activeAnalysis && (
        <FloatingChatWidget
          analysis={activeAnalysis}
          userRole={currentRole}
          isOpen={isChatOpen}
          onToggle={(open) => setIsChatOpen(open)}
        />
      )}

      {/* Export Report Modal */}
      {activeAnalysis && (
        <ExportReportModal
          analysis={activeAnalysis}
          userRole={currentRole}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Role Selection Modal */}
      <RoleSelectorModal
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Dedicated Interactive PDF Document Viewer Modal */}
      {activeAnalysis && isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Original Publication Viewer
                </h3>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all shadow-2xs"
                title="Close PDF Viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <PdfDocumentViewer
                pdfBase64={uploadedPdfBase64 || undefined}
                pdfUrl={activeAnalysis.pdfUrl}
                markdownContent={activeAnalysis.markdownContent}
                paperTitle={activeAnalysis.title}
                documentMetadata={activeAnalysis.documentMetadata}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
