import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface AWSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  s3BucketName?: string;
  dynamoDbTableName?: string;
}

export function getAWSConfig(): AWSConfig {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  const s3BucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
  const dynamoDbTableName = process.env.DYNAMODB_TABLE_NAME || process.env.AWS_DYNAMODB_TABLE || 'PaperReviewerSessions';

  return {
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
    s3BucketName,
    dynamoDbTableName,
  };
}

export function getAWSCredentials() {
  const config = getAWSConfig();
  if (config.accessKeyId && config.secretAccessKey) {
    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      sessionToken: config.sessionToken,
    };
  }
  // Fall back to default provider chain (AWS CLI credentials / IAM role)
  return undefined;
}
