import React, { useState, useRef } from 'react';
import { MissingSourceItem } from '../types';
import {
  AlertCircle,
  FilePlus,
  Upload,
  Check,
  RefreshCw,
  Lock,
  Database,
  Code,
  FileText,
  ArrowRight,
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';

interface MissingSourceManagerProps {
  missingSources: MissingSourceItem[];
  supplementaryUploaded: string[];
  onUploadSupplementary: (fileText: string, fileName: string) => void;
  isReanalyzing: boolean;
}

export const MissingSourceManager: React.FC<MissingSourceManagerProps> = ({
  missingSources,
  supplementaryUploaded,
  onUploadSupplementary,
  isReanalyzing,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-line Gap Re-Evaluation Chat State
  const [gapChatInput, setGapChatInput] = useState('');
  const [gapChatMessages, setGapChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: 'Need guidance on resolving a missing dataset or evaluating an unreleased code repository? Type your question or paste experimental parameters below to test gap resolution!',
    },
  ]);
  const [isGapChatLoading, setIsGapChatLoading] = useState(false);

  const getSourceIcon = (type: MissingSourceItem['sourceType']) => {
    switch (type) {
      case 'dataset':
        return <Database className="w-4 h-4 text-purple-600" />;
      case 'code_repository':
        return <Code className="w-4 h-4 text-cyan-600" />;
      case 'reference_paper':
        return <Lock className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitSupplementary = () => {
    if (activeTab === 'file' && selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        onUploadSupplementary(reader.result as string, selectedFile.name);
        setSelectedFile(null);
      };
      reader.readAsText(selectedFile);
    } else if (activeTab === 'paste' && pastedText.trim()) {
      onUploadSupplementary(pastedText, sourceTitle.trim() || 'Supplementary Methodology Notes');
      setPastedText('');
      setSourceTitle('');
    }
  };

  const handleSendGapChat = async (promptToSend?: string) => {
    const q = promptToSend || gapChatInput;
    if (!q.trim() || isGapChatLoading) return;

    const userMsg = { sender: 'user' as const, text: q };
    setGapChatMessages((prev) => [...prev, userMsg]);
    setGapChatInput('');
    setIsGapChatLoading(true);

    try {
      const res = await fetch('/api/chat-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: 'Supplementary Gap Evaluation',
          userRole: 'independent',
          messages: [{ sender: 'user', text: `Regarding missing sources: ${q}` }],
        }),
      });

      const data = await res.json();
      setGapChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: data.text || 'Evaluated gap requirements.' },
      ]);
    } catch (err) {
      setGapChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'To resolve this gap, upload the corresponding appendix or specify the exact hyperparameter values in the text box above to trigger dynamic re-analysis.',
        },
      ]);
    } finally {
      setIsGapChatLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" strokeWidth={1.75} />
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              Data Availability & Missing Source Transparency
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Explicitly flags inaccessible datasets, paywalled references, or unreleased code rather than hallucinating answers.
          </p>
        </div>

        {/* Uploaded Count Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-xs">
          <span className="text-slate-600 font-medium">Resolved Sources:</span>
          <span className="font-bold text-emerald-700 font-mono">
            {missingSources.filter((s) => s.uploaded).length} / {missingSources.length}
          </span>
        </div>
      </div>

      {/* Missing Sources List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
          Flagged Inaccessible / Missing Data Sources
        </h4>

        {missingSources.length === 0 ? (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            <span>All primary datasets and citations referenced in the paper were accessible or fully described.</span>
          </div>
        ) : (
          missingSources.map((source) => (
            <div
              key={source.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                source.uploaded
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-xs">
                  {getSourceIcon(source.sourceType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-sm text-slate-900 font-sans">
                      <LatexRenderer text={source.title} />
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-200 text-slate-800 font-bold uppercase">
                      {source.sourceType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 mt-1">
                    <strong className="text-slate-900 font-semibold">Reason Needed:</strong> <LatexRenderer text={source.reasonNeeded} />
                  </div>
                  <span className="text-[11px] font-mono text-indigo-700 block mt-1 font-semibold">
                    Ref: <LatexRenderer text={source.citationOrRef} />
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {source.uploaded ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2.5} />
                    <span>Provided & Re-analyzed</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-xs">
                    <Lock className="w-3.5 h-3.5 text-rose-600" strokeWidth={2} />
                    <span>Missing / Paywalled</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Two-Column Section: Upload/Paste Textual Input + Dedicated In-Line Gap Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Direct Textual Input & File Dropzone for Re-Analysis */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-indigo-600" strokeWidth={2} />
              <h4 className="text-sm font-bold text-slate-900 font-sans">
                Upload or Paste Supplementary Notes to Re-Analyze
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have access to the missing code parameters, appendix table, or dataset? Upload or paste it here to automatically recalculate transparency scores and resolve gaps.
            </p>

            {/* Mode Switcher */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'paste' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Paste Textual Notes
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'file' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Upload File (.pdf / .txt)
              </button>
            </div>
          </div>

          {activeTab === 'paste' ? (
            <div className="space-y-3 pt-2">
              <input
                type="text"
                placeholder="Supplementary Source Name (e.g. Training Config Commit)"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
              <textarea
                rows={5}
                placeholder="Paste supplementary parameters, variance error bars, or dataset appendices here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono shadow-xs leading-relaxed"
              />
              <button
                onClick={handleSubmitSupplementary}
                disabled={isReanalyzing || !pastedText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isReanalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Re-Evaluating Gaps...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Re-Evaluate Paper Gaps</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.pdf"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="w-6 h-6 text-indigo-600" />
                <span className="font-semibold text-xs text-slate-900">
                  {selectedFile ? selectedFile.name : 'Select supplementary file to upload'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Supports PDF, TXT, or Markdown</span>
              </div>

              {selectedFile && (
                <button
                  onClick={handleSubmitSupplementary}
                  disabled={isReanalyzing}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  {isReanalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Re-Evaluating Gaps...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Re-Evaluate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Currently Uploaded Sources Log */}
          {supplementaryUploaded.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block mb-1.5">Resolved Supplementary Files:</span>
              <div className="flex flex-wrap gap-2">
                {supplementaryUploaded.map((file, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1 font-bold shadow-xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                    <span>{file}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dedicated In-Line Gap & Re-Evaluation Chat */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                <h4 className="text-sm font-bold text-slate-900 font-sans">
                  Gap & Replication Assistant Chat
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-900 font-bold">
                In-Line
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Inquire about missing data risks or ask how to replicate missing datasets:
            </p>
          </div>

          {/* In-Line Chat History */}
          <div className="flex-1 p-4 bg-white border border-slate-200/80 rounded-xl space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto text-xs sm:text-[13px] shadow-2xs">
            {gapChatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-indigo-200/80">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl leading-relaxed max-w-[90%] shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-50 text-slate-800 font-medium border border-slate-200/70'
                  }`}
                >
                  <LatexRenderer
                    text={msg.text}
                    className={msg.sender === 'user' ? 'text-white [&_*]:text-white' : 'text-slate-900'}
                  />
                </div>
              </div>
            ))}
            {isGapChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Evaluating replication requirements...</span>
              </div>
            )}
          </div>

          {/* Quick Starter Prompts for Missing Data */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => handleSendGapChat('What is the biggest risk of the unreleased code repository?')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 shrink-0 transition-colors"
            >
              Code Repo Risk?
            </button>
            <button
              onClick={() => handleSendGapChat('Can this experiment be replicated without the paywalled dataset?')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 shrink-0 transition-colors"
            >
              Paywall Replicability?
            </button>
          </div>

          {/* Input Bar */}
          <div className="relative flex items-center bg-white border border-slate-300 focus-within:border-indigo-600 rounded-xl p-1 pl-3 shadow-xs">
            <input
              type="text"
              placeholder="Ask about missing sources or replication..."
              value={gapChatInput}
              onChange={(e) => setGapChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendGapChat()}
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={() => handleSendGapChat()}
              disabled={!gapChatInput.trim() || isGapChatLoading}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
