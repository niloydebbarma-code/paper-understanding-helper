import { Router } from 'express';
import { USER_ROLES, getRoleDetail } from '../src/data/userRoles';
import { invokeBedrockModel } from '../services/awsOrchestrator';
import { AcademicPromptEngine } from '../services/academicPromptEngine';

export const roleRouter = Router();

// 36. Role-Adapted Summary Generator
roleRouter.post('/adapt-summary', async (req, res) => {
  try {
    const { paperText = '', role = 'phd' } = req.body;
    const roleInfo = getRoleDetail(role);

    const systemPrompt = `
You are an expert Adaptive Scientific Communicator on Amazon Bedrock.
Your mandate is to synthesize and adapt the provided research paper specifically for the following academic lens:
Target Role: "${roleInfo.title}" (${roleInfo.readingLevel})
Perspective Objective: ${roleInfo.perspective}

ADAPTATION GUIDELINES:
1. Adjust vocabulary complexity, technical depth, and conceptual scaffolding strictly to match ${roleInfo.readingLevel}.
2. If adapting for Undergraduate or Communicator, break down complex Greek notations into intuitive physical analogies while preserving scientific accuracy.
3. If adapting for PhD or Peer Reviewer, emphasize theoretical lemma gaps, statistical boundary conditions, and methodology validity.
4. If adapting for Industry Practitioner, highlight production latency, memory bandwidth, FLOPs efficiency, and hardware deployment constraints.

Output strictly valid JSON:
{
  "role": "${role}",
  "readingLevel": "${roleInfo.readingLevel}",
  "adaptedSummary": "string",
  "keyTakeaways": ["string"],
  "criticalCaveats": ["string"]
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-micro-v1:0', systemPrompt, paperText.slice(0, 10000), 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to adapt summary.' });
  }
});

// 37. Plain-Language Jargon & Equation Deconstructor
roleRouter.post('/explain-jargon', async (req, res) => {
  try {
    const { technicalExcerpt = '', targetLevel = 'B2' } = req.body;
    const systemPrompt = `
You are an Award-Winning Academic Pedagogy Specialist and Physics/CS Professor.
Deconstruct the following dense academic excerpt or mathematical equation into an intuitive, plain-language concept for a ${targetLevel} reading level.

DECONSTRUCTION PRINCIPLES:
1. Explain the underlying physical or intuitive problem: What bottleneck existed, and why was this formulation invented?
2. Define all Greek symbols, matrices, indices, and operators in terms of concrete data flow.
3. Render all formulas in clean KaTeX LaTeX ($...$ and $$...$$).
4. Provide a simple numerical walk-through or real-world physical analogy.

Output strictly valid JSON:
{
  "plainLanguageAnalogy": "string",
  "coreConcept": "string",
  "stepByStepExplanation": "string",
  "keyCaveat": "string"
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-micro-v1:0', systemPrompt, technicalExcerpt, 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to explain jargon.' });
  }
});

// 38. Pedagogical Classroom Socratic Debate Points for Educators
roleRouter.post('/pedagogical-questions', async (req, res) => {
  try {
    const { paperTitle = '', executiveSummary = '' } = req.body;
    const systemPrompt = `
You are a Distinguished University Professor and Curriculum Chair designing a graduate seminar.
Formulate a comprehensive pedagogical discussion module based on the research paper: "${paperTitle}".

PEDAGOGICAL DIRECTIVES:
1. Formulate 3 to 4 challenging Socratic seminar discussion prompts that force students to evaluate assumptions rather than recall facts.
2. Design 1 hands-on classroom coding or calculation exercise testing the core algorithm or theorem.
3. Identify 2 classical counter-examples or historical baseline papers students should compare against.

Output strictly valid JSON:
{
  "discussionPrompts": ["string"],
  "classroomExercise": "string",
  "historicalContext": "string",
  "evaluationRubric": ["string"]
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-micro-v1:0', systemPrompt, `Paper: ${paperTitle}\n${executiveSummary}`, 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate pedagogical prompts.' });
  }
});

// 39. Industry Practitioner Trade-off & Latency Audit
roleRouter.post('/practitioner-roi', async (req, res) => {
  try {
    const { methodology = '', claims = [] } = req.body;
    const systemPrompt = `
You are a Principal AI Systems Architect and Production Infrastructure Engineer.
Perform a rigorous real-world deployment and Return on Investment (ROI) audit of this proposed methodology.

PRODUCTION AUDIT DIRECTIVES:
1. Evaluate computational latency, peak SRAM memory spikes, and KV-cache scaling overhead during online serving.
2. Check for quantization fragility under 8-bit integer (INT8) or 4-bit (FP4) deployment.
3. Compare operational infrastructure costs (GPU compute hours vs CPU serving) against claimed accuracy improvements.
4. Highlight real-world production risks (cold-start latency, custom CUDA kernel dependencies, non-standard memory layouts).

Output strictly valid JSON:
{
  "deployabilityScore": 75,
  "infrastructureTradeoffs": ["string"],
  "realWorldServingRisks": ["string"],
  "recommendedServingStack": "string"
}
`;
    const raw = await invokeBedrockModel('us.amazon.nova-pro-v1:0', systemPrompt, `Method: ${methodology}\nClaims: ${JSON.stringify(claims)}`, 0.2);
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to calculate practitioner ROI.' });
  }
});

// 40. List All 8 Supported Academic User Roles
roleRouter.get('/list', (req, res) => {
  res.json({
    totalRoles: USER_ROLES.length,
    roles: USER_ROLES,
  });
});
