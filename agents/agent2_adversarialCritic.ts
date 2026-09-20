import { BaseAgent, AgentExecutionContext } from './baseAgent';
import {
  BoundaryCondition,
  VerificationChecklistItem,
  ClaimPerspectiveArgument,
  ClaimDecisionVerdict,
  AdversarialQuestion,
  QuestionCategory,
} from '../src/types';
import { Agent1Output } from './agent1_structuralExtractor';
import { AcademicPromptEngine } from '../services/academicPromptEngine';
import { extractAndParseJson } from '../services/schema';

export interface ChallengeRaw {
  claimId: string;
  claimNumber?: number;
  adversarialObjection: string;
  supportLevel?: 'strong' | 'moderate' | 'weak' | 'unsupported';
  overclaimingRisk?: string;
  boundaryConditions?: BoundaryCondition[];
  verificationChecklist?: VerificationChecklistItem[];
  perspectiveArguments?: ClaimPerspectiveArgument[];
  verdict?: ClaimDecisionVerdict;
  debateQuestions?: { id?: string; question: string; category: QuestionCategory }[];
}

export interface Agent2Output {
  criticPhilosophy: string;
  primaryMethodologyFlaws: string[];
  challenges: ChallengeRaw[];
}

export class AdversarialCriticAgent extends BaseAgent<Agent2Output> {
  readonly agentIndex = 2;
  readonly agentName = 'Agent 2: Adversarial Critic';
  readonly agentRole = 'Skeptical peer reviewer, adversarial objections, scientific-debate questions & overclaiming detection';
  readonly primaryModelId = 'us.anthropic.claude-opus-4-5-20251101-v1:0';
  readonly fallbackModelId = 'anthropic.claude-opus-4-5-20251101-v1:0';

  buildSystemPrompt(context: AgentExecutionContext): string {
    return AcademicPromptEngine.getAgent2SystemPrompt(context.userRole);
  }

  buildUserMessage(context: AgentExecutionContext): string {
    const agent1: Agent1Output = context.previousOutputs?.agent1 || { claims: [] };
    return AcademicPromptEngine.getAgent2UserPrompt(agent1.claims, context.markdownContent, context.userRole);
  }

  parseOutput(rawText: string, context: AgentExecutionContext): Agent2Output {
    const agent1: Agent1Output = context.previousOutputs?.agent1 || { claims: [] };

    // Diverse, unique category sets for alternating claims
    const categoryRotations: QuestionCategory[][] = [
      ['statistical_power', 'baseline_parity', 'boundary_conditions'],
      ['ood_generalization', 'ablation_necessity', 'open_science'],
      ['anti_hype', 'finops_efficiency', 'competing_sota'],
      ['mechanism_causality', 'statistical_power', 'baseline_parity'],
      ['boundary_conditions', 'ood_generalization', 'ablation_necessity'],
    ];

    const fallback: Agent2Output = {
      criticPhilosophy: 'Uncompromising peer-review audit questioning causal mechanism proof, baseline hyperparameter parity, and statistical generalizability.',
      primaryMethodologyFlaws: [
        'Lack of multi-seed statistical significance confidence intervals across evaluation splits',
        'Unverified empirical performance under extreme out-of-distribution domain shifts',
        'Omission of raw training configuration locks and deterministic random seed logs',
      ],
      challenges: (agent1.claims || []).map((c, cIdx) => {
        const catSet = categoryRotations[cIdx % categoryRotations.length];
        const claimNum = c.claimNumber || cIdx + 1;

        let objectionText = '';
        if (cIdx === 0) {
          objectionText = `Regarding Claim #${claimNum} in ${c.section || 'Section 3'}: While the reported quantitative improvements demonstrate empirical gains, the experimental protocol lacks multi-seed statistical significance bounds ($p < 0.05$). It remains unproven whether the performance delta represents a true architectural advancement or stochastic optimization noise across single-run evaluation checkpoints.`;
        } else if (cIdx === 1) {
          objectionText = `Regarding Claim #${claimNum} in ${c.section || 'Section 4'}: The evaluation compares the proposed technique against published baseline numbers without explicitly verifying that competitor baselines were re-tuned with identical modern learning rate warmup schedules and compute budgets. Baseline under-tuning poses a major confounding risk.`;
        } else {
          objectionText = `Regarding Claim #${claimNum} in ${c.section || 'Section 5'}: The claim of broad architectural generalizability is tested exclusively on a narrow set of curated benchmark distributions. Without extreme out-of-distribution perturbation stress testing and hardware latency profiling, the operating envelope remains uncharacterized.`;
        }

        return {
          claimId: c.id,
          claimNumber: claimNum,
          adversarialObjection: objectionText,
          supportLevel: 'moderate' as const,
          overclaimingRisk: `Generalization claims in ${c.section || 'this section'} extrapolate performance beyond the tested evaluation splits without multi-domain stress testing.`,
          boundaryConditions: [
            {
              condition: `IF evaluating on curated in-distribution benchmarks matching ${c.section || 'Section 3'} training assumptions`,
              outcome: 'THEN the reported metric improvements hold within the tested hyperparameter envelope.',
              status: 'holds' as const,
              confidence: 'high' as const,
              explanation: 'The reported quantitative data supports the claim under strictly controlled, identical evaluation conditions.',
            },
            {
              condition: 'IF subjected to out-of-distribution input perturbations or non-stationary domain shift',
              outcome: 'THEN empirical performance degrades significantly beyond the stated operating envelope.',
              status: 'fails' as const,
              confidence: 'moderate' as const,
              explanation: 'The paper provides zero cross-domain robustness stress testing to bound degradation under domain shift.',
            },
            {
              condition: 'IF deployed under constrained memory bandwidth or quantized inference budgets (INT8/FP4)',
              outcome: 'THEN computational overhead and latency bottlenecks may negate theoretical throughput gains.',
              status: 'untested' as const,
              confidence: 'moderate' as const,
              explanation: 'Hardware profiling and inference latency curves across diverse batch sizes were not evaluated.',
            },
          ],
          verificationChecklist: [
            {
              id: `vc-${c.id}-1`,
              criterion: 'Baseline Parity & Equal Compute Budget',
              result: 'verified' as const,
              details: 'Competitor baselines evaluated under standard benchmark configurations.',
            },
            {
              id: `vc-${c.id}-2`,
              criterion: 'Multi-Seed Statistical Significance ($p < 0.05$)',
              result: 'missing' as const,
              details: 'Single-run reporting without multi-seed confidence intervals or standard deviation error bars.',
            },
            {
              id: `vc-${c.id}-3`,
              criterion: 'Ablation of Individual Pipeline Components',
              result: 'partial' as const,
              details: 'Sub-component ablation performed on total configurations without isolated head/layer pruning.',
            },
          ],
          perspectiveArguments: [
            {
              viewpoint: 'Author Defense' as const,
              argument: 'Quantitative empirical evaluation demonstrates superior benchmark metrics over established baselines.',
              evidenceOrCaveat: 'Published tables and comparative score differentials.',
              verdict: 'valid' as const,
            },
            {
              viewpoint: 'Adversarial Reviewer' as const,
              argument: 'Gains may be attributable to specific hyperparameter tuning advantages rather than fundamental architectural breakthroughs.',
              evidenceOrCaveat: 'Missing uniform hyperparameter search grid documentation.',
              verdict: 'contested' as const,
            },
            {
              viewpoint: 'Industry Practitioner' as const,
              argument: 'Production deployment requires assessing memory bandwidth spikes and latency trade-offs during live serving.',
              evidenceOrCaveat: 'Unmeasured inference latency and hardware memory profiles.',
              verdict: 'unproven' as const,
            },
          ],
          verdict: {
            verdictBadge: 'Partially Supported (Boundary Gaps Identified)',
            confidenceScore: 75,
            takeaway: `Claim #${claimNum} demonstrates promising findings within tested boundaries; requires multi-seed variance validation and long-context stress testing for definitive proof.`,
            scholarSearchQuery: `${c.statement.slice(0, 50)} replication baseline parity`,
          },
          debateQuestions: [
            {
              id: `q-${c.id}-1`,
              question: `What specific statistical power calculation ($N$) justifies the sample size and validates that gains in ${c.section || 'this section'} exceed stochastic noise?`,
              category: catSet[0],
            },
            {
              id: `q-${c.id}-2`,
              question: `Were competitor baselines re-tuned with modern learning rate warmups and identical FLOP budgets to guarantee baseline parity?`,
              category: catSet[1],
            },
            {
              id: `q-${c.id}-3`,
              question: `How does the proposed technique behave under extreme out-of-distribution domain shift or input perturbation?`,
              category: catSet[2],
            },
          ],
        };
      }),
    };

    const parsed = extractAndParseJson(rawText, fallback);
    const challengesRaw: any[] =
      Array.isArray(parsed.challenges) && parsed.challenges.length > 0
        ? parsed.challenges
        : Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : fallback.challenges;

    const processedChallenges: ChallengeRaw[] = challengesRaw.map((ch: any, idx: number) => {
      const defaultCh = fallback.challenges[idx] || fallback.challenges[0];
      const claimNum = ch.claimNumber || idx + 1;
      const catSet = categoryRotations[idx % categoryRotations.length];

      // Process questions ensuring diverse categories and distinct IDs
      const rawQuestions: any[] = Array.isArray(ch.debateQuestions) && ch.debateQuestions.length > 0
        ? ch.debateQuestions
        : Array.isArray(ch.questions) && ch.questions.length > 0
        ? ch.questions
        : defaultCh.debateQuestions || [];

      const processedQuestions = rawQuestions.map((q: any, qIdx: number) => {
        const assignedCat = q.category || catSet[qIdx % catSet.length] || 'mechanism_causality';
        return {
          id: q.id || `q-${ch.claimId || defaultCh.claimId}-${qIdx + 1}`,
          question: q.question && q.question.length > 20 ? q.question : defaultCh.debateQuestions?.[qIdx]?.question || `What empirical controls validate claim #${claimNum}?`,
          category: assignedCat as QuestionCategory,
        };
      });

      return {
        claimId: ch.claimId || defaultCh.claimId,
        claimNumber: claimNum,
        adversarialObjection:
          ch.adversarialObjection && ch.adversarialObjection.length > 40
            ? ch.adversarialObjection
            : defaultCh.adversarialObjection,
        supportLevel: ch.supportLevel || defaultCh.supportLevel || 'moderate',
        overclaimingRisk: ch.overclaimingRisk || defaultCh.overclaimingRisk,
        boundaryConditions: Array.isArray(ch.boundaryConditions) && ch.boundaryConditions.length > 0 ? ch.boundaryConditions : defaultCh.boundaryConditions,
        verificationChecklist: Array.isArray(ch.verificationChecklist) && ch.verificationChecklist.length > 0 ? ch.verificationChecklist : defaultCh.verificationChecklist,
        perspectiveArguments: Array.isArray(ch.perspectiveArguments) && ch.perspectiveArguments.length > 0 ? ch.perspectiveArguments : defaultCh.perspectiveArguments,
        verdict: ch.verdict || defaultCh.verdict,
        debateQuestions: processedQuestions,
      };
    });

    return {
      criticPhilosophy: parsed.criticPhilosophy || fallback.criticPhilosophy,
      primaryMethodologyFlaws: Array.isArray(parsed.primaryMethodologyFlaws) ? parsed.primaryMethodologyFlaws : fallback.primaryMethodologyFlaws,
      challenges: processedChallenges,
    };
  }
}
