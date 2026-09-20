import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';

if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      primaryColor: '#e0e7ff',
      primaryTextColor: '#0f172a',
      primaryBorderColor: '#6366f1',
      lineColor: '#4f46e5',
      secondaryColor: '#f1f5f9',
      secondaryTextColor: '#0f172a',
      tertiaryColor: '#ffffff',
      tertiaryTextColor: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      mindmapTextColor: '#0f172a',
      nodeBorder: '#6366f1',
      clusterBkg: '#f8fafc',
      titleColor: '#0f172a',
      edgeLabelBackground: '#ffffff',
    },
    mindmap: {
      padding: 14,
      maxNodeWidth: 280,
    },
    flowchart: {
      padding: 16,
      nodeSpacing: 45,
      rankSpacing: 45,
      curve: 'basis',
    },
  });
}

let mermaidCounter = 0;

const MermaidBlock: React.FC<{ code: string }> = ({ code }) => {
  const [svg, setSvg] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!code || !code.trim()) return;
      try {
        setIsRendering(true);
        const uniqueId = `mermaid-svg-${Date.now()}-${mermaidCounter++}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, code.trim());
        if (isMounted) {
          setSvg(renderedSvg);
          setIsRendering(false);
        }
      } catch {
        if (typeof document !== 'undefined') {
          const strayElements = document.querySelectorAll('[id^="dmermaid-"], [id^="mermaid-svg-"]');
          strayElements.forEach((el) => el.remove());
        }
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [code]);

  if (!svg && isRendering) {
    return (
      <div className="my-3 p-6 flex items-center justify-center text-xs font-mono text-slate-500 animate-pulse">
        <span>Compiling visual vector diagram...</span>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-3 p-4 text-center text-xs text-slate-500">
        <span>Visual diagram ready.</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-1 w-full overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

interface LatexRendererProps {
  text?: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

/**
 * Preprocesses raw text to normalize LaTeX math expressions and edge-case LLM outputs
 * before feeding into remark-math and rehype-katex.
 */
function normalizeLatexAndMarkdown(content: string): string {
  if (!content) return '';

  let normalized = content;

  // 1. Convert isolated multiline single dollar signs (e.g. "\n$\n...\n$\n") to "$$\n...\n$$"
  normalized = normalized.replace(/(?:^|\n)\s*\$\s*\n([\s\S]*?)\n\s*\$\s*(?:\n|$)/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 2. Convert LaTeX display delimiters \[ ... \] to $$ ... $$
  normalized = normalized.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 3. Convert LaTeX inline delimiters \( ... \) to $ ... $
  normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 4. Convert \begin{equation}...\end{equation} to $$ ... $$
  normalized = normalized.replace(
    /\\begin\{(?:equation|align|gather|flalign|multline)\*?\}([\s\S]*?)\\end\{(?:equation|align|gather|flalign|multline)\*?\}/g,
    (_, math) => `\n\n$$\n\\begin{aligned}\n${math.trim()}\n\\end{aligned}\n$$\n\n`
  );

  // 5. Ensure block math $$ is properly surrounded with newlines so remark-math parses correctly
  normalized = normalized.replace(/([^\n])\$\$/g, '$1\n\n$$');
  normalized = normalized.replace(/\$\$([^\n])/g, '$$\n\n$1');

  return normalized;
}

/**
 * Universal Academic LaTeX Math & GitHub-Flavored Markdown Renderer
 * Powered by ReactMarkdown, remark-gfm, remark-math, and rehype-katex.
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({
  text = '',
  className = '',
}) => {
  if (!text) return null;

  const preprocessed = normalizeLatexAndMarkdown(text);

  return (
    <div className={`academic-markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 mt-4 mb-2 pb-1.5 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-[13px] leading-relaxed mb-2.5 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 my-2 text-xs sm:text-[13px]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 my-2 text-xs sm:text-[13px]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-500 pl-3 py-1.5 my-2.5 text-slate-700 bg-indigo-50/40 rounded-r-lg text-xs italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/80 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-bold text-slate-900 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-700 border-r border-slate-200 last:border-r-0 align-top">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] border border-slate-200 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            if (codeClassName && codeClassName.includes('language-mermaid')) {
              return <MermaidBlock code={String(children)} />;
            }

            return (
              <div className="my-2.5 rounded-xl bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono text-xs border border-slate-800 shadow-xs">
                <code {...props}>{children}</code>
              </div>
            );
          },
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          hr: () => (
            <hr className="my-3.5 border-slate-200" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-semibold transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {preprocessed}
      </ReactMarkdown>
    </div>
  );
};
