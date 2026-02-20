#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Get environment from context (default: dev)
const environment = app.node.tryGetContext('environment') || 'dev';

// Create stack with environment-specific naming
const stack = new BackendStack(app, `CincyMuseBackend-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: `CincyMuse Chatbot Backend Stack (${environment})`,
  tags: {
    Project: 'CincyMuse',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});

// Add cdk-nag security checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

app.synth();