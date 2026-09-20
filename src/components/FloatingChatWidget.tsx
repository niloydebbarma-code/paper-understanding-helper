import React, { useState, useRef, useEffect } from 'react';
import { PaperAnalysis, UserRole, ChatMessage } from '../types';
import { getRoleDetail } from '../data/userRoles';
import {
  MessageSquare,
  Send,
  X,
  ShieldAlert,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';

interface FloatingChatWidgetProps {
  analysis: PaperAnalysis;
  userRole: UserRole;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  analysis,
  userRole,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Greetings. I am your Socratic Peer Reviewer for "${analysis.title}". I am reviewing through your active perspective: ${getRoleDetail(userRole).title}. Ask me anything about methodological flaws, sample sizes, unstated assumptions, or code reproduction!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roleDetail = getRoleDetail(userRole);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const msgText = textToSend || input;
    if (!msgText.trim() || isLoading) return;

    setLastFailedQuery(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: analysis.title,
          paperContent: analysis.executiveSummary,
          analysis,
          userRole,
          messages: updatedMessages,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reach peer reviewer server.');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setLastFailedQuery(msgText);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Error contacting peer reviewer: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What is the single biggest methodological weakness in this paper?',
    'Is the evaluation sample size (N) statistically powered to prove the claims?',
    'What unstated mathematical or physical assumptions are the authors relying on?',
    'How would you design a rigorous experiment to independently replicate this?',
  ];

  return (
    <>
      {/* Floating Action Button (Always Visible in Place at Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => onToggle(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white ${
            isOpen ? 'bg-slate-900 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
          }`}
          title={isOpen ? 'Close Socratic Chat' : 'Open Socratic Peer Reviewer Chat'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-2 ring-indigo-600 animate-pulse" />
              <MessageSquare className="w-6 h-6" />
            </div>
          )}
        </button>
      </div>

      {/* Docked Rounded Chat Box (Opens in Place Without Moving the Page) */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[460px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-3xl bg-white border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <ShieldAlert className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Socratic Peer Reviewer</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-900 font-bold">
                    {roleDetail.title.split('/')[0]} Lens
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 truncate max-w-[240px]">
                  Paper: <strong>{analysis.title}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => onToggle(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
            {messages.map((m) => {
              const isError = m.text.startsWith('⚠️ Error');

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                        : isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none font-medium'
                    }`}
                  >
                    <div>
                      <LatexRenderer
                        text={m.text}
                        className={m.sender === 'user' ? 'text-white [&_*]:text-white' : 'text-slate-900'}
                      />
                    </div>

                    {isError && lastFailedQuery && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 flex justify-end">
                        <button
                          onClick={() => handleSend(lastFailedQuery)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}

                    <span
                      className={`block text-[9px] mt-1.5 text-right font-mono ${
                        m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold text-[10px]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick-Starter Inquiry Chips */}
            {messages.length <= 2 && (
              <div className="pt-2 space-y-2 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Suggested Inquiry Prompts:</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-all shadow-xs group flex items-center justify-between gap-2"
                    >
                      <span className="text-[11px] text-slate-800 group-hover:text-indigo-950 font-medium leading-snug">
                        "{prompt}"
                      </span>
                      <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0 opacity-70 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-700 p-3 bg-white rounded-xl border border-slate-200 w-fit shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Peer Reviewer is formulating critique...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="relative flex items-center bg-slate-50 border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-1.5 pl-3.5 transition-all shadow-xs">
              <input
                type="text"
                placeholder={`Ask as ${roleDetail.title.split('/')[0]}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-xs shrink-0 flex items-center justify-center font-bold active:scale-95 ml-1.5"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
