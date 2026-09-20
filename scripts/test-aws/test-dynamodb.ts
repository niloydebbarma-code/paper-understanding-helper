import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { getAWSConfig, getAWSCredentials } from './config';
import { TestResult } from './test-s3';

export async function testDynamoDB(): Promise<TestResult> {
  const startTime = Date.now();
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  const details: string[] = [];

  try {
    const ddb = new DynamoDBClient({
      region: config.region,
      credentials,
    });

    // Step 1: Test DynamoDB connectivity
    const listRes = await ddb.send(new ListTablesCommand({}));
    const tableNames = listRes.TableNames || [];
    details.push(`Connected to Amazon DynamoDB (${config.region}). Found ${tableNames.length} table(s).`);

    const targetTable = config.dynamoDbTableName;

    if (targetTable) {
      if (tableNames.includes(targetTable)) {
        // Step 2: Describe the table
        const descRes = await ddb.send(new DescribeTableCommand({ TableName: targetTable }));
        const status = descRes.Table?.TableStatus;
        const keySchema = descRes.Table?.KeySchema?.map((k) => `${k.AttributeName} (${k.KeyType})`).join(', ');
        details.push(`Table "${targetTable}" status: ${status}. Key schema: [${keySchema}].`);

        // Step 3: Test Put, Get, Delete on the session table
        const testId = `healthcheck_${Date.now()}`;
        const partitionKey = descRes.Table?.KeySchema?.[0]?.AttributeName || 'sessionId';

        await ddb.send(
          new PutItemCommand({
            TableName: targetTable,
            Item: {
              [partitionKey]: { S: testId },
              testProbe: { S: 'HealthCheck' },
              timestamp: { S: new Date().toISOString() },
            },
          })
        );
        details.push(`PutItem permission verified: Created test record with ${partitionKey}="${testId}".`);

        await ddb.send(
          new GetItemCommand({
            TableName: targetTable,
            Key: {
              [partitionKey]: { S: testId },
            },
          })
        );
        details.push(`GetItem permission verified: Retrieved test record.`);

        await ddb.send(
          new DeleteItemCommand({
            TableName: targetTable,
            Key: {
              [partitionKey]: { S: testId },
            },
          })
        );
        details.push(`DeleteItem permission verified: Cleaned up test record.`);

        return {
          service: 'Amazon DynamoDB',
          status: 'PASS',
          message: `DynamoDB is fully active and table "${targetTable}" is verified with read/write access.`,
          details,
          durationMs: Date.now() - startTime,
        };
      } else {
        return {
          service: 'Amazon DynamoDB',
          status: 'WARNING',
          message: `DynamoDB API connected, but table "${targetTable}" was not found.`,
          details: [
            ...details,
            `Existing tables: ${tableNames.length > 0 ? tableNames.join(', ') : '(None)'}`,
            `Fix: Create table "${targetTable}" in DynamoDB Console (${config.region}) with Partition Key 'sessionId' (String).`,
          ],
          durationMs: Date.now() - startTime,
        };
      }
    }

    return {
      service: 'Amazon DynamoDB',
      status: 'PASS',
      message: `DynamoDB connection active (${tableNames.length} tables found).`,
      details,
      durationMs: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      service: 'Amazon DynamoDB',
      status: 'FAIL',
      message: `Failed to connect to Amazon DynamoDB: ${error.message}`,
      details: [
        `Error Code: ${error.name || error.Code || 'Unknown'}`,
        `Region: ${config.region}`,
        `Fix: Ensure IAM credentials have 'dynamodb:ListTables', 'dynamodb:DescribeTable', and 'dynamodb:PutItem' permissions.`,
      ],
      durationMs: Date.now() - startTime,
    };
  }
}
