import { BaseAgent, AgentExecutionContext } from './baseAgent';
import { ProblemStatement } from '../src/types';
import { AcademicPromptEngine } from '../services/academicPromptEngine';
import { extractAndParseJson } from '../services/schema';

export interface ExtractedClaimRaw {
  id: string;
  claimNumber: number;
  statement: string;
  section: string;
  evidenceSummary: string;
  evidenceType: string;
}

export interface Agent1Output {
  title: string;
  authors: string[];
  year: string;
  journalOrConference: string;
  executiveSummary: string;
  problemStatement: ProblemStatement;
  claims: ExtractedClaimRaw[];
  methodologyOverview: string;
  datasetsUsed: string[];
}

export class StructuralExtractorAgent extends BaseAgent<Agent1Output> {
  readonly agentIndex = 1;
  readonly agentName = 'Agent 1: Structural Extractor';
  readonly agentRole = 'Document decomposition, claim extraction, methodology mapping & baseline isolation';
  readonly primaryModelId = 'us.amazon.nova-micro-v1:0';
  readonly fallbackModelId = 'amazon.nova-micro-v1:0';

  buildSystemPrompt(context: AgentExecutionContext): string {
    return AcademicPromptEngine.getAgent1SystemPrompt(context.userRole);
  }

  buildUserMessage(context: AgentExecutionContext): string {
    return AcademicPromptEngine.getAgent1UserPrompt(context.paperTitle, context.markdownContent, context.userRole);
  }

  parseOutput(rawText: string, context: AgentExecutionContext): Agent1Output {
    const fallback: Agent1Output = {
      title: context.paperTitle || 'Research Paper',
      authors: ['Authors'],
      year: `${new Date().getFullYear()}`,
      journalOrConference: 'Published',
      executiveSummary: 'Decomposed structural assertions from paper.',
      problemStatement: {
        coreProblem: 'Overcoming fundamental baseline constraints in empirical modeling.',
        realWorldImpact: 'High potential for scientific and industrial acceleration.',
        priorLimitations: 'Previous architectures lacked parallelization or scalable sample bounds.',
        claimedBreakthrough: 'Demonstrated superior benchmark metrics over existing state-of-the-art.',
      },
      methodologyOverview: 'Empirical evaluation.',
      datasetsUsed: [],
      claims: [
        {
          id: 'claim-1',
          claimNumber: 1,
          statement: 'The proposed architecture demonstrates superior empirical performance over traditional baselines.',
          section: 'Section 3 / Results',
          evidenceSummary: 'Benchmark evaluation on primary test sets.',
          evidenceType: 'Empirical Benchmark',
        },
      ],
    };

    const parsed = extractAndParseJson(rawText, fallback);
    return {
      title: parsed.title || context.paperTitle || fallback.title,
      authors: Array.isArray(parsed.authors) && parsed.authors.length > 0 ? parsed.authors : fallback.authors,
      year: parsed.year || fallback.year,
      journalOrConference: parsed.journalOrConference || fallback.journalOrConference,
      executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
      problemStatement: {
        coreProblem: parsed.problemStatement?.coreProblem || fallback.problemStatement.coreProblem,
        realWorldImpact: parsed.problemStatement?.realWorldImpact || fallback.problemStatement.realWorldImpact,
        priorLimitations: parsed.problemStatement?.priorLimitations || fallback.problemStatement.priorLimitations,
        claimedBreakthrough: parsed.problemStatement?.claimedBreakthrough || fallback.problemStatement.claimedBreakthrough,
      },
      methodologyOverview: parsed.methodologyOverview || fallback.methodologyOverview,
      datasetsUsed: Array.isArray(parsed.datasetsUsed) ? parsed.datasetsUsed : fallback.datasetsUsed,
      claims: Array.isArray(parsed.claims) && parsed.claims.length > 0 ? parsed.claims : fallback.claims,
    };
  }
}
