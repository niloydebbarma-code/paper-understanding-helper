import {
  S3Client,
  ListBucketsCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getAWSConfig, getAWSCredentials } from './config';

export interface TestResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string[];
  durationMs: number;
}

export async function testS3(): Promise<TestResult> {
  const startTime = Date.now();
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  const details: string[] = [];

  try {
    const s3 = new S3Client({
      region: config.region,
      credentials,
    });

    // Step 1: Check S3 API connection by listing buckets
    const listRes = await s3.send(new ListBucketsCommand({}));
    const bucketCount = listRes.Buckets?.length || 0;
    details.push(`Connected to Amazon S3 (${config.region}). Found ${bucketCount} accessible bucket(s).`);

    // Step 2: Check target project bucket if specified
    if (config.s3BucketName) {
      try {
        await s3.send(new HeadBucketCommand({ Bucket: config.s3BucketName }));
        details.push(`Target bucket "${config.s3BucketName}" exists and is accessible.`);

        // Step 3: Test write, read, and delete permissions
        const testKey = `_health_checks/test-${Date.now()}.txt`;
        const testPayload = `AWS S3 health check probe from Paper Understanding Helper at ${new Date().toISOString()}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: config.s3BucketName,
            Key: testKey,
            Body: Buffer.from(testPayload),
            ContentType: 'text/plain',
          })
        );
        details.push(`Write permission verified: Successfully put test object "${testKey}".`);

        await s3.send(
          new GetObjectCommand({
            Bucket: config.s3BucketName,
            Key: testKey,
          })
        );
        details.push(`Read permission verified: Successfully retrieved test object.`);

        await s3.send(
          new DeleteObjectCommand({
            Bucket: config.s3BucketName,
            Key: testKey,
          })
        );
        details.push(`Delete permission verified: Successfully cleaned up test object.`);
      } catch (bucketErr: any) {
        return {
          service: 'Amazon S3',
          status: 'WARNING',
          message: `S3 connection works, but bucket "${config.s3BucketName}" error: ${bucketErr.message}`,
          details: [
            ...details,
            `Fix: Create or configure bucket "${config.s3BucketName}" in AWS S3 Console (${config.region}).`,
          ],
          durationMs: Date.now() - startTime,
        };
      }
    } else {
      details.push(`Note: S3_BUCKET_NAME is not set in .env. General S3 connection is active.`);
    }

    return {
      service: 'Amazon S3',
      status: 'PASS',
      message: config.s3BucketName
        ? `S3 is fully active with read/write access to "${config.s3BucketName}".`
        : `S3 API connection active (${bucketCount} buckets found). Set S3_BUCKET_NAME in .env for full read/write test.`,
      details,
      durationMs: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      service: 'Amazon S3',
      status: 'FAIL',
      message: `Failed to connect to Amazon S3: ${error.message}`,
      details: [
        `Error Code: ${error.name || error.Code || 'Unknown'}`,
        `Region: ${config.region}`,
        `Fix: Ensure AWS credentials in .env or ~/.aws/credentials have 's3:ListAllMyBuckets' and 's3:PutObject' permissions.`,
      ],
      durationMs: Date.now() - startTime,
    };
  }
}
