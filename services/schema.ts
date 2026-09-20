import { PaperAnalysis } from '../src/types';

/**
 * DynamoDB Single-Table Entity Mapping & Keys
 * Table Name: PaperReviewerSessions
 * Partition Key: PK (String) -> "SESSION#<paperId>"
 * Sort Key: SK (String) -> "METADATA#<analyzedAt>" | "CLAIM#<id>"
 */

export interface DynamoDBSessionRecord {
  PK: string;
  SK: string;
  entityType: 'SESSION_METADATA' | 'CLAIM' | 'SUPPLEMENTARY_CHECKPOINT';
  paperId: string;
  title: string;
  userRole: string;
  overallRigorScore: number;
  transparencyScore: number;
  analyzedAt: string;
  claimsCount: number;
  questionsCount: number;
  missingSourcesCount: number;
  rawPdfS3Uri?: string;
  markdownS3Uri?: string;
  payloadJson: string;
}

/**
 * Transforms PaperAnalysis into a structured DynamoDB Item
 */
export function toDynamoDBSessionItem(analysis: PaperAnalysis, userRole: string, s3Bucket: string): Record<string, any> {
  return {
    sessionId: { S: analysis.paperId },
    entityType: { S: 'SESSION_METADATA' },
    paperId: { S: analysis.paperId },
    title: { S: analysis.title },
    userRole: { S: userRole },
    overallRigorScore: { N: String(analysis.overallRigorScore) },
    transparencyScore: { N: String(analysis.transparencyScore) },
    analyzedAt: { S: analysis.analyzedAt },
    claimsCount: { N: String(analysis.claims.length) },
    questionsCount: { N: String(analysis.questions.length) },
    missingSourcesCount: { N: String(analysis.missingSources.length) },
    rawPdfS3Uri: { S: `s3://${s3Bucket}/papers/${analysis.paperId}/document.pdf` },
    markdownS3Uri: { S: `s3://${s3Bucket}/papers/${analysis.paperId}/document.md` },
    payload: { S: JSON.stringify(analysis) },
  };
}

/**
 * AWS Bedrock Foundation Models Rate Matrix
 */
export const AWS_MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number; provider: string }> = {
  'amazon.nova-micro-v1:0': { inputPer1M: 0.035, outputPer1M: 0.14, provider: 'Amazon' },
  'amazon.nova-lite-v1:0': { inputPer1M: 0.06, outputPer1M: 0.24, provider: 'Amazon' },
  'amazon.nova-pro-v1:0': { inputPer1M: 0.80, outputPer1M: 3.20, provider: 'Amazon' },
  'anthropic.claude-opus-4-5-20251101-v1:0': { inputPer1M: 5.00, outputPer1M: 25.00, provider: 'Anthropic' },
  'anthropic.claude-sonnet-4-5-20250929-v1:0': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'Anthropic' },
  'anthropic.claude-haiku-4-5-20251001-v1:0': { inputPer1M: 0.80, outputPer1M: 4.00, provider: 'Anthropic' },
  'meta.llama3-3-70b-instruct-v1:0': { inputPer1M: 0.72, outputPer1M: 0.72, provider: 'Meta' },
  'us.amazon.nova-micro-v1:0': { inputPer1M: 0.035, outputPer1M: 0.14, provider: 'Amazon' },
  'us.amazon.nova-lite-v1:0': { inputPer1M: 0.06, outputPer1M: 0.24, provider: 'Amazon' },
  'us.amazon.nova-pro-v1:0': { inputPer1M: 0.80, outputPer1M: 3.20, provider: 'Amazon' },
  'us.anthropic.claude-opus-4-5-20251101-v1:0': { inputPer1M: 5.00, outputPer1M: 25.00, provider: 'Anthropic' },
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'Anthropic' },
  'us.anthropic.claude-haiku-4-5-20251001-v1:0': { inputPer1M: 0.80, outputPer1M: 4.00, provider: 'Anthropic' },
  'us.meta.llama3-3-70b-instruct-v1:0': { inputPer1M: 0.72, outputPer1M: 0.72, provider: 'Meta' },
};

/**
 * Resilient JSON extraction utility that repairs common LLM syntax quirks
 */
export function extractAndParseJson<T>(rawText: string, fallbackValue: T): T {
  if (!rawText || typeof rawText !== 'string') {
    return fallbackValue;
  }

  const cleaned = rawText
    .replace(/^[\s\S]*?```json/i, '')
    .replace(/^[\s\S]*?```/i, '')
    .replace(/```[\s\S]*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSubstring = rawText.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonSubstring) as T;
      } catch {
        // Try fixing common trailing comma issue
        const fixed = jsonSubstring.replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(fixed) as T;
        } catch {
          return fallbackValue;
        }
      }
    }
    return fallbackValue;
  }
}
