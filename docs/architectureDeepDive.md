# Architecture Deep Dive

This document provides a detailed explanation of the CincyMuse chatbot architecture.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Layer                                      │
│  ┌──────────────────┐                    ┌──────────────────┐              │
│  │  Museum Visitor  │                    │   Admin User     │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
└───────────┼──────────────────────────────────────┼─────────────────────────┘
            │                                       │
            │                                       │
┌───────────┼───────────────────────────────────────┼─────────────────────────┐
│           │         Frontend - AWS Amplify        │                         │
│  ┌────────▼─────────┐                    ┌────────▼─────────┐              │
│  │  Chat Interface  │                    │ Admin Dashboard  │              │
│  │    (Next.js)     │                    │    (Next.js)     │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
└───────────┼──────────────────────────────────────┼─────────────────────────┘
            │                                       │
            │ HTTPS                                 │ HTTPS + JWT
            │                                       │
┌───────────┼───────────────────────────────────────┼─────────────────────────┐
│           │      API Layer - Lambda Function URLs │                         │
│  ┌────────▼─────────┐                    ┌────────▼─────────┐              │
│  │ Chat Function URL│                    │Admin Function URL│              │
│  │  (CORS enabled)  │                    │  (CORS enabled)  │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
└───────────┼──────────────────────────────────────┼─────────────────────────┘
            │                                       │
            │                                       │
┌───────────┼───────────────────────────────────────┼─────────────────────────┐
│           │      Compute Layer - Lambda Functions │                         │
│  ┌────────▼─────────┐                    ┌────────▼─────────┐              │
│  │  Chat Handler    │                    │  Admin Handler   │              │
│  │   (Python 3.13)  │                    │   (Python 3.13)  │              │
│  │ RetrieveAndGen   │                    │  Logs, PDFs,     │              │
│  │      API         │                    │   Analytics      │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
│           │                                       │                         │
│  ┌────────┴─────────┬─────────────────────────────┴─────────┐              │
│  │                  │                                         │              │
│  │ Collections      │  KB Sync Handler │  Podcast Ingestion│              │
│  │  Connector       │   (Python 3.13)  │   (Python 3.13)   │              │
│  │ (Python 3.13)    │  EventBridge     │   EventBridge     │              │
│  └──────┬───────────┴────────┬─────────┴────────┬──────────┘              │
└─────────┼────────────────────┼──────────────────┼─────────────────────────┘
          │                    │                  │
          │                    │                  │
┌─────────┼────────────────────┼──────────────────┼─────────────────────────┐
│         │    AI/ML - Amazon Bedrock             │                         │
│  ┌──────▼────────────────────▼──────────────────▼──────┐                 │
│  │         Bedrock Knowledge Base (Managed RAG)         │                 │
│  │  ┌────────────────────────────────────────────────┐  │                 │
│  │  │  4 Data Sources:                               │  │                 │
│  │  │  • Web Crawler: cincymuseum.org                │  │                 │
│  │  │  • Web Crawler: supportcmc.org                 │  │                 │
│  │  │  • S3: PDF documents                           │  │                 │
│  │  │  • S3: Podcasts & collections                  │  │                 │
│  │  └────────────────────────────────────────────────┘  │                 │
│  │  ┌────────────────────────────────────────────────┐  │                 │
│  │  │  OpenSearch Serverless (Managed Vector Store)  │  │                 │
│  │  │  • Titan Embeddings v2 (1024 dimensions)       │  │                 │
│  │  │  • Hybrid search (vector + keyword)            │  │                 │
│  │  └────────────────────────────────────────────────┘  │                 │
│  └──────────────────────┬───────────────────────────────┘                 │
│                         │                                                  │
│  ┌──────────────────────▼───────────────────────────────┐                 │
│  │         Claude 3 Sonnet (Response Generation)        │                 │
│  └──────────────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────────┘
            │                                       │
            │                                       │
┌───────────┼───────────────────────────────────────┼─────────────────────────┐
│           │         Data Layer                    │                         │
│  ┌────────▼─────────┐  ┌────────────────┐  ┌─────▼──────────┐             │
│  │   DynamoDB       │  │  S3 Buckets    │  │    Cognito     │             │
│  │ ConversationLogs │  │ • PDF Repo     │  │   User Pool    │             │
│  │  PDFMetadata     │  │ • KB Content   │  │  Admin Auth    │             │
│  └──────────────────┘  └────────────────┘  └────────────────┘             │
└──────────────────────────────────────────────────────────────────────────┘
            │
            │
┌───────────┼─────────────────────────────────────────────────────────────────┐
│           │         Monitoring - CloudWatch                                 │
│  ┌────────▼─────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  CloudWatch Logs │  │  Metrics       │  │    Alarms      │             │
│  │  • Chat Handler  │  │  • Lambda      │  │  • Error Rate  │             │
│  │  • Admin Handler │  │  • Bedrock     │  │  • Throttling  │             │
│  │  • Sync Jobs     │  │  • DynamoDB    │  │  • Sync Fails  │             │
│  └──────────────────┘  └────────────────┘  └────────┬───────┘             │
│                                                      │                      │
│                                            ┌─────────▼───────┐             │
│                                            │   SNS Topic     │             │
│                                            │ Alarm Notifs    │             │
│                                            └─────────────────┘             │
└──────────────────────────────────────────────────────────────────────────┘


---

## Data Layer

### DynamoDB Tables

**ConversationLogs Table**
- **Purpose**: Stores all chat conversations with metadata for analytics
- **Partition Key**: `conversationId` (STRING) - Unique identifier for each conversation
- **Sort Key**: `timestamp` (STRING) - ISO 8601 timestamp for chronological ordering
- **Attributes**:
  - `question`: User's question (PII redacted)
  - `response`: Chatbot's response (PII redacted)
  - `language`: Language code (`en` or `es`)
  - `confidence`: Confidence score (0.0-1.0) from retrieval
  - `sources`: Array of source citations
  - `feedback`: User feedback (`positive`, `negative`, or null)
  - `ttl`: Time-to-live (90 days retention)
- **Global Secondary Indexes**:
  - **TimestampIndex**: Partition key `language`, sort key `timestamp` - Enables time-range queries by language
  - **FeedbackIndex**: Partition key `feedback`, sort key `timestamp` - Enables feedback analytics
- **Billing**: Pay-per-request (on-demand)
- **Encryption**: AWS managed keys
- **Backup**: Point-in-time recovery enabled

**PDFMetadata Table**
- **Purpose**: Tracks uploaded customer service PDF documents
- **Partition Key**: `pdfId` (STRING) - Unique identifier for each PDF
- **Attributes**:
  - `fileName`: Original file name
  - `uploadedAt`: Upload timestamp
  - `s3Key`: S3 object key
  - `fileSize`: File size in bytes
  - `uploadedBy`: Admin user email
- **Billing**: Pay-per-request (on-demand)
- **Encryption**: AWS managed keys

### S3 Buckets

**PDF Repository Bucket**
- **Purpose**: Stores customer service PDF documents for Knowledge Base ingestion
- **Encryption**: S3-managed encryption (SSE-S3)
- **Versioning**: Enabled for document history
- **Public Access**: Blocked (all public access disabled)
- **CORS**: Configured for frontend uploads (localhost + Amplify URL)
- **SSL**: Enforced (rejects non-HTTPS requests)

**KB Content Bucket**
- **Purpose**: Stores dynamically fetched content (podcasts, collections, events)
- **Encryption**: S3-managed encryption (SSE-S3)
- **Public Access**: Blocked
- **SSL**: Enforced
- **Prefixes**:
  - `podcasts/`: Podcast episode transcripts
  - `collections/`: Museum collection data
  - `events/`: Event feed data

### Amazon Cognito

**User Pool Configuration**
- **Purpose**: Admin authentication for dashboard access
- **Sign-in**: Email-based authentication
- **Self-registration**: Disabled (admin-only access)
- **Password Policy**:
  - Minimum 8 characters
  - Requires uppercase, lowercase, digits, and symbols
- **MFA**: Optional (recommended for production)
- **Token Validity**:
  - Access token: 30 minutes
  - ID token: 30 minutes
  - Refresh token: 30 days
- **User Groups**:
  - **Admin**: Full access (upload/delete PDFs, view all logs)
  - **Viewer**: Read-only access (view logs and analytics only)

---

## Monitoring and Observability

### CloudWatch Logs

All Lambda functions log to CloudWatch Logs with structured JSON logging:

**Chat Handler Logs**
- Conversation events with metadata (conversationId, language, confidence, sourceCount)
- Error logs with stack traces
- Performance metrics (Bedrock API latency)

**Admin Handler Logs**
- API requests (endpoint, user, action)
- PDF operations (upload, delete, sync trigger)
- Analytics queries (FAQ extraction, feedback stats)

**Sync Handler Logs**
- Ingestion job triggers (data source, job ID)
- Sync failures with error details

**Log Retention**: 30 days (configurable)

### CloudWatch Metrics

**Lambda Metrics**
- Invocations, errors, duration, throttles (per function)
- Concurrent executions

**Bedrock Metrics**
- Model invocations (Claude 3 Sonnet)
- Throttles and errors
- Latency (p50, p90, p99)

**DynamoDB Metrics**
- Read/write capacity consumed
- Throttled requests
- Item count

### CloudWatch Alarms

**Chat Handler Error Alarm**
- **Condition**: Error rate > 5% over 5 minutes
- **Action**: Publish to SNS topic
- **Use case**: Detect Lambda failures or Bedrock API issues

**Bedrock Throttle Alarm**
- **Condition**: Throttles > 10 per minute
- **Action**: Publish to SNS topic
- **Use case**: Detect quota limits or traffic spikes

**Lambda Errors Alarm**
- **Condition**: Total errors > 10 per minute (all functions)
- **Action**: Publish to SNS topic
- **Use case**: System-wide health monitoring

**KB Sync Failure Alarm**
- **Condition**: KB Sync Handler errors ≥ 1 over 5 minutes
- **Action**: Publish to SNS topic
- **Use case**: Detect content ingestion failures

**SNS Topic**: `cincymuse-alarms-{environment}` - Subscribe email/SMS for notifications

---

## Workflow Descriptions

### Chat Workflow

1. **User submits question** via frontend chat interface (English or Spanish)
2. **Frontend sends POST request** to Chat Function URL with `{ message, language, conversationId }`
3. **Chat Handler Lambda**:
   - Validates input (message length, language code)
   - Calls Bedrock `RetrieveAndGenerate` API with:
     - Knowledge Base ID
     - User question
     - Language-specific system prompt
     - Claude 3 Sonnet model
     - Retrieval config (5 results, hybrid search)
   - Receives response with generated text and citations
   - Calculates confidence score from retrieval scores
   - Extracts sources from citations (title, URL, type)
   - **Low confidence check**: If confidence < 0.7, returns fallback message with phone number
   - Logs conversation to DynamoDB (PII redacted)
   - Returns response with conversationId, response text, sources, confidence
4. **Frontend displays response** with streaming effect and source citations
5. **User provides feedback** (thumbs up/down) - optional
6. **Frontend sends POST request** to Chat Function URL with `{ action: 'feedback', conversationId, rating }`
7. **Chat Handler updates DynamoDB** with feedback value

### Admin Dashboard Workflow

**Authentication**
1. Admin navigates to `/admin` page
2. Frontend checks for valid Cognito session
3. If not authenticated, redirects to Cognito Hosted UI login
4. User enters email/password
5. Cognito returns JWT tokens (access, ID, refresh)
6. Frontend stores tokens and redirects to dashboard

**Conversation Logs**
1. Admin clicks "Conversation Logs" tab
2. Frontend sends GET request to Admin Function URL with `Authorization: Bearer {idToken}`
3. Admin Handler validates JWT token
4. Queries DynamoDB ConversationLogs table (TimestampIndex for date range)
5. Returns paginated results with filters (language, date range, feedback)
6. Frontend displays logs in table with search/filter UI

**PDF Management**
1. Admin clicks "PDF Manager" tab
2. Frontend fetches PDF list from Admin Handler (queries PDFMetadata table)
3. Admin uploads new PDF:
   - Frontend generates presigned S3 URL via Admin Handler
   - Uploads file directly to S3
   - Admin Handler creates PDFMetadata record
   - Admin Handler triggers Bedrock KB ingestion job for PDF data source
4. Admin deletes PDF:
   - Frontend sends DELETE request to Admin Handler
   - Admin Handler deletes S3 object and PDFMetadata record
   - Admin Handler triggers KB sync to remove from vector store

**FAQ Analytics**
1. Admin clicks "FAQ Analytics" tab
2. Frontend requests FAQ data from Admin Handler
3. Admin Handler runs CloudWatch Logs Insights query:
   - Extracts top 20 most frequent questions
   - Groups by question text (fuzzy matching)
   - Counts occurrences
4. Returns FAQ list with counts
5. Frontend displays as ranked list

**System Health**
1. Admin clicks "System Health" tab
2. Frontend requests metrics from Admin Handler
3. Admin Handler queries CloudWatch Metrics:
   - Lambda invocations, errors, duration (last 24h)
   - Bedrock invocations, throttles (last 24h)
   - DynamoDB read/write capacity (last 24h)
4. Returns aggregated metrics
5. Frontend displays as charts and gauges

### Content Sync Workflow

**Scheduled Sync (EventBridge)**
1. **Event Feed Sync** (every 6 hours):
   - EventBridge triggers KB Sync Handler with `{ source_type: 'web' }`
   - KB Sync Handler starts ingestion jobs for web crawler data sources (cincymuseum.org, supportcmc.org)
   - Bedrock crawls websites, extracts content, generates embeddings, updates vector store
2. **Daily Sync** (every 24 hours):
   - EventBridge triggers Collections Connector Lambda
     - Fetches collection data from searchcollections.cincymuseum.org API
     - Writes JSON files to S3 KB Content Bucket (`collections/` prefix)
   - EventBridge triggers Podcast Ingestion Lambda
     - Fetches podcast RSS feed
     - Downloads episode transcripts
     - Writes text files to S3 KB Content Bucket (`podcasts/` prefix)
   - EventBridge triggers KB Sync Handler with `{ source_type: 'all' }`
     - Starts ingestion jobs for all data sources (web, PDF, podcast)
     - Bedrock processes new S3 content, generates embeddings, updates vector store

**Manual Sync (Admin Dashboard)**
1. Admin clicks "Sync Now" button in PDF Manager
2. Frontend sends POST request to Admin Handler with `{ action: 'sync' }`
3. Admin Handler calls Bedrock `StartIngestionJob` API for PDF data source
4. Returns job ID and status
5. Frontend displays sync status notification

---

## Architectural Decision Records (ADRs)

### ADR 1: Bedrock Knowledge Base vs Manual RAG

**Decision Date**: 2024-01-15

**Context**: The chatbot requires retrieval-augmented generation (RAG) to answer questions about museum content. Two approaches were considered:
1. Manual RAG: Self-managed OpenSearch Serverless cluster, custom embedding pipeline, manual chunking/indexing
2. Bedrock Knowledge Base: Fully managed RAG service with built-in embeddings, chunking, and vector store

**Decision**: Use Bedrock Knowledge Base for managed RAG

**Rationale**:
- **Cost reduction**: 63% lower monthly cost ($420 vs $1,140)
  - No OpenSearch Serverless cluster provisioning ($600/month baseline)
  - Pay-per-use embeddings and retrieval
- **Code simplification**: 70% less code
  - No custom embedding pipeline
  - No manual chunking logic
  - No vector store management
- **Operational simplicity**: Zero infrastructure management
  - Automatic scaling
  - Built-in monitoring
  - Managed updates
- **Feature completeness**: Built-in web crawlers, S3 integration, hybrid search

**Alternatives Considered**:
- **Manual RAG with OpenSearch Serverless**: Rejected due to high cost and operational complexity
- **Pinecone/Weaviate**: Rejected due to vendor lock-in and data residency concerns

**Consequences**:
- ✅ Significant cost savings
- ✅ Faster development and deployment
- ✅ Reduced operational burden
- ⚠️ Less control over embedding model (limited to Titan Embeddings v2)
- ⚠️ Vendor lock-in to AWS Bedrock

**Implementation**: See `backend/lib/backend-stack.ts` lines 120-280 (Knowledge Base configuration)

---

### ADR 2: Lambda Function URLs vs API Gateway

**Decision Date**: 2024-01-18

**Context**: The chatbot requires HTTP endpoints for frontend-backend communication. Two approaches were considered:
1. API Gateway REST API with Lambda integration
2. Lambda Function URLs with built-in CORS

**Decision**: Use Lambda Function URLs

**Rationale**:
- **Simpler architecture**: Direct Lambda invocation without API Gateway layer
- **Lower cost**: No API Gateway charges ($3.50 per million requests)
- **Built-in CORS**: Native CORS support without custom configuration
- **Sufficient features**: No need for API Gateway features (throttling, caching, request validation)
- **Lower latency**: One less network hop

**Alternatives Considered**:
- **API Gateway REST API**: Rejected due to added complexity and cost for minimal benefit
- **API Gateway HTTP API**: Considered but Function URLs are simpler for this use case

**Consequences**:
- ✅ Simpler deployment (fewer resources)
- ✅ Lower cost
- ✅ Easier CORS configuration
- ⚠️ No built-in throttling (must implement in Lambda)
- ⚠️ No request validation (must implement in Lambda)
- ⚠️ No API key management (using Cognito JWT for admin endpoints)

**Implementation**: See `backend/lib/backend-stack.ts` lines 450-465, 680-695 (Function URL configuration)

---

### ADR 3: CloudWatch Logs Insights vs Custom Analytics Database

**Decision Date**: 2024-01-20

**Context**: The admin dashboard requires analytics (FAQ extraction, feedback stats, conversation trends). Two approaches were considered:
1. Custom analytics database (DynamoDB aggregation tables or RDS)
2. CloudWatch Logs Insights queries on existing logs

**Decision**: Use CloudWatch Logs Insights for analytics

**Rationale**:
- **No additional infrastructure**: Leverages existing CloudWatch Logs
- **Flexible queries**: SQL-like query language for ad-hoc analysis
- **Cost-effective**: Pay-per-query pricing ($0.005 per GB scanned)
- **Real-time**: No ETL pipeline or batch processing delay
- **Sufficient performance**: Query latency acceptable for admin dashboard (2-5 seconds)

**Alternatives Considered**:
- **DynamoDB aggregation tables**: Rejected due to added complexity (ETL pipeline, Lambda triggers)
- **Amazon Athena on S3**: Rejected due to higher cost and slower queries
- **RDS with analytics views**: Rejected due to provisioning cost and operational overhead

**Consequences**:
- ✅ Zero additional infrastructure
- ✅ Flexible ad-hoc queries
- ✅ Lower cost for low query volume
- ⚠️ Query latency (2-5 seconds) - acceptable for admin use
- ⚠️ Cost scales with log volume (mitigated by 30-day retention)

**Implementation**: See `backend/lambda/admin-handler/index.py` lines 150-200 (Logs Insights queries)

---

### ADR 4: Managed Vector Store vs Self-Hosted OpenSearch

**Decision Date**: 2024-01-15

**Context**: The Knowledge Base requires a vector store for embeddings. Two approaches were considered:
1. Self-hosted OpenSearch Serverless cluster (manual provisioning)
2. Bedrock Knowledge Base managed vector store (automatic provisioning)

**Decision**: Use Bedrock Knowledge Base managed vector store

**Rationale**:
- **Operational simplicity**: Zero cluster management
- **Automatic scaling**: Scales with data volume and query load
- **Cost-effective**: No baseline provisioning cost
- **Integrated**: Seamless integration with Bedrock Knowledge Base
- **Secure**: Automatic encryption, IAM integration

**Alternatives Considered**:
- **Self-hosted OpenSearch Serverless**: Rejected due to $600/month baseline cost and operational complexity
- **Pinecone**: Rejected due to data residency concerns and vendor lock-in

**Consequences**:
- ✅ Zero operational overhead
- ✅ Automatic scaling
- ✅ Lower cost
- ⚠️ Less visibility into vector store internals
- ⚠️ Limited customization (index settings, search algorithms)

**Implementation**: See `backend/lib/backend-stack.ts` lines 150-180 (Knowledge Base storage configuration)

---

### ADR 5: Dynamic Lambda Architecture Detection

**Decision Date**: 2024-01-22

**Context**: Development team uses both Apple Silicon (ARM64) and Intel (x86_64) Macs. Lambda functions must be compatible with both architectures.

**Decision**: Dynamically detect host architecture and set Lambda architecture accordingly

**Rationale**:
- **Developer experience**: Supports both ARM64 and x86_64 development environments
- **No manual configuration**: Automatic detection eliminates deployment errors
- **Cost optimization**: ARM64 (Graviton2) is 20% cheaper than x86_64

**Alternatives Considered**:
- **Hardcode ARM64**: Rejected - breaks Intel Mac developers (Docker emulation is slow)
- **Hardcode x86_64**: Rejected - misses cost savings and performance benefits of ARM64

**Consequences**:
- ✅ Supports all developer environments
- ✅ Cost optimization on ARM64
- ⚠️ Requires Node.js `os` module in CDK

**Implementation**: See `backend/lib/backend-stack.ts` lines 400-402

```typescript
// ADR: Lambda architecture detection for ARM64/x86_64 compatibility
// Rationale: Supports development on both Apple Silicon and Intel Macs
// Alternative: Hardcode ARM64 (rejected - breaks Intel Mac developers)
const hostArch = os.arch();
const lambdaArch = hostArch === "arm64" ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;
```

---

## Cost Breakdown

**Monthly Cost Estimate**: ~$420/month (based on 10,000 conversations/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Bedrock Knowledge Base** | 10K retrievals, 4 data sources | $120 |
| **Bedrock Claude 3 Sonnet** | 10K invocations (500K input + 200K output tokens) | $180 |
| **Lambda** | 15K invocations, 512MB, 10s avg duration | $15 |
| **DynamoDB** | 10K writes, 5K reads, 1GB storage | $5 |
| **S3** | 10GB storage, 50K requests | $5 |
| **CloudWatch** | 5GB logs, 10 alarms, 100 metrics | $10 |
| **Cognito** | 100 admin MAUs | $5 |
| **Amplify** | 1 app, 100GB bandwidth | $80 |
| **Total** | | **~$420/month** |

**Cost Comparison**:
- Manual RAG approach: ~$1,140/month (63% more expensive)
- Savings: $720/month = $8,640/year

---

## Security Considerations

### Data Protection
- **Encryption at rest**: All DynamoDB tables and S3 buckets use AWS managed encryption
- **Encryption in transit**: HTTPS enforced on all endpoints (Function URLs, Amplify)
- **PII redaction**: Conversation logs redact PII before storage (email, phone, SSN patterns)

### Access Control
- **IAM least privilege**: Lambda functions have minimal required permissions (CDK grant methods)
- **Cognito authentication**: Admin dashboard requires JWT token validation
- **User groups**: Role-based access (Admin vs Viewer)

### Network Security
- **CORS**: Restricted to localhost + Amplify URL (no wildcard origins)
- **SSL enforcement**: S3 buckets reject non-HTTPS requests
- **Function URL auth**: Public for chat (no sensitive data), JWT for admin

### Monitoring
- **CloudWatch Alarms**: Detect anomalies (error spikes, throttling)
- **Structured logging**: JSON logs for security event analysis
- **Audit trail**: All admin actions logged with user identity

---

## Performance Characteristics

### Latency
- **Chat response**: 2-5 seconds (Bedrock retrieval + generation)
- **Admin queries**: 1-3 seconds (DynamoDB queries)
- **FAQ analytics**: 3-7 seconds (CloudWatch Logs Insights)
- **PDF upload**: 5-15 seconds (S3 upload + KB sync trigger)

### Throughput
- **Chat API**: 1,000 concurrent requests (Lambda concurrency limit)
- **Bedrock**: 100 requests/second (default quota, can increase)
- **DynamoDB**: Unlimited (on-demand scaling)

### Scalability
- **Horizontal**: Lambda auto-scales to 1,000 concurrent executions
- **Vertical**: Bedrock Knowledge Base auto-scales vector store
- **Data**: DynamoDB and S3 scale to petabytes

---

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery (restore to any second in last 35 days)
- **S3**: Versioning enabled on PDF bucket (recover deleted/overwritten files)
- **Code**: GitHub repository with version control

### Recovery Procedures
1. **Lambda failure**: Automatic retry (3 attempts), dead-letter queue for manual review
2. **DynamoDB corruption**: Restore from point-in-time backup
3. **S3 data loss**: Restore from version history
4. **Complete stack failure**: Redeploy from CDK code (`cdk deploy`)

### RTO/RPO
- **Recovery Time Objective (RTO)**: 1 hour (time to redeploy stack)
- **Recovery Point Objective (RPO)**: 5 minutes (DynamoDB point-in-time recovery granularity)

---

## Future Enhancements

### Planned Features
1. **Voice interface**: Integrate Amazon Polly for text-to-speech responses
2. **Mobile app**: React Native app with offline support
3. **Additional languages**: French, German, Mandarin support
4. **Advanced analytics**: Conversation sentiment analysis, topic clustering
5. **Proactive notifications**: Event reminders, exhibit recommendations

### Technical Improvements
1. **Caching layer**: ElastiCache for frequently asked questions
2. **A/B testing**: Multiple prompt variants for response quality optimization
3. **Fine-tuned model**: Custom Claude model trained on museum-specific content
4. **Real-time sync**: EventBridge Pipes for instant content updates

---

## Conclusion

The CincyMuse chatbot architecture leverages AWS serverless services to deliver a cost-effective, scalable, and maintainable solution. The use of Bedrock Knowledge Base for managed RAG reduces operational complexity while maintaining high response quality. The architecture supports bilingual conversations, admin analytics, and automatic content synchronization with minimal infrastructure management.

For deployment instructions, see [Deployment Guide](./deploymentGuide.md).  
For usage instructions, see [User Guide](./userGuide.md).  
For API details, see [API Documentation](./APIDoc.md).
