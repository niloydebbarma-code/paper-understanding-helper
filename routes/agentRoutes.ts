import { Router } from 'express';
import { StructuralExtractorAgent } from '../agents/agent1_structuralExtractor';
import { AdversarialCriticAgent } from '../agents/agent2_adversarialCritic';
import { EvidenceVerifierAgent } from '../agents/agent3_evidenceVerifier';
import { GapInvestigatorAgent } from '../agents/agent4_gapInvestigator';
import { AdaptiveCommunicatorAgent } from '../agents/agent5_adaptiveCommunicator';

export const agentRouter = Router();

// 6. Agent 1: Structural Claim & Methodology Extractor (Nova Micro)
agentRouter.post('/extract-structure', async (req, res) => {
  try {
    const { markdownContent, paperTitle = 'Research Paper', userRole = 'phd' } = req.body;
    if (!markdownContent) {
      return res.status(400).json({ error: 'Markdown content is required for Agent 1 extraction.' });
    }

    const agent1 = new StructuralExtractorAgent();
    const result = await agent1.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs: {},
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/agents/extract-structure:', err);
    res.status(500).json({ error: err.message || 'Agent 1 execution failed.' });
  }
});

// 7. Agent 2: Adversarial Critic (Claude Opus 4.5 / Nova Pro)
agentRouter.post('/adversarial-critic', async (req, res) => {
  try {
    const { markdownContent, paperTitle = 'Research Paper', extractedClaims = [], userRole = 'phd' } = req.body;
    if (!markdownContent) {
      return res.status(400).json({ error: 'Markdown content is required for Agent 2 critique.' });
    }

    const agent2 = new AdversarialCriticAgent();
    const result = await agent2.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs: {
        agent1: { claims: extractedClaims },
      },
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/agents/adversarial-critic:', err);
    res.status(500).json({ error: err.message || 'Agent 2 execution failed.' });
  }
});

// 8. Agent 3: Evidence Verifier & Conditional Vision (Amazon Nova Pro)
agentRouter.post('/verify-evidence', async (req, res) => {
  try {
    const { markdownContent, paperTitle = 'Research Paper', extractedClaims = [], challenges = [], userRole = 'phd' } = req.body;
    if (!markdownContent) {
      return res.status(400).json({ error: 'Markdown content is required for Agent 3 verification.' });
    }

    const agent3 = new EvidenceVerifierAgent();
    const result = await agent3.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs: {
        agent1: { claims: extractedClaims },
        agent2: { challenges },
      },
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/agents/verify-evidence:', err);
    res.status(500).json({ error: err.message || 'Agent 3 execution failed.' });
  }
});

// 9. Agent 4: Gap & Paywall Investigator (Meta Llama 3.3 70B)
agentRouter.post('/audit-gaps', async (req, res) => {
  try {
    const { markdownContent, paperTitle = 'Research Paper', userRole = 'phd' } = req.body;
    if (!markdownContent) {
      return res.status(400).json({ error: 'Markdown content is required for Agent 4 gap audit.' });
    }

    const agent4 = new GapInvestigatorAgent();
    const result = await agent4.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs: {},
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/agents/audit-gaps:', err);
    res.status(500).json({ error: err.message || 'Agent 4 execution failed.' });
  }
});

// 10. Agent 5: Adaptive Communicator & Persona Synthesis (Amazon Nova Micro)
agentRouter.post('/synthesize-deliverables', async (req, res) => {
  try {
    const { markdownContent = '', paperTitle = 'Research Paper', previousOutputs = {}, userRole = 'phd' } = req.body;

    const agent5 = new AdaptiveCommunicatorAgent();
    const result = await agent5.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/agents/synthesize-deliverables:', err);
    res.status(500).json({ error: err.message || 'Agent 5 execution failed.' });
  }
});
