import React, { useState } from 'react';
import { FileText, Download, Eye, BookOpen, Layers, Maximize2, ExternalLink } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';
import { DocumentStructuralMetadata } from '../types';

interface PdfDocumentViewerProps {
  pdfBase64?: string;
  pdfUrl?: string;
  markdownContent?: string;
  paperTitle: string;
  documentMetadata?: DocumentStructuralMetadata;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  pdfBase64,
  pdfUrl,
  markdownContent = '',
  paperTitle,
  documentMetadata,
}) => {
  const effectivePdfUrl = pdfUrl || (pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null);
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>(effectivePdfUrl ? 'pdf' : 'text');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const words = markdownContent ? markdownContent.split(/\s+/).filter(Boolean).length : 0;

  const handleDownload = () => {
    if (effectivePdfUrl) {
      const link = document.createElement('a');
      link.href = effectivePdfUrl;
      link.download = `${paperTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      link.click();
    } else {
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paperTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenExternal = () => {
    if (effectivePdfUrl) {
      window.open(effectivePdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-5 text-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-white shadow-2xl' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" strokeWidth={2} />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
              Original Research Paper (PDF Viewer)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold">
              Interactive Document
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Inspect the original publication layout, high-resolution figures, tables, and mathematical equations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {effectivePdfUrl && (
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'text'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Manuscript Text</span>
              </button>
            </div>
          )}

          {effectivePdfUrl && (
            <button
              onClick={handleOpenExternal}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open PDF in a new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>New Tab</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Toggle Expanded Viewer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Expand'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Structural Metadata Strip */}
      <div className="flex items-center gap-3 text-xs font-mono text-slate-700 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex-wrap">
        {documentMetadata ? (
          <>
            <span className="font-semibold text-indigo-900">
              📄 {documentMetadata.totalPages} Pages
            </span>
            <span>•</span>
            <span className="text-slate-800">📊 {documentMetadata.totalFigures} Figures</span>
            <span>•</span>
            <span className="text-slate-800">📋 {documentMetadata.totalTables} Tables</span>
            <span>•</span>
            <span className="text-slate-800">📚 {documentMetadata.totalReferences} References</span>
            <span>•</span>
            <span className="text-slate-800">📑 {documentMetadata.totalSections} Sections</span>
          </>
        ) : (
          <>
            <span>Word Count: <strong className="text-slate-900">{words.toLocaleString()} words</strong></span>
            <span>•</span>
            <span>Document Status: <strong className="text-emerald-700 font-semibold">Verified Active Document</strong></span>
          </>
        )}
      </div>

      {/* Document Viewer Canvas */}
      <div className="rounded-2xl bg-slate-100/60 border border-slate-200/70 overflow-hidden shadow-2xs min-h-[520px]">
        {viewMode === 'pdf' && effectivePdfUrl ? (
          <iframe
            src={effectivePdfUrl}
            title={paperTitle}
            className="w-full h-[680px] border-0 rounded-2xl bg-slate-900"
          />
        ) : (
          <div className="p-8 bg-white space-y-4 text-slate-800 leading-relaxed font-sans max-h-[680px] overflow-y-auto">
            <LatexRenderer text={markdownContent || `# ${paperTitle}\n\n*Original manuscript text ingested for academic verification.*`} />
          </div>
        )}
      </div>
    </div>
  );
};
