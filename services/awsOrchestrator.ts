import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PDFParse } from 'pdf-parse';
import { getAWSConfig, getAWSCredentials } from '../scripts/test-aws/config';
import { PaperAnalysis } from '../src/types';
import { toDynamoDBSessionItem } from './schema';

export function getBedrockRuntimeClient(): BedrockRuntimeClient {
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  return new BedrockRuntimeClient({
    region: config.region,
    credentials,
  });
}

export function getS3Client(): S3Client {
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  return new S3Client({
    region: config.region,
    credentials,
  });
}

export function getDynamoDBClient(): DynamoDBClient {
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  return new DynamoDBClient({
    region: config.region,
    credentials,
  });
}

/**
 * Extract clean text from Base64 PDF using high-speed local PDF engine
 */
export async function parsePdfBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer, verbosity: 0 });
    const textResult = await parser.getText();
    return textResult?.text || '';
  } catch (err) {
    console.warn('PDF text extraction error (falling back):', err);
    return '';
  }
}

/**
 * Invoke Bedrock Model using Converse API with dynamic credential resolution
 */
export async function invokeBedrockModel(
  modelId: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.2
): Promise<string> {
  const client = getBedrockRuntimeClient();

  const command = new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: 'user',
        content: [{ text: userMessage }],
      },
    ],
    inferenceConfig: {
      maxTokens: 8192,
      temperature,
    },
  });

  const res = await client.send(command);
  return res.output?.message?.content?.[0]?.text || '';
}

/**
 * Persist paper to S3
 */
export async function savePaperToS3(paperId: string, content: Buffer | string, contentType: string = 'text/plain') {
  const config = getAWSConfig();
  if (!config.s3BucketName) return;
  try {
    const s3 = getS3Client();
    const key = `papers/${paperId}/document.${contentType === 'application/pdf' ? 'pdf' : contentType === 'text/markdown' ? 'md' : 'txt'}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3BucketName,
        Key: key,
        Body: typeof content === 'string' ? Buffer.from(content) : content,
        ContentType: contentType,
      })
    );
  } catch (err) {
    console.warn('Could not save paper to S3 (non-fatal):', err);
  }
}

/**
 * Persist session checkpoint to DynamoDB with single-table design schema
 */
export async function saveSessionToDynamoDB(sessionId: string, analysis: PaperAnalysis, userRole: string = 'phd') {
  const config = getAWSConfig();
  if (!config.dynamoDbTableName) return;
  try {
    const dynamodb = getDynamoDBClient();
    const item = toDynamoDBSessionItem(analysis, userRole, config.s3BucketName || 'paper-reviewer-storage');
    await dynamodb.send(
      new PutItemCommand({
        TableName: config.dynamoDbTableName,
        Item: item,
      })
    );
  } catch (err) {
    console.warn('Could not save session to DynamoDB (non-fatal):', err);
  }
}
