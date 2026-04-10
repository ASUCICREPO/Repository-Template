---
inclusion: manual
---

# S3 Vectors RAG Chatbot

How to wire S3 Vectors + Bedrock Knowledge Base for RAG chatbots. Covers CDK setup (TypeScript primary, Python alternate) and Lambda retrieval.

## S3 Vectors Bucket + Index (TypeScript CDK — primary)

Use `cdk-s3-vectors` package. Install: `npm install cdk-s3-vectors`.

```typescript
import { Bucket, Index } from 'cdk-s3-vectors';

const vectorsBucket = new Bucket(this, 'VectorsBucket', {
  vectorBucketName: `${projectPrefix}-vectors-${this.account}-${this.region}`,
});

const vectorIndex = new Index(this, 'VectorIndex', {
  vectorBucketName: vectorsBucket.vectorBucketName,
  indexName: `${projectPrefix}-vector-index`,
  dimension: 1024, // Match your embedding model (1024 = Titan V2, 256 = Titan V2 256)
  distanceMetric: 'cosine',
  dataType: 'float32',
  metadataConfiguration: {
    nonFilterableMetadataKeys: [
      'AMAZON_BEDROCK_TEXT',      // Required by Bedrock KB
      'AMAZON_BEDROCK_METADATA',  // Required by Bedrock KB
    ],
  },
});
```

## S3 Vectors Bucket + Index (Python CDK — alternate)

Use `cdklabs.generative_ai_cdk_constructs`. Install: add to `requirements.txt`.

```python
from cdklabs.generative_ai_cdk_constructs import bedrock, s3vectors

vector_bucket = s3vectors.VectorBucket(self, "vector-bucket",
    removal_policy=cdk.RemovalPolicy.DESTROY,
    auto_delete_objects=True)

vector_index = s3vectors.VectorIndex(self, "vectorstore",
    dimension=256,  # Match your embedding model
    vector_bucket=vector_bucket,
    non_filterable_metadata_keys=["AMAZON_BEDROCK_TEXT", "AMAZON_BEDROCK_METADATA"])
```

## Bedrock Knowledge Base

**TypeScript** — use L1 `CfnKnowledgeBase` + `CfnDataSource`:

```typescript
import { CfnKnowledgeBase, CfnDataSource } from 'aws-cdk-lib/aws-bedrock';

const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
  assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
});

// S3 Vectors permissions (resource-level ARNs not yet documented — suppress with cdk-nag)
knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
  actions: [
    's3vectors:CreateIndex', 's3vectors:GetIndex', 's3vectors:DeleteIndex',
    's3vectors:PutVectors', 's3vectors:GetVectors', 's3vectors:DeleteVectors',
    's3vectors:QueryVectors', 's3vectors:ListIndexes',
  ],
  resources: ['*'],
}));
knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel'],
  resources: [`arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`],
}));
documentsBucket.grantRead(knowledgeBaseRole);

const knowledgeBase = new CfnKnowledgeBase(this, 'KnowledgeBase', {
  name: `${projectPrefix}-knowledge-base`,
  roleArn: knowledgeBaseRole.roleArn,
  knowledgeBaseConfiguration: {
    type: 'VECTOR',
    vectorKnowledgeBaseConfiguration: {
      embeddingModelArn: `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
    },
  },
  storageConfiguration: {
    type: 'S3_VECTORS',
    s3VectorsConfiguration: {
      bucketArn: vectorsBucket.vectorBucketArn,
      indexArn: vectorIndex.indexArn,
    },
  },
});

const dataSource = new CfnDataSource(this, 'DataSource', {
  knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
  name: `${projectPrefix}-s3-documents`,
  dataSourceConfiguration: {
    type: 'S3',
    s3Configuration: {
      bucketArn: documentsBucket.bucketArn,
      inclusionPrefixes: ['docs/'],  // Adjust to match your ingestion pattern (see below)
    },
  },
  vectorIngestionConfiguration: {
    chunkingConfiguration: {
      chunkingStrategy: 'FIXED_SIZE',
      fixedSizeChunkingConfiguration: { maxTokens: 525, overlapPercentage: 15 },
    },
  },
  dataDeletionPolicy: 'RETAIN',
});
```

**Python** — use L3 `bedrock.VectorKnowledgeBase` (handles role + KB + storage in one construct):

```python
from cdklabs.generative_ai_cdk_constructs import bedrock, s3vectors

kb = bedrock.VectorKnowledgeBase(self, "knowledgebase",
    embeddings_model=bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_256,
    vector_store=vector_index)

kb.add_s3_data_source(
    bucket=doc_bucket,
    data_deletion_policy=bedrock.DataDeletionPolicy.RETAIN)
```

## Document Ingestion Patterns

The data source above points at an S3 bucket — how documents get there varies by project. Pick the pattern that fits:

**A) Direct S3 upload** — simplest. Users or scripts upload files (PDF, TXT, HTML, JSON) directly to the bucket. Bedrock KB natively parses PDFs, plain text, HTML, Markdown, CSV, DOC/DOCX, XLS/XLSX. Trigger a KB sync after upload.
```
S3 bucket (docs/) → KB ingestion job → S3 Vectors
```
- `inclusionPrefixes: ['docs/']` or omit for entire bucket
- Best for: static document sets, manual uploads, pre-processed content

**B) Web scraper pipeline** — Lambda scrapes a website, saves content to S3, triggers KB sync. Use EventBridge for scheduled scraping.
```
EventBridge (cron) → Scraper Lambda → S3 bucket → KB ingestion job → S3 Vectors
```
- Scraper Lambda needs: `s3:PutObject`, `s3:DeleteObject`, `bedrock:StartIngestionJob`
- Use `CustomResource` to trigger initial scrape on stack creation
- Best for: knowledge bases sourced from websites, periodically updated content

**C) Document processing pipeline** — Step Functions orchestrates OCR/extraction before ingestion. Use when source documents need transformation (scanned PDFs, images).
```
S3 upload (input/) → Batch Lambda → Step Functions
  → Textract (async) → Wait/Poll → Postprocessor Lambda → S3 (output/processed-text/)
  → KB ingestion job → S3 Vectors
```
- Set `inclusionPrefixes: ['output/processed-text/']` to only ingest processed output
- Postprocessor Lambda triggers KB sync after saving extracted text
- Best for: scanned documents, PDFs with tables/forms, image-based content

**D) EventBridge + SQS batch** — for high-volume or event-driven ingestion. S3 events → SQS queue → processor Lambda → KB sync.
```
S3 event → EventBridge → SQS → Processor Lambda → KB ingestion job → S3 Vectors
```
- SQS provides retry/DLQ for failed processing
- Best for: continuous document streams, multi-source ingestion

**Chunking guidance** (applies to all patterns):
- General documents: `maxTokens: 525`, `overlapPercentage: 15`
- Dense technical content: `maxTokens: 300`, `overlapPercentage: 20`
- Long-form narrative: `maxTokens: 800`, `overlapPercentage: 10`
- Always test retrieval quality and adjust

## Lambda Permissions (TypeScript)

**CRITICAL - Validate Model Availability First:**
Before adding IAM permissions, validate models are available:
```bash
aws bedrock list-foundation-models --region <region>
aws bedrock list-inference-profiles --region <region>
```

**Prefer AWS-owned models** (Nova, Titan) that don't require marketplace subscriptions.

```typescript
// Bedrock model invocation — scope to specific models
// IMPORTANT: Validate these models are available in your region first
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: [
    `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
    // Prefer AWS-owned models: us.amazon.nova-pro-v1:0, us.amazon.nova-lite-v1:0
    // Add your LLM ARN only after validating availability
  ],
}));

// KB retrieval + ingestion
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['bedrock:Retrieve', 'bedrock:RetrieveAndGenerate', 'bedrock:StartIngestionJob',
            'bedrock:GetDataSource', 'bedrock:ListDataSources'],
  resources: [`arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`],
}));
```

Pass to Lambda environment:
```typescript
environment: {
  KNOWLEDGE_BASE_ID: knowledgeBase.attrKnowledgeBaseId,  // TS
  // or kb.knowledge_base_id for Python CDK
  DATA_SOURCE_ID: dataSource.attrDataSourceId,
},
```

## Lambda Retrieval Pattern (JavaScript — for TypeScript CDK projects)

```javascript
const { BedrockAgentRuntimeClient, RetrieveCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const agentClient = new BedrockAgentRuntimeClient({ region: process.env.REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.REGION });

async function retrieveContext(query) {
  const result = await agentClient.send(new RetrieveCommand({
    knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
    retrievalQuery: { text: query },
    retrievalConfiguration: { vectorSearchConfiguration: { numberOfResults: 10 } },
  }));
  if (!result.retrievalResults?.length) return { context: '', citations: [] };
  const context = result.retrievalResults.map(r => r.content?.text || '').join('\n\n');
  const citations = result.retrievalResults.map(r => r.location?.s3Location?.uri || '').filter(Boolean);
  return { context, citations };
}
```

## Lambda Retrieval Pattern (Python — for Python CDK projects)

Uses `bedrock-agent-runtime` for KB retrieval and `bedrock-runtime` Converse API for LLM responses. Initialize clients at module level for warm invocation reuse.

```python
import boto3, os, json, logging

logger = logging.getLogger(__name__)

# Module-level clients — reused across warm invocations
agent = boto3.client('bedrock-agent-runtime')
bedrock = boto3.client('bedrock-runtime')

def retrieve_context(query: str) -> dict:
    """Retrieve from Bedrock Knowledge Base backed by S3 Vectors."""
    result = agent.retrieve(
        knowledgeBaseId=os.environ.get('KNOWLEDGE_BASE_ID'),
        retrievalQuery={'text': query},
        retrievalConfiguration={'vectorSearchConfiguration': {
            'numberOfResults': int(os.environ.get('NUM_KB_RESULTS', '5'))
        }})
    results = result.get('retrievalResults', [])
    context = '\n\n'.join(r.get('content', {}).get('text', '') for r in results)
    citations = [r.get('location', {}).get('s3Location', {}).get('uri', '')
                 for r in results if r.get('location')]
    return {'context': context, 'citations': citations}

def converse_with_model(model_id: str, messages: list, system: list = None,
                        config: dict = None, streaming: bool = False):
    """Call Bedrock Converse API (supports streaming for WebSocket responses)."""
    params = {'modelId': model_id, 'messages': messages}
    if system: params['system'] = system
    if config: params['inferenceConfig'] = config
    if streaming:
        return bedrock.converse_stream(**params)
    return bedrock.converse(**params)
```

**Typical flow in `lambda_handler`**: retrieve context → inject into system prompt → call `converse_with_model` → stream response back to client (via WebSocket or Function URL).

## KB Sync After Ingestion

```javascript
const { BedrockAgentClient, StartIngestionJobCommand } = require('@aws-sdk/client-bedrock-agent');
async function syncKnowledgeBase() {
  await new BedrockAgentClient({}).send(new StartIngestionJobCommand({
    knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
    dataSourceId: process.env.DATA_SOURCE_ID,
  }));
}
```

## cdk-nag Suppressions

```typescript
// S3 Vectors wildcard — ARN format not yet documented
NagSuppressions.addResourceSuppressions(knowledgeBaseRole, [
  { id: 'AwsSolutions-IAM5', reason: 'S3 Vectors resource-level ARNs not yet documented. Will tighten when available.', appliesTo: ['Resource::*'] },
]);

// cdk-s3-vectors internal constructs (TypeScript only)
NagSuppressions.addResourceSuppressionsByPath(this, `/${stackName}/VectorsBucket`, [
  { id: 'AwsSolutions-L1', reason: 'cdk-s3-vectors internal construct.' },
  { id: 'AwsSolutions-IAM4', reason: 'cdk-s3-vectors internal construct.' },
  { id: 'AwsSolutions-IAM5', reason: 'cdk-s3-vectors internal construct.' },
], true);
NagSuppressions.addResourceSuppressionsByPath(this, `/${stackName}/VectorIndex`, [
  { id: 'AwsSolutions-L1', reason: 'cdk-s3-vectors internal construct.' },
  { id: 'AwsSolutions-IAM4', reason: 'cdk-s3-vectors internal construct.' },
  { id: 'AwsSolutions-IAM5', reason: 'cdk-s3-vectors internal construct.' },
], true);
```

## Embedding Models Quick Reference

| Model | Dimensions | CDK Constant (Python) |
|---|---|---|
| Titan Text Embeddings V2 | 1024 | `TITAN_EMBED_TEXT_V2_1024` |
| Titan Text Embeddings V2 (small) | 256 | `TITAN_EMBED_TEXT_V2_256` |
| Cohere Embed English V3 | 1024 | — |
| Cohere Embed Multilingual V3 | 1024 | — |

Set `dimension` in vector index to match your model. `AMAZON_BEDROCK_TEXT` and `AMAZON_BEDROCK_METADATA` in `nonFilterableMetadataKeys` are always required for Bedrock KB integration.
