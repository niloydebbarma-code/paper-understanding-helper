import { Router } from 'express';
import { invokeBedrockModel } from '../services/awsOrchestrator';
import { AcademicPromptEngine } from '../services/academicPromptEngine';

export const claimRouter = Router();

// 16. Deep Single-Claim Interrogation (How, Why, When, Anti-Hype)
claimRouter.post('/audit-single', async (req, res) => {
  try {
    const { claimStatement = '', section = '', context = '', role = 'phd' } = req.body;
    if (!claimStatement) {
      return res.status(400).json({ error: 'Claim statement is required.' });
    }

    const systemPrompt = AcademicPromptEngine.getSingleClaimDeepAuditPrompt(claimStatement, section, context.slice(0, 8000), role);

    const raw = await invokeBedrockModel(
      'us.amazon.nova-pro-v1:0',
      systemPrompt,
      `Claim: "${claimStatement}" (Section: ${section})\n\nContext:\n${context.slice(0, 8000)}`,
      0.15
    );

    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Single claim audit failed.' });
  }
});

// 17. Evaluate IF-THEN Boundary Conditions for a Claim
claimRouter.post('/boundary-conditions', async (req, res) => {
  try {
    const { claimStatement = '', context = '' } = req.body;
    const systemPrompt = AcademicPromptEngine.getBoundaryConditionPrompt(claimStatement, context.slice(0, 6000));
    const raw = await invokeBedrockModel('us.amazon.nova-micro-v1:0', systemPrompt, `Claim: "${claimStatement}"\nContext: ${context.slice(0, 6000)}`, 0.1);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Boundary condition calculation failed.' });
  }
});

// 18. Generate 5-Point Verification Checklist
claimRouter.post('/verification-checklist', async (req, res) => {
  try {
    const { claimStatement = '', evidenceCited = '' } = req.body;
    const systemPrompt = `
Generate a 4-point verification checklist auditing:
1. Baseline Parity
2. Statistical Power / Variance
3. Ablation Isolation
4. Out-of-Distribution Generalization
Output JSON: { "checklist": [ { "id": string, "criterion": string, "result": "verified"|"partial"|"unsupported"|"missing", "details": string } ] }
`;
    const raw = await invokeBedrockModel('us.amazon.nova-micro-v1:0', systemPrompt, `Claim: "${claimStatement}"\nEvidence: ${evidenceCited}`, 0.1);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Verification checklist generation failed.' });
  }
});

// 19. Generate Stakeholder Perspective Debate Arguments
claimRouter.post('/perspective-debate', async (req, res) => {
  try {
    const { claimStatement = '', evidence = '' } = req.body;
    const systemPrompt = `
Formulate 3 contrasting stakeholder perspectives for this claim:
1. Author Defense
2. Adversarial Reviewer
3. Industry Practitioner / Clinical Implementer
Output JSON: { "perspectives": [ { "viewpoint": string, "argument": string, "evidenceOrCaveat": string, "verdict": "valid"|"contested"|"unproven" } ] }
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, `Claim: "${claimStatement}"\nEvidence: ${evidence}`, 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Perspective debate generation failed.' });
  }
});

// 20. Audited Verdict & Takeaway Generator
claimRouter.post('/verdict', (req, res) => {
  const { gapStatus = 'available', supportLevel = 'strong', claimStatement = '' } = req.body;
  const isAvailable = gapStatus === 'available';
  const isPartial = gapStatus === 'partially_available';

  res.json({
    verdictBadge: isAvailable ? 'Empirically Supported within Stated Bounds' : isPartial ? 'Partially Proven (Boundary Gaps Identified)' : 'Unproven / Missing Empirical Proof',
    confidenceScore: isAvailable ? 92 : isPartial ? 76 : 42,
    takeaway: `This claim shows ${supportLevel} supporting results in-distribution, but independent replication should verify long-tail boundary limits.`,
    scholarSearchQuery: `${claimStatement.slice(0, 50)} independent replication baseline`,
  });
});
