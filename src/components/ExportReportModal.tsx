import React from 'react';
import { PaperAnalysis, UserRole } from '../types';
import { getRoleDetail } from '../data/userRoles';
import { LatexRenderer } from './LatexRenderer';
import { X, Download, FileText, Code, Check } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: PaperAnalysis;
  userRole: UserRole;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  userRole,
}) => {
  if (!isOpen) return null;

  const roleDetail = getRoleDetail(userRole);

  const generateMarkdownReport = (): string => {
    return `# Critical Paper Analysis Report: ${analysis.title}
**Authors:** ${analysis.authors.join(', ')} (${analysis.year})
**Venue:** ${analysis.journalOrConference}
**Perspective:** ${roleDetail.title} (${roleDetail.badge})
**Rigor Score:** ${analysis.overallRigorScore}/100 | **Transparency Score:** ${analysis.transparencyScore}/100
**Analyzed At:** ${analysis.analyzedAt}

---

## 1. Problem Statement & Real-World Impact
${
  analysis.problemStatement
    ? `- **Core Problem:** ${analysis.problemStatement.coreProblem}
- **Real-World Impact:** ${analysis.problemStatement.realWorldImpact}
- **Prior Limitations:** ${analysis.problemStatement.priorLimitations}
- **Claimed Breakthrough:** ${analysis.problemStatement.claimedBreakthrough}`
    : `*Core problem and claimed advance documented in executive summary.*`
}

---

## 2. Executive Summary
${analysis.executiveSummary}

## Role-Adapted Overview (${roleDetail.title})
${analysis.roleAdaptedOverview}

---

## 3. Claim vs. Evidence Matrix (Boundary Conditions & Verdicts)
${analysis.claims
  .map(
    (c) => `
### Claim #${c.claimNumber}: ${c.statement}
- **Section:** ${c.section}
- **Evidence Summary:** ${c.evidenceSummary}
- **Evidence Type:** ${c.evidenceType} (Support Level: ${c.supportLevel})
- **Adversarial Objection:** ${c.adversarialObjection}
- **Status Marker:** ${c.gapStatus.toUpperCase()}
- **Gap Reasoning:** ${c.gapReasoning}
${c.verdict ? `- **Audited Verdict:** ${c.verdict.verdictBadge} (Confidence: ${c.verdict.confidenceScore}%)` : ''}
${
  c.boundaryConditions && c.boundaryConditions.length > 0
    ? `- **Boundary Conditions:**\n${c.boundaryConditions
        .map((bc) => `  * [${bc.status.toUpperCase()}] ${bc.condition} ➔ ${bc.outcome} (${bc.explanation})`)
        .join('\n')}`
    : ''
}
${
  c.verificationChecklist && c.verificationChecklist.length > 0
    ? `- **Verification Checklist:**\n${c.verificationChecklist
        .map((item) => `  * [${item.result.toUpperCase()}] ${item.criterion}: ${item.details}`)
        .join('\n')}`
    : ''
}
`
  )
  .join('\n')}

---

## 4. Critical Methodological Question Inventory (${analysis.questions.length} Questions)
${analysis.questions
  .map(
    (q, idx) => `
### Q${idx + 1} [${q.category.toUpperCase()}]: ${q.question}
- **Status:** ${q.status.toUpperCase()}
- **Paper Evidence / Stated Response:** ${q.answerInPaper}
${q.missingElement ? `- **Unresolved Gap / Missing Artifact:** ${q.missingElement}` : ''}
`
  )
  .join('\n')}

---

## 5. Data Availability & Missing Sources
${analysis.missingSources
  .map(
    (s) => `
- **${s.title}** (${s.sourceType})
  - Citation: ${s.citationOrRef}
  - Reason Needed: ${s.reasonNeeded}
  - Status: ${s.uploaded ? 'PROVIDED & RE-ANALYZED' : 'MISSING / PAYWALLED'}
`
  )
  .join('\n')}

---

## 6. Stated vs. Unstated Limitations
### Stated Limitations:
${analysis.statedLimitations.map((l) => `- ${l}`).join('\n')}

### Unstated Limitations (Audited Gaps):
${analysis.unStatedLimitations.map((l) => `- ${l}`).join('\n')}

---

## 7. Suggested Search Keywords for Independent Follow-Up
${analysis.suggestedKeywords.map((k) => `- "${k.keyword}" (${k.category}): ${k.purpose}`).join('\n')}
`;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_critical_analysis.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-900 font-sans">Export Analysis Report</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-sans">
          Download the full claim-vs-evidence evaluation, gap markers, and adversarial questions for paper:
          <span className="text-slate-900 block mt-1 font-sans font-bold">
            <LatexRenderer text={analysis.title} />
          </span>
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDownloadMarkdown}
            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 font-sans">
                  Markdown Critical Report (.md)
                </h4>
                <p className="text-xs text-slate-600">Formatted with headers, tables, and gap analysis.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </button>

          <button
            onClick={handleDownloadJson}
            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 font-sans">
                  Structured JSON Data (.json)
                </h4>
                <p className="text-xs text-slate-600">Raw graph nodes, links, and questions object.</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
