import { UserRole } from '../src/types';
import { invokeBedrockModel } from '../services/awsOrchestrator';

export interface AgentExecutionContext {
  paperTitle: string;
  markdownContent: string;
  userRole: UserRole;
  previousOutputs: Record<string, any>;
}

export interface AgentExecutionResult<T = any> {
  agentName: string;
  modelId: string;
  structuredOutput: T;
  rawText: string;
  durationMs: number;
}

export abstract class BaseAgent<TOutput = any> {
  abstract readonly agentIndex: number;
  abstract readonly agentName: string;
  abstract readonly agentRole: string;
  abstract readonly primaryModelId: string;
  abstract readonly fallbackModelId?: string;

  abstract buildSystemPrompt(context: AgentExecutionContext): string;
  abstract buildUserMessage(context: AgentExecutionContext): string;
  abstract parseOutput(rawText: string, context: AgentExecutionContext): TOutput;

  async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<TOutput>> {
    const startTime = Date.now();
    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(context);

    let activeModel = this.primaryModelId;
    let rawText = '';

    try {
      rawText = await invokeBedrockModel(activeModel, systemPrompt, userMessage, 0.15);
    } catch (err: any) {
      if (this.fallbackModelId) {
        console.warn(`[${this.agentName}] Primary model ${activeModel} failed, routing to fallback ${this.fallbackModelId}:`, err.message);
        activeModel = this.fallbackModelId;
        rawText = await invokeBedrockModel(activeModel, systemPrompt, userMessage, 0.15);
      } else {
        throw err;
      }
    }

    const durationMs = Date.now() - startTime;
    const structuredOutput = this.parseOutput(rawText, context);

    return {
      agentName: this.agentName,
      modelId: activeModel,
      structuredOutput,
      rawText,
      durationMs,
    };
  }
}
