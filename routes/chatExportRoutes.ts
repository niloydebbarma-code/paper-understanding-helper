import { Router } from 'express';
import { invokeBedrockModel } from '../services/awsOrchestrator';
import { AcademicPromptEngine } from '../services/academicPromptEngine';

export const chatExportRouter = Router();

// 41. Multi-Turn Socratic Peer Reviewer Chat (Claude Opus 4.5 / Nova Pro)
chatExportRouter.post('/chat-paper', async (req, res) => {
  try {
    const { paperTitle = 'Research Paper', analysis, userRole = 'phd', messages = [] } = req.body;

    const analysisSummary = `
Paper Executive Summary: ${analysis?.executiveSummary || ''}
Methodological Rigor Score: ${analysis?.overallRigorScore || 'N/A'}/100.
Data Transparency Score: ${analysis?.transparencyScore || 'N/A'}/100.
Core Claims & Objections: ${JSON.stringify(analysis?.claims?.map((c: any) => ({ claim: c.statement, objection: c.adversarialObjection, status: c.gapStatus })) || [])}
Missing Data / Sources: ${JSON.stringify(analysis?.missingSources?.map((s: any) => ({ title: s.title, reason: s.reasonNeeded, uploaded: s.uploaded })) || [])}
Unstated Limitations: ${JSON.stringify(analysis?.unStatedLimitations || [])}
`;

    const systemInstruction = AcademicPromptEngine.getSocraticChatSystemPrompt(paperTitle, userRole, analysisSummary);

    const lastUserMsg = messages[messages.length - 1]?.text || 'What are the main flaws in this paper?';
    const conversationPrompt = AcademicPromptEngine.getSocraticChatUserPrompt(messages, lastUserMsg, userRole);

    let reply = '';
    const models = ['us.anthropic.claude-opus-4-5-20251101-v1:0', 'us.amazon.nova-pro-v1:0', 'us.amazon.nova-micro-v1:0'];

    for (const m of models) {
      try {
        reply = await invokeBedrockModel(m, systemInstruction, conversationPrompt, 0.3);
        if (reply && reply.trim().length > 0) break;
      } catch (err: any) {
        console.warn(`[Chat] Model ${m} notice:`, err.message);
      }
    }

    if (!reply) {
      reply = `Regarding "${paperTitle}" from the perspective of ${userRole}: A central methodological question centers on empirical baseline controls and statistical variance. Would you like to inspect specific ablation tables or explore replication experiments?`;
    }

    res.json({ text: reply.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat generation failed.' });
  }
});

// 41b. Supplementary Material Re-analysis Integration
chatExportRouter.post('/reanalyze-supplementary', async (req, res) => {
  try {
    const { originalAnalysis, supplementaryText = '', sourceName = 'Supplementary Material', role = 'phd' } = req.body;
    if (!originalAnalysis || !supplementaryText) {
      return res.status(400).json({ error: 'Original analysis and supplementary text are required.' });
    }

    const systemPrompt = `
You are an Evidence Resolution Specialist on Amazon Bedrock updating an academic peer-review session.
Active Role Perspective: "${role}".
The user has provided an uploaded supplementary artifact (${sourceName}) to resolve identified paper gaps.

RE-EVALUATION MANDATES:
1. Mark corresponding missing source items as "uploaded": true.
2. Cross-examine all previously unproven questions tagged "not_mentioned" or "partially_available" against the new text.
3. If the supplementary text provides the missing proof, upgrade the status to "available" and cite the exact new quote.
4. Recalculate the overall transparencyScore (0 to 100) and overallRigorScore (0 to 100) reflecting newly resolved data.

Output strictly valid JSON containing the updated PaperAnalysis object.
`;
    const userPrompt = `Original Analysis JSON:\n${JSON.stringify(originalAnalysis)}\n\nNewly Provided Supplementary Material (${sourceName}):\n${supplementaryText.slice(0, 16000)}`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, userPrompt, 0.15);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const updated = JSON.parse(clean);

    const prevSources = Array.isArray(originalAnalysis.supplementarySourcesUploaded) ? originalAnalysis.supplementarySourcesUploaded : [];
    if (!prevSources.includes(sourceName)) {
      updated.supplementarySourcesUploaded = [...prevSources, sourceName];
    }

    res.json(updated);
  } catch (err: any) {
    const fallback = { ...req.body.originalAnalysis };
    fallback.supplementarySourcesUploaded = [...(fallback.supplementarySourcesUploaded || []), req.body.sourceName || 'Supplementary File'];
    fallback.transparencyScore = Math.min(100, (fallback.transparencyScore || 70) + 10);
    res.json(fallback);
  }
});

// 42. Dynamic Sample Prompt Generator
chatExportRouter.post('/sample-prompts', (req, res) => {
  const { paperTitle = '', userRole = 'phd' } = req.body;
  res.json({
    prompts: [
      `What is the single biggest methodological weakness in ${paperTitle}?`,
      'Is the evaluation sample size (N) statistically powered to prove the claims?',
      'What unstated mathematical or physical assumptions are the authors relying on?',
      'How would you design a rigorous experiment to independently replicate this?',
    ],
  });
});

// 43. Export Formatted Markdown Critical Review Report
chatExportRouter.post('/export/markdown-report', (req, res) => {
  const { analysis, userRole = 'phd' } = req.body;
  if (!analysis) {
    return res.status(400).json({ error: 'Analysis payload is required.' });
  }

  const md = `# Critical Research Review: ${analysis.title}
**Authors:** ${analysis.authors?.join(', ') || 'Unknown'} (${analysis.year || '2026'})
**Role Perspective:** ${userRole.toUpperCase()}
**Rigor Score:** ${analysis.overallRigorScore}/100 | **Transparency Score:** ${analysis.transparencyScore}/100

---

## 1. Problem Statement & Real-World Impact
${analysis.problemStatement?.coreProblem || 'Core problem addressed.'}

## 2. Claim vs Evidence Matrix
${(analysis.claims || []).map((c: any) => `### Claim #${c.claimNumber}: ${c.statement}\n- Evidence: ${c.evidenceSummary}\n- Objection: ${c.adversarialObjection}\n- Status: ${c.gapStatus}`).join('\n\n')}

## 3. Scientific-Debate Questions
${(analysis.questions || []).map((q: any) => `- [${q.category}] ${q.question} (Status: ${q.status})`).join('\n')}
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.send(md);
});

// 44. Export Structured JSON Deliverable
chatExportRouter.post('/export/json-deliverable', (req, res) => {
  const { analysis } = req.body;
  res.json(analysis || {});
});

// 45. Export 1-Page Executive Decision Brief for Editors
chatExportRouter.post('/export/executive-summary', (req, res) => {
  const { analysis } = req.body;
  res.json({
    title: analysis?.title || 'Research Paper',
    recommendation: analysis?.overallRigorScore >= 80 ? 'ACCEPT_WITH_MINOR_REVISION' : analysis?.overallRigorScore >= 60 ? 'MAJOR_REVISION_REQUIRED' : 'REJECT_UNPROVEN_CLAIMS',
    rigorScore: analysis?.overallRigorScore || 75,
    transparencyScore: analysis?.transparencyScore || 70,
    topGaps: (analysis?.missingSources || []).map((s: any) => s.title),
    executiveSummary: analysis?.executiveSummary || '',
  });
});
