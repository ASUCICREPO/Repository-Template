---
name: s3-vectors-rag
description: Build RAG chatbot architectures using S3 Vectors and Amazon Bedrock Knowledge Bases. Triggered by: RAG, S3 Vectors, knowledge base, semantic search, document Q&A, chatbot with retrieval, embeddings.
---

Read `references/spec.md` for the full architecture and CDK patterns.

**When to use this pattern**: semantic search over documents, chatbots with knowledge base retrieval, document Q&A systems.

**Standard architecture**:
1. Documents uploaded to S3 source bucket
2. Bedrock Knowledge Base ingests and creates embeddings
3. Embeddings stored in S3 Vectors index
4. Lambda queries Knowledge Base for retrieval
5. Retrieved context sent to Bedrock model for response generation

**Key CDK requirements**:
- S3 Vectors bucket with vector index (not a standard S3 bucket)
- Bedrock Knowledge Base with S3 data source
- Lambda permissions: `bedrock-agent:Retrieve`, `bedrock:InvokeModel`, `s3:GetObject` on the source bucket
- Ingestion job: manual trigger or event-driven on S3 upload

Use `aws-knowledge-mcp-server` to search for latest S3 Vectors and Bedrock Knowledge Base documentation before implementing — this API is actively evolving.

See `references/spec.md` for CDK construct patterns and retrieval Lambda code.
