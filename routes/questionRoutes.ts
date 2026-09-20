import { Router } from 'express';
import { invokeBedrockModel } from '../services/awsOrchestrator';
import { AcademicPromptEngine } from '../services/academicPromptEngine';

export const questionRouter = Router();

// 21. Dynamic 50-Question Inventory Generator across 10 Dimensions
questionRouter.post('/generate-50', async (req, res) => {
  try {
    const { markdownContent = '', paperTitle = 'Research Paper', role = 'reviewer' } = req.body;
    const systemPrompt = `
You are a Principal Scientific Editor and Peer-Review Chair on Amazon Bedrock.
Active Review Perspective: "${role}"

Your mission is to generate a comprehensive, highly demanding inventory of scientific debate challenge questions across 10 core dimensions:
1. mechanism_causality (Underlying mathematical or physical proof mechanisms)
2. statistical_power (Sample size N, variance error bars, p-value distributions)
3. baseline_parity (Equal compute, baseline tuning, and modern optimizer fairness)
4. boundary_conditions (Operational failure thresholds, sequence length limits)
5. ood_generalization (Out-of-distribution noise, transfer learning robustness)
6. anti_hype (Decontaminating promotional rhetoric, isolating absolute gains)
7. ablation_necessity (Ablating individual sub-modules to prove necessity)
8. finops_efficiency (Training compute, inference latency, memory bandwidth)
9. competing_sota (Contrasting against contemporary and subsequent paradigms)
10. open_science (Raw dataset access, pinned code commits, random seed disclosure)

CRITICAL EXPLANATION LENGTH REQUIREMENT:
Each generated question must be deeply substantive.

Output strictly valid JSON:
{
  "totalGenerated": number,
  "questions": [
    {
      "id": "q-1",
      "question": "string",
      "category": "string",
      "importance": "critical" | "high" | "moderate"
    }
  ]
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, `Paper: "${paperTitle}"\n\nContent:\n${markdownContent.slice(0, 15000)}`, 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate 50-question inventory.' });
  }
});

// 22. Cross-Check Single Question Against Text (Strict 3-State Verification with 5+ Line Explanations)
questionRouter.post('/verify-single', async (req, res) => {
  try {
    const { question = '', markdownContent = '' } = req.body;
    const systemPrompt = `
You are an Evidence Verification Auditor on Amazon Bedrock.
Cross-examine the following specific peer-review challenge question against the provided paper text:

CRITICAL EXPLANATION LENGTH & ANALYTICAL DEPTH RULES:
1. Every answerInPaper and missingElement explanation MUST be at least 5 lines of rigorous analytical technical writing (100–150+ words).
2. Detail explicit mathematical formulations, dataset configurations, sample sizes ($N$), and statistical variance tests.
3. Assign strict 3-state status:
   - "available": The objection is explicitly and thoroughly answered with empirical data and metrics.
   - "partially_available": The paper provides partial evidence, but lacks full baseline controls or variance bounds.
   - "not_mentioned": The paper does NOT contain the data, omits code/hyperparameters, or leaves the assertion unbacked.
4. If answered, provide the exact verbatim quote and section.
5. NEVER invent or extrapolate evidence. If absent, mark "not_mentioned".

Output strictly valid JSON:
{
  "question": "string",
  "status": "available" | "partially_available" | "not_mentioned",
  "answerInPaper": "string (minimum 5 lines of analytical depth)",
  "missingElement": "string | null (minimum 5 lines when present)"
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, `Question: "${question}"\n\nPaper Text:\n${markdownContent.slice(0, 15000)}`, 0.1);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify question.' });
  }
});

// 23. Live Deep Socratic Interrogation of a Single Question
questionRouter.post('/interrogate', async (req, res) => {
  try {
    const { question = '', paperTitle = 'Research Paper', context = '', role = 'phd' } = req.body;
    const systemPrompt = `
You are a Socratic Co-Investigator & Methodology Chair on Amazon Bedrock.
Active User Role Lens: "${role}".

Deeply interrogate the following peer-review challenge question regarding "${paperTitle}":
"${question}"

EXPLANATION DEPTH DIRECTIVES:
- Provide a rigorous, multi-paragraph analytical deep dive (at least 5-8 lines, 150+ words).
- Dissect theoretical assumptions, empirical proofs, error-bar variance, potential confounding variables, and baseline fairness.
- Formulate concrete recommendations for independent laboratory replication.

Output clean text formatted in academic markdown with KaTeX math.`;

    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, `Context:\n${context.slice(0, 12000)}`, 0.2);
    res.json({ success: true, analysis: raw.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Interrogation failed.' });
  }
});

// 24. Filter Question Set by Category
questionRouter.post('/filter-category', (req, res) => {
  const { questions = [], category = 'all' } = req.body;
  if (category === 'all') {
    return res.json({ count: questions.length, filtered: questions });
  }
  const filtered = questions.filter((q: any) => q.category === category);
  res.json({ count: filtered.length, category, filtered });
});

// 25. Audit Statistical Power & Multi-Seed Error Bars
questionRouter.post('/audit-statistical-power', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const systemPrompt = `
Audit the statistical rigor of this paper:
1. Was sample size N calculated with an a priori power calculation?
2. Are multi-seed error bars / standard deviations reported?
3. What p-value thresholds or multiple-testing corrections were used?
Output JSON: { "hasSampleSizePowerCalculation": boolean, "hasMultiSeedVariance": boolean, "reportedPValues": string[], "statisticalRigorScore": number, "summary": string }
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, markdownContent.slice(0, 12000), 0.1);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Statistical power audit failed.' });
  }
});

// 26. Audit Overclaiming & Metric Gaming
questionRouter.post('/audit-overclaiming', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const systemPrompt = `
Audit this paper for overclaiming or metric gaming:
1. Do conclusions claim general intelligence or universal efficacy from narrow benchmarks?
2. Are relative percentage gains used to mask tiny absolute improvements?
3. Were baseline models tuned fairly?
Output JSON: { "overclaimingRisk": "high"|"moderate"|"low", "redFlagsDetected": string[], "recommendations": string[] }
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, markdownContent.slice(0, 12000), 0.1);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Overclaiming audit failed.' });
  }
});
