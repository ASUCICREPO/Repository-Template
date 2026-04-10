import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ADR: cdk-nag scoped to stack, not app entry point
    // Rationale: Self-contained security checks travel with the stack when used as a template
    // Alternative: Aspects.of(app) in bin/backend.ts (rejected - doesn't travel with stack)
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));

    // The code that defines your stack goes here

    // ---------------------------------------------------------------
    // cdk-nag suppression examples — uncomment and adapt when needed
    // Common findings:
    //   AwsSolutions-IAM4 : AWS managed policy used (e.g. AWSLambdaBasicExecutionRole)
    //   AwsSolutions-IAM5 : Wildcard permissions — scope to specific resource ARNs
    //   AwsSolutions-S1   : S3 access logging disabled — enable for sensitive buckets
    //   AwsSolutions-L1   : Lambda runtime not latest — update to python3.12+
    //
    // Stack-level suppression (applies to all resources in this stack):
    // NagSuppressions.addStackSuppressions(this, [
    //   { id: 'AwsSolutions-IAM4', reason: 'ADR: <title> | Rationale: <why> | Alternative: <rejected>' },
    // ]);
    //
    // Resource-level suppression (applies to one specific construct):
    // NagSuppressions.addResourceSuppressions(myResource, [
    //   { id: 'AwsSolutions-IAM4', reason: 'ADR: <title> | Rationale: <why> | Alternative: <rejected>' },
    // ]);
    // ---------------------------------------------------------------
  }
}
