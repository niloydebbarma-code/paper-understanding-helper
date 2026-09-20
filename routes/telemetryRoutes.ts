import { Router } from 'express';
import { getAWSConfig, getAWSCredentials } from '../scripts/test-aws/config';
import { testS3 } from '../scripts/test-aws/test-s3';
import { testDynamoDB } from '../scripts/test-aws/test-dynamodb';
import { testTextract } from '../scripts/test-aws/test-textract';
import { testBedrock } from '../scripts/test-aws/test-bedrock';
import { AWS_MODEL_PRICING } from '../services/schema';
import { getDynamoDBClient } from '../services/awsOrchestrator';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';

export const telemetryRouter = Router();

// 46. Container Health & Heartbeat
telemetryRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 47. AWS Multi-Service Parallel Live Probe
telemetryRouter.get('/aws/health', async (req, res) => {
  try {
    const config = getAWSConfig();
    const [s3, dynamodb, textract, bedrock] = await Promise.all([
      testS3(),
      testDynamoDB(),
      testTextract(),
      testBedrock(),
    ]);

    const services = [s3, dynamodb, textract, bedrock];
    const hasFailure = services.some((s) => s.status === 'FAIL');
    const hasWarning = services.some((s) => s.status === 'WARNING');

    res.status(hasFailure ? 502 : 200).json({
      overallStatus: hasFailure ? 'FAIL' : hasWarning ? 'WARNING' : 'PASS',
      timestamp: new Date().toISOString(),
      region: config.region,
      services,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AWS diagnostic check failed.' });
  }
});

// 48. Supported Bedrock Models Matrix
telemetryRouter.get('/telemetry/pricing', (req, res) => {
  res.json({
    models: AWS_MODEL_PRICING,
  });
});

// 49. Document Session State
telemetryRouter.post('/telemetry/session-state', (req, res) => {
  const { paperId = '' } = req.body;
  res.json({ paperId, status: 'RECORDED', timestamp: new Date().toISOString() });
});

// 50. Single-Table Session & Telemetry State Retrieval from DynamoDB
telemetryRouter.get('/sessions/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const dynamoTable = process.env.DYNAMODB_TABLE_NAME || 'PaperReviewerSessions';

    if (!process.env.AWS_ACCESS_KEY_ID) {
      return res.status(503).json({ error: 'AWS credentials not configured on server.' });
    }

    const dynamodb = getDynamoDBClient();
    const result = await dynamodb.send(
      new GetItemCommand({
        TableName: dynamoTable,
        Key: {
          sessionId: { S: paperId },
        },
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: `Session "${paperId}" not found in DynamoDB.` });
    }

    const payload = result.Item.payload?.S ? JSON.parse(result.Item.payload.S) : null;
    res.json({
      sessionId: result.Item.sessionId?.S,
      paperTitle: result.Item.title?.S,
      overallRigorScore: Number(result.Item.overallRigorScore?.N || 0),
      transparencyScore: Number(result.Item.transparencyScore?.N || 0),
      analyzedAt: result.Item.analyzedAt?.S,
      payload,
    });
  } catch (err: any) {
    console.error('Error in /api/sessions/:paperId:', err);
    res.status(500).json({ error: err.message || 'Failed to query DynamoDB session.' });
  }
});
