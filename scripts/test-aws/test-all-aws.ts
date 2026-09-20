import { getAWSConfig, getAWSCredentials } from './config';
import { testS3, TestResult } from './test-s3';
import { testDynamoDB } from './test-dynamodb';
import { testTextract } from './test-textract';
import { testBedrock } from './test-bedrock';

function color(text: string, colorCode: string): string {
  return `\x1b[${colorCode}m${text}\x1b[0m`;
}

const green = (t: string) => color(t, '32');
const yellow = (t: string) => color(t, '33');
const red = (t: string) => color(t, '31');
const cyan = (t: string) => color(t, '36');
const bold = (t: string) => color(t, '1');
const dim = (t: string) => color(t, '2');

async function runAllAWSTests() {
  console.log('\n' + bold(cyan('═══════════════════════════════════════════════════════════════════════')));
  console.log(bold(cyan('  THE AGENTIC RESEARCH REVIEWER — AWS SERVICES CONNECTIVITY DIAGNOSTIC ')));
  console.log(bold(cyan('═══════════════════════════════════════════════════════════════════════\n')));

  const config = getAWSConfig();
  const credentials = getAWSCredentials();

  console.log(bold('Environment Configuration:'));
  console.log(`  • AWS Region:             ${cyan(config.region)}`);
  console.log(`  • AWS Credentials Source: ${credentials ? green('Custom (.env: AWS_ACCESS_KEY_ID / SECRET)') : yellow('Default AWS Provider / IAM Role / ~/.aws')}`);
  console.log(`  • S3 Bucket Configured:   ${config.s3BucketName ? cyan(config.s3BucketName) : dim('(Not set in .env: S3_BUCKET_NAME)')}`);
  console.log(`  • DynamoDB Table:         ${config.dynamoDbTableName ? cyan(config.dynamoDbTableName) : dim('(Default: PaperReviewerSessions)')}`);
  console.log('\n' + dim('Running diagnostic probes against AWS endpoints...\n'));

  const results: TestResult[] = [];

  // 1. Test S3
  process.stdout.write('  [1/4] Probing Amazon S3 (Bucket & Storage API)... ');
  const s3Res = await testS3();
  results.push(s3Res);
  printStatus(s3Res);

  // 2. Test DynamoDB
  process.stdout.write('  [2/4] Probing Amazon DynamoDB (State & Checkpoints)... ');
  const ddbRes = await testDynamoDB();
  results.push(ddbRes);
  printStatus(ddbRes);

  // 3. Test Textract
  process.stdout.write('  [3/4] Probing AWS Textract (Layout & Tables IDP)... ');
  const textractRes = await testTextract();
  results.push(textractRes);
  printStatus(textractRes);

  // 4. Test Bedrock
  process.stdout.write('  [4/4] Probing Amazon Bedrock (Multi-Agent Converse API)... ');
  const bedrockRes = await testBedrock();
  results.push(bedrockRes);
  printStatus(bedrockRes);

  console.log('\n' + bold('───────────────────────────────────────────────────────────────────────'));
  console.log(bold('                     DIAGNOSTIC AUDIT SUMMARY                          '));
  console.log(bold('───────────────────────────────────────────────────────────────────────\n'));

  for (const r of results) {
    const badge =
      r.status === 'PASS'
        ? green('✔ PASS   ')
        : r.status === 'WARNING'
        ? yellow('▲ WARNING')
        : red('✖ FAIL   ');

    console.log(`${badge} | ${bold(r.service.padEnd(16))} | ${r.message} ${dim(`(${r.durationMs}ms)`)}`);
    if (r.details && r.details.length > 0) {
      for (const d of r.details) {
        console.log(`         ${dim('↳')} ${d}`);
      }
    }
    console.log();
  }

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warnCount = results.filter((r) => r.status === 'WARNING').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  console.log(bold('Final Status: ') +
    `${green(`${passCount} Passed`)}, ` +
    `${warnCount > 0 ? yellow(`${warnCount} Warnings`) : '0 Warnings'}, ` +
    `${failCount > 0 ? red(`${failCount} Failed`) : '0 Failed'}`
  );

  console.log('\n' + bold(cyan('═══════════════════════════════════════════════════════════════════════\n')));

  if (failCount > 0 || warnCount > 0) {
    console.log(bold('Recommended Next Steps:'));
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.log(' 1. Copy .env.example to .env and provide your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
    if (results.some((r) => r.service === 'Amazon Bedrock' && r.status !== 'PASS')) {
      console.log(' 2. Go to AWS Console ➔ Amazon Bedrock ➔ "Model access" ➔ Request access for Amazon Nova and Anthropic Claude.');
    }
    if (results.some((r) => r.service === 'Amazon S3' && r.status === 'WARNING')) {
      console.log(' 3. In AWS S3 Console, create the bucket specified in S3_BUCKET_NAME.');
    }
    if (results.some((r) => r.service === 'Amazon DynamoDB' && r.status === 'WARNING')) {
      console.log(' 4. In AWS DynamoDB Console, create table "PaperReviewerSessions" with Partition Key "sessionId" (String).');
    }
    console.log();
  }
}

function printStatus(r: TestResult) {
  if (r.status === 'PASS') {
    console.log(green(`✔ PASS (${r.durationMs}ms)`));
  } else if (r.status === 'WARNING') {
    console.log(yellow(`▲ WARNING (${r.durationMs}ms)`));
  } else {
    console.log(red(`✖ FAIL (${r.durationMs}ms)`));
  }
}

runAllAWSTests().catch((err) => {
  console.error('Diagnostic runner failed unexpectedly:', err);
  process.exit(1);
});
