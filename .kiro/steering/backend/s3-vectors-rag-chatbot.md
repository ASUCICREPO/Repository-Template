---
inclusion: manual
---

# S3 Vectors RAG Chatbot Patterns

Patterns for Bedrock Knowledge Base + S3 Vectors for RAG projects. Covers S3 Vectors bucket/index setup, Bedrock KB wiring, Lambda retrieval, ingestion patterns, and cdk-nag suppressions.

This is a manual-inclusion steering file. Reference it via `#s3-vectors-rag-chatbot` in chat when working on RAG projects.

## When to Use

- Projects that need semantic search over documents
- Chatbots with knowledge base retrieval
- Document Q&A systems

## Architecture

1. Documents uploaded to S3 source bucket
2. Bedrock Knowledge Base ingests and creates embeddings
3. Embeddings stored in S3 Vectors index
4. Lambda queries Knowledge Base for retrieval
5. Retrieved context sent to Bedrock model for response generation

## Key CDK Patterns

- S3 Vectors bucket with vector index
- Bedrock Knowledge Base with S3 data source
- Lambda with `bedrock-agent:Retrieve` and `bedrock:InvokeModel` permissions
- Ingestion job trigger (manual or event-driven)

## References

Use `aws-knowledge-mcp-server` to search for latest S3 Vectors and Bedrock Knowledge Base documentation.
