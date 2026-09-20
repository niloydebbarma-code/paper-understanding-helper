import {
  BedrockClient,
  ListFoundationModelsCommand,
} from '@aws-sdk/client-bedrock';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getAWSConfig, getAWSCredentials } from './config';
import { TestResult } from './test-s3';

interface ModelStatus {
  modelId: string;
  role: string;
  status: 'GRANTED' | 'NOT_ENABLED' | 'ERROR';
  latencyMs?: number;
  message?: string;
}

export async function testBedrock(): Promise<TestResult> {
  const startTime = Date.now();
  const config = getAWSConfig();
  const credentials = getAWSCredentials();
  const details: string[] = [];

  try {
    const bedrock = new BedrockClient({
      region: config.region,
      credentials,
    });

    const bedrockRuntime = new BedrockRuntimeClient({
      region: config.region,
      credentials,
    });

    // Step 1: List Foundation Models to verify Bedrock control plane access
    let accessibleModels: string[] = [];
    try {
      const listRes = await bedrock.send(new ListFoundationModelsCommand({}));
      accessibleModels = (listRes.modelSummaries || [])
        .map((m) => m.modelId)
        .filter((id): id is string => Boolean(id));

      details.push(`Amazon Bedrock control plane active in region "${config.region}". ${accessibleModels.length} foundation models listed.`);
    } catch (listErr: any) {
      details.push(`Note: ListFoundationModels returned: ${listErr.message}. Testing direct model invocation.`);
    }

    // Step 2: Test key models used in the 5-Agent Swarm (using active cross-region inference profiles)
    const modelsToTest = [
      {
        modelId: 'us.amazon.nova-micro-v1:0',
        fallbackId: 'amazon.nova-micro-v1:0',
        role: 'Agent 1 & 5: Structural Extractor & Adaptive Communicator',
      },
      {
        modelId: 'us.amazon.nova-lite-v1:0',
        fallbackId: 'amazon.nova-lite-v1:0',
        role: 'Agent 3: Evidence Verifier / Nova Tier',
      },
      {
        modelId: 'us.amazon.nova-pro-v1:0',
        fallbackId: 'amazon.nova-pro-v1:0',
        role: 'Agent 3: Deep Multimodal Verification & Pro Reasoning',
      },
      {
        modelId: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
        fallbackId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        role: 'Agent 2: Flagship Adversarial Critic (Claude Opus 4.5)',
      },
      {
        modelId: 'us.meta.llama3-3-70b-instruct-v1:0',
        fallbackId: 'meta.llama3-3-70b-instruct-v1:0',
        role: 'Agent 4: Gap & Paywall Investigator / Llama 3.3',
      },
    ];

    const modelResults: ModelStatus[] = [];

    for (const item of modelsToTest) {
      const modelStart = Date.now();
      let testedId = item.modelId;

      try {
        const pingCommand = new ConverseCommand({
          modelId: testedId,
          messages: [
            {
              role: 'user',
              content: [{ text: 'Respond strictly with the single word: "READY"' }],
            },
          ],
          inferenceConfig: {
            maxTokens: 10,
            temperature: 0.1,
          },
        });

        const res = await bedrockRuntime.send(pingCommand);
        const reply = res.output?.message?.content?.[0]?.text?.trim() || 'OK';
        const latency = Date.now() - modelStart;

        modelResults.push({
          modelId: testedId,
          role: item.role,
          status: 'GRANTED',
          latencyMs: latency,
          message: `Responded in ${latency}ms ("${reply}")`,
        });
      } catch (invokeErr: any) {
        // Try fallback if primary ID failed
        if (item.fallbackId) {
          try {
            testedId = item.fallbackId;
            const fallbackCmd = new ConverseCommand({
              modelId: testedId,
              messages: [
                {
                  role: 'user',
                  content: [{ text: 'Respond strictly with the single word: "READY"' }],
                },
              ],
              inferenceConfig: {
                maxTokens: 10,
                temperature: 0.1,
              },
            });
            const res = await bedrockRuntime.send(fallbackCmd);
            const reply = res.output?.message?.content?.[0]?.text?.trim() || 'OK';
            const latency = Date.now() - modelStart;

            modelResults.push({
              modelId: testedId,
              role: item.role,
              status: 'GRANTED',
              latencyMs: latency,
              message: `Responded in ${latency}ms ("${reply}")`,
            });
            continue;
          } catch (fbErr) {
            // Keep original error
          }
        }

        const isAccessDenied =
          invokeErr.name === 'AccessDeniedException' ||
          invokeErr.message?.includes('Model access') ||
          invokeErr.message?.includes('not enabled') ||
          invokeErr.message?.includes('You don\'t have access');

        modelResults.push({
          modelId: testedId,
          role: item.role,
          status: isAccessDenied ? 'NOT_ENABLED' : 'ERROR',
          message: invokeErr.message,
        });
      }
    }

    // Compile findings
    for (const res of modelResults) {
      if (res.status === 'GRANTED') {
        details.push(`✔ [GRANTED] ${res.modelId} (${res.role}): ${res.message}`);
      } else if (res.status === 'NOT_ENABLED') {
        details.push(`✖ [PENDING ACCESS] ${res.modelId} (${res.role}): Model access needs to be enabled in Bedrock Console.`);
      } else {
        details.push(`⚠ [ERROR] ${res.modelId} (${res.role}): ${res.message}`);
      }
    }

    const grantedCount = modelResults.filter((m) => m.status === 'GRANTED').length;

    if (grantedCount === modelResults.length) {
      return {
        service: 'Amazon Bedrock',
        status: 'PASS',
        message: `All ${grantedCount} agent models are granted and responsive in region "${config.region}".`,
        details,
        durationMs: Date.now() - startTime,
      };
    } else if (grantedCount > 0) {
      return {
        service: 'Amazon Bedrock',
        status: 'WARNING',
        message: `${grantedCount} of ${modelResults.length} models granted. Some models need activation in Amazon Bedrock Console.`,
        details: [
          ...details,
          `Fix: Go to AWS Console ➔ Amazon Bedrock ➔ "Model access" (in ${config.region}) ➔ Enable requested models.`,
        ],
        durationMs: Date.now() - startTime,
      };
    } else {
      return {
        service: 'Amazon Bedrock',
        status: 'WARNING',
        message: 'Bedrock API reachable, but model access is not yet granted for requested models.',
        details: [
          ...details,
          `Fix: In AWS Bedrock Console (${config.region}), click "Model access" ➔ "Enable all models" (or enable Nova Micro/Pro and Claude 3.5 Sonnet).`,
        ],
        durationMs: Date.now() - startTime,
      };
    }
  } catch (error: any) {
    return {
      service: 'Amazon Bedrock',
      status: 'FAIL',
      message: `Failed to connect to Amazon Bedrock: ${error.message}`,
      details: [
        `Error Code: ${error.name || 'Unknown'}`,
        `Region: ${config.region}`,
        `Fix: Ensure IAM user/role has 'bedrock:InvokeModel' and 'bedrock:Converse' policies attached.`,
      ],
      durationMs: Date.now() - startTime,
    };
  }
}
