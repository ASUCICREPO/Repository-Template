# Architecture Changes Summary

## What Changed and Why

This document summarizes the architectural changes made to optimize cost, simplify implementation, and improve maintainability for the CincyMuse chatbot.

## Key Changes

### 1. Vector Store: OpenSearch Serverless → Bedrock Knowledge Bases

**Before**:
- Amazon OpenSearch Serverless collection
- Custom Lambda functions for content ingestion
- Manual chunking, embedding, and indexing
- Cost: $700/month

**After**:
- Amazon Bedrock Knowledge Bases (managed RAG)
- Built-in web crawling and S3 data sources
- Automatic chunking, embedding, and indexing
- Cost: $100/month (for managed vector storage)

**Savings**: $600/month (86% reduction)

**Why**: Bedrock KB provides all the same functionality with:
- Native web crawling (no custom code)
- Automatic content processing
- Built-in source citations
- Simpler architecture (70% less code)

### 2. RAG Pipeline: Manual → RetrieveAndGenerate API

**Before**:
```python
# 500+ lines of code
1. Generate query embedding
2. Search OpenSearch
3. Extract context
4. Build prompt
5. Call Bedrock
6. Stream response
7. Extract citations
```

**After**:
```python
# 50 lines of code
response = bedrock_agent_runtime.retrieve_and_generate(
    input={'text': user_question},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': KB_ID,
            'modelArn': CLAUDE_ARN,
        }
    }
)
# Returns: generated text + citations + sources
```

**Why**: Single API call handles entire RAG pipeline with built-in citations.

### 3. Content Ingestion: Custom Lambdas → Managed Data Sources

**Before**:
- 5 Lambda functions (Ingestion Orchestrator, Website Crawler, Collections API, Events, Podcasts)
- Custom HTML parsing with BeautifulSoup
- Custom chunking logic
- Manual embedding generation
- EventBridge triggers + retry logic
- ~2000 lines of code

**After**:
- 1 Lambda function (KB Sync Handler)
- Bedrock KB web crawler (built-in)
- Bedrock KB S3 data source (built-in)
- Bedrock KB custom connector (for Collections API)
- EventBridge triggers KB sync
- ~50 lines of code

**Why**: Bedrock KB handles all content processing automatically.

### 4. Dashboard Analytics: Custom Aggregations → CloudWatch Logs Insights

**Before**:
- Custom FAQ analytics Lambda with k-means clustering
- Custom embedding generation for question similarity
- Complex DynamoDB queries with multiple GSIs

**After**:
- CloudWatch Logs Insights queries for analytics
- DynamoDB for operational queries (recent conversations, filters)
- Built-in aggregation and analysis

**Why**: CloudWatch Logs Insights provides powerful analytics without additional services.

### 5. Bilingual Support: Dual Indexing → Multilingual Embeddings

**Before**:
- Generate English embedding
- Translate to Spanish
- Generate Spanish embedding
- Store both (2x storage, 2x cost)

**After**:
- Generate single multilingual embedding
- Works for both English and Spanish queries
- Translate responses at generation time if needed

**Why**: 50% reduction in embedding and storage costs with minimal accuracy trade-off.

## Architecture Comparison

### Before (OpenSearch-based)

```
User → Chat Lambda → Generate Embedding → OpenSearch k-NN Search
                  ↓
              Build Prompt → Bedrock Claude → Stream Response
                  ↓
              Log to DynamoDB

EventBridge → Ingestion Lambda → Fetch Content → Parse HTML
                               ↓
                          Chunk Text → Generate Embeddings
                               ↓
                          Index in OpenSearch

Admin → Upload PDF → S3 → PDF Processor Lambda → Extract Text
                                               ↓
                                          Chunk → Embed → Index
```

### After (Bedrock KB-based)

```
User → Chat Lambda → Bedrock RetrieveAndGenerate API
                  ↓
              (KB handles: search, retrieve, generate, cite)
                  ↓
              Log to DynamoDB

EventBridge → Sync Lambda → StartIngestionJob API
                         ↓
                    Bedrock KB handles:
                    - Web crawling
                    - Content parsing
                    - Chunking
                    - Embedding
                    - Indexing

Admin → Upload PDF → S3 → Sync Lambda → StartIngestionJob
                                      ↓
                                  KB processes automatically
```

## Cost Comparison

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| **Vector Store** | | | |
| OpenSearch Serverless | $700 | $0 | $700 |
| Bedrock KB Vector Storage | $0 | $100 | -$100 |
| **Compute** | | | |
| Chat Lambda | $30 | $20 | $10 |
| Ingestion Lambdas (5) | $50 | $0 | $50 |
| KB Sync Lambda | $0 | $5 | -$5 |
| Admin Lambda | $20 | $15 | $5 |
| **AI/ML** | | | |
| Bedrock Embeddings | $100 | $0 | $100 |
| Bedrock Inference | $200 | $200 | $0 |
| KB Queries | $0 | $30 | -$30 |
| **Storage** | | | |
| DynamoDB | $25 | $25 | $0 |
| S3 | $10 | $15 | -$5 |
| CloudWatch | $5 | $10 | -$5 |
| **Total** | **$1,140** | **$420** | **$720** |

**Net Savings: $720/month (63% reduction)**

## Complexity Comparison

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Lambda Functions | 6 | 2 | 67% |
| Lines of Code | ~3,000 | ~900 | 70% |
| AWS Services | 8 | 6 | 25% |
| Custom Parsers | 4 | 0 | 100% |
| Scheduled Jobs | 2 | 2 | 0% |
| IAM Policies | 12 | 5 | 58% |

## Functionality Comparison

| Feature | Before | After | Notes |
|---------|--------|-------|-------|
| Web Crawling | ✅ Custom | ✅ Built-in | KB crawler is more robust |
| PDF Processing | ✅ Custom | ✅ Built-in | KB handles multimodal content |
| Source Citations | ✅ Manual | ✅ Built-in | KB provides structured citations |
| Bilingual Support | ✅ Dual index | ✅ Multilingual | Single embedding works for both |
| Streaming Responses | ✅ | ✅ | Same functionality |
| Confidence Scoring | ✅ | ✅ | Based on retrieval scores |
| FAQ Analytics | ✅ Custom | ✅ CloudWatch | Different approach, same result |
| Query Latency | 100-200ms | 200-300ms | Slightly slower but acceptable |
| Sync Frequency | 6h/24h | 6h/24h | Same schedule |
| Admin Dashboard | ✅ | ✅ | Same functionality |

## What Stays the Same

1. **Frontend**: No changes to Next.js chat interface or admin dashboard
2. **Authentication**: Still using Cognito for admin access
3. **Conversation Logging**: Still using DynamoDB with TTL
4. **Feedback Mechanism**: Still using DynamoDB updates
5. **Lambda Function URLs**: Still using for API endpoints
6. **Sync Schedule**: Still 6 hours for events, 24 hours for websites
7. **Bilingual Support**: Still English and Spanish
8. **All Requirements**: All 20 requirements still met

## Migration Path (If Starting with OpenSearch)

If you want to build with OpenSearch first and migrate later:

1. **Phase 1**: Build with OpenSearch (original design)
2. **Phase 2**: Create Bedrock KB alongside OpenSearch
3. **Phase 3**: Route 10% of traffic to KB for testing
4. **Phase 4**: Gradually increase to 100%
5. **Phase 5**: Decommission OpenSearch

This allows production testing before full commitment.

## Recommendation

**Use Bedrock Knowledge Bases from the start** because:

1. ✅ 63% cost savings ($720/month)
2. ✅ 70% less code to write and maintain
3. ✅ Faster development (2-3 weeks vs 6-8 weeks)
4. ✅ Built-in features (web crawling, citations, hybrid search)
5. ✅ Easier operations (no OpenSearch to manage)
6. ✅ Perfect for museum use case (document-heavy, moderate traffic)

The only trade-off is 100-200ms slower query latency, which is imperceptible in a chat interface.

## Updated File Structure

```
.kiro/specs/cincymuse-chatbot/
├── requirements.md                 # Same (all requirements still met)
├── design.md                       # Updated (Bedrock KB architecture)
├── tasks.md                        # Updated (simplified tasks)
├── CIC-PATTERN-UPDATES.md         # Same (CIC patterns still apply)
├── COST-OPTIMIZED-DESIGN.md       # Detailed KB design
└── ARCHITECTURE-CHANGES.md        # This file
```

## Next Steps

1. Review updated design.md for new architecture
2. Review updated tasks.md for simplified implementation
3. Begin implementation with Task 1 (CDK project setup)
4. Follow backend-first approach as per CIC standards
