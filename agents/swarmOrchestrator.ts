import { PaperAnalysis, UserRole, DocumentStructuralMetadata } from '../src/types';
import { savePaperToS3, saveSessionToDynamoDB } from '../services/awsOrchestrator';
import { StructuralExtractorAgent } from './agent1_structuralExtractor';
import { AdversarialCriticAgent } from './agent2_adversarialCritic';
import { EvidenceVerifierAgent } from './agent3_evidenceVerifier';
import { GapInvestigatorAgent } from './agent4_gapInvestigator';
import { AdaptiveCommunicatorAgent } from './agent5_adaptiveCommunicator';

export interface SwarmExecutionResponse {
  analysis: PaperAnalysis;
  totalPipelineDurationMs: number;
}

/**
 * Enterprise Multi-Agent Swarm Supervisor
 * Coordinates sequential execution, inter-agent data flow, and document metadata synthesis
 */
export class SwarmOrchestrator {
  private agent1 = new StructuralExtractorAgent();
  private agent2 = new AdversarialCriticAgent();
  private agent3 = new EvidenceVerifierAgent();
  private agent4 = new GapInvestigatorAgent();
  private agent5 = new AdaptiveCommunicatorAgent();

  async runSwarm(
    markdownContent: string,
    paperTitle: string,
    userRole: UserRole = 'phd',
    documentMetadata?: DocumentStructuralMetadata
  ): Promise<SwarmExecutionResponse> {
    const overallStart = Date.now();
    const previousOutputs: Record<string, any> = {};

    console.log(`\n🤖 [Swarm Orchestrator] Starting 5-Agent Academic Review Swarm for "${paperTitle}" (Role: ${userRole})...`);

    // Step 1: Agent 1 (Structural Extractor - Amazon Nova Micro)
    console.log(`  ▶ Running Agent 1 (Structural Extractor) on Amazon Nova Micro...`);
    const res1 = await this.agent1.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });
    previousOutputs.agent1 = res1.structuredOutput;

    // Step 2: Agent 2 (Adversarial Critic - Claude Opus 4.5 / Nova Pro)
    console.log(`  ▶ Running Agent 2 (Adversarial Critic) on ${res1.structuredOutput.claims?.length || 0} extracted claims...`);
    const res2 = await this.agent2.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });
    previousOutputs.agent2 = res2.structuredOutput;

    // Step 3: Agent 3 (Evidence Verifier - Amazon Nova Pro / Lite)
    console.log(`  ▶ Running Agent 3 (Evidence Verifier) with strict 3-state gap checks...`);
    const res3 = await this.agent3.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });
    previousOutputs.agent3 = res3.structuredOutput;

    // Step 4: Agent 4 (Gap & Paywall Investigator - Meta Llama 3.3 70B)
    console.log(`  ▶ Running Agent 4 (Gap & Paywall Investigator) on references and datasets...`);
    const res4 = await this.agent4.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });
    previousOutputs.agent4 = res4.structuredOutput;

    // Step 5: Agent 5 (Adaptive Communicator - Amazon Nova Micro)
    console.log(`  ▶ Running Agent 5 (Adaptive Communicator) synthesizing deliverables for "${userRole}"...`);
    const res5 = await this.agent5.execute({
      paperTitle,
      markdownContent,
      userRole,
      previousOutputs,
    });

    const totalPipelineDurationMs = Date.now() - overallStart;

    const finalAnalysis: PaperAnalysis = {
      ...res5.structuredOutput.finalCompiledAnalysis,
      documentMetadata: documentMetadata || {
        totalPages: Math.max(1, Math.ceil(markdownContent.split(/\s+/).length / 450)),
        totalFigures: (markdownContent.match(/Figure|Fig\./gi) || []).length || 2,
        totalTables: (markdownContent.match(/Table|Tab\./gi) || []).length || 1,
        totalReferences: (markdownContent.match(/\[\d+\]/g) || []).length || 10,
        totalSections: (markdownContent.match(/^##\s+/gm) || []).length || 5,
      },
      markdownContent,
    };

    console.log(`✔ [Swarm Orchestrator] Swarm execution complete in ${(totalPipelineDurationMs / 1000).toFixed(2)}s.`);

    // Asynchronously checkpoint to Amazon DynamoDB and S3
    saveSessionToDynamoDB(finalAnalysis.paperId, finalAnalysis, userRole);
    savePaperToS3(finalAnalysis.paperId, markdownContent, 'text/markdown');

    return {
      analysis: finalAnalysis,
      totalPipelineDurationMs,
    };
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
