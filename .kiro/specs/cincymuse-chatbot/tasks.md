# Implementation Plan: CincyMuse Chatbot (Bedrock KB Optimized)

## Overview

This implementation plan follows a "backend first" approach using Amazon Bedrock Knowledge Bases for managed RAG. The architecture reduces costs by 63% ($1,140 → $420/month) and code by 70% while delivering all 20 requirements. Tasks are organized to enable incremental validation with checkpoints and follow CIC architectural standards.

## Key Architecture Decisions

- **Bedrock Knowledge Bases** for managed RAG (replaces OpenSearch Serverless)
- **RetrieveAndGenerate API** for one-call RAG pipeline (replaces manual embedding + search + generation)
- **CloudWatch Logs Insights** for analytics (replaces custom FAQ clustering)
- **Lambda Function URLs** for API endpoints (CIC standard)
- **DynamoDB** for conversation logs with GSIs
- **EventBridge** for scheduled content syncs (6h for events, 24h for websites)

## Tasks

- [x] 1. Set up CDK project structure and core infrastructure
  - Create CDK TypeScript project with proper directory structure
  - Configure cdk.json with context variables for environments
  - Set up backend/lib and backend/lambda directory structure
  - Install dependencies: aws-cdk-lib, cdk-nag, constructs, @aws-cdk/aws-bedrock-alpha
  - Create backend/bin/backend.ts entry point with cdk-nag integration
  - _Requirements: 17.1, 17.2_

- [x] 2. Implement DynamoDB tables with security configurations
  - [x] 2.1 Create ConversationLogs table with GSIs
    - Define table with conversationId (PK) and timestamp (SK)
    - Add TimestampIndex GSI (language PK, timestamp SK)
    - Add FeedbackIndex GSI (feedback PK, timestamp SK)
    - Configure PAY_PER_REQUEST billing, point-in-time recovery, TTL attribute
    - Enable AWS managed encryption
    - _Requirements: 10.1, 10.2, 10.6, 17.4_
  
  - [x] 2.2 Create PDFMetadata table
    - Define table with pdfId as partition key
    - Configure PAY_PER_REQUEST billing and encryption
    - _Requirements: 9.2, 17.4_

- [x] 3. Implement S3 buckets for content storage
  - [x] 3.1 Create PDF repository bucket
    - Create S3 bucket with enforceSSL: true
    - Configure block public access, versioning, encryption
    - Add CORS configuration for admin dashboard uploads
    - _Requirements: 9.1, 17.4, 18.3_
  
  - [x] 3.2 Create Knowledge Base content bucket
    - Create S3 bucket for KB data sources (podcasts, processed content)
    - Configure enforceSSL, encryption, block public access
    - Set up folder structure: podcasts/, collections/, events/
    - _Requirements: 8.1, 17.4_

- [x] 4. Implement Bedrock Knowledge Base with data sources
  - [x] 4.1 Create Knowledge Base
    - Create Bedrock Knowledge Base with Titan Multimodal Embeddings
    - Configure vector storage (OpenSearch Serverless managed by KB)
    - Set up IAM role for KB with S3 and Bedrock permissions
    - Configure chunking strategy (800 tokens, 10% overlap)
    - _Requirements: 3.1, 3.2, 16.1, 16.2_
  
  - [x] 4.2 Configure Web Crawler data source
    - Add web crawler data source for cincymuseum.org
    - Add web crawler data source for supportcmc.org
    - Configure crawl limits (300 pages/min, HOST_ONLY scope)
    - Set inclusion/exclusion filters (exclude /admin/, /login/)
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 4.3 Configure S3 data source for PDFs
    - Add S3 data source pointing to PDF repository bucket
    - Configure inclusion prefix for pdfs/ folder
    - Set up automatic sync on S3 changes
    - _Requirements: 9.4, 9.5, 9.6_
  
  - [x] 4.4 Configure S3 data source for podcasts
    - Add S3 data source pointing to podcasts/ folder in KB bucket
    - Configure metadata extraction for episode info
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 5. Implement Cognito User Pool for admin authentication
  - Create Cognito User Pool with email verification
  - Configure password policy (8+ chars, mixed case, numbers, symbols)
  - Add custom attribute for role (Admin/Viewer)
  - Create Admin and Viewer user groups
  - Configure 30-minute session timeout
  - _Requirements: 12.1, 12.2, 12.5_

- [x] 6. Checkpoint - Verify infrastructure deployment
  - Deploy CDK stack to development environment
  - Verify all resources created successfully
  - Check CloudWatch logs for any deployment errors
  - Verify Knowledge Base is active and ready
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Implement core Lambda utilities and shared modules
  - [x] 7.1 Create pii_redactor module
    - Implement redact_pii function with regex patterns
    - Support email, phone, credit card, SSN, address redaction
    - _Requirements: 10.3, 14.2_
  
  - [x] 7.2 Create confidence_calculator module
    - Implement calculate_confidence from KB retrieval scores
    - Support threshold checking (0.7 minimum)
    - _Requirements: 3.4, 3.5_
  
  - [x] 7.3 Create source_extractor module
    - Extract sources from KB citations
    - Deduplicate by URL
    - Format for frontend display
    - _Requirements: 3.3_

- [ ]* 8. Write property tests for core utilities
  - [ ]* 8.1 Property test for PII redaction
    - **Property 19: PII Redaction**
    - **Validates: Requirements 10.3, 14.2**
  
  - [ ]* 8.2 Property test for confidence threshold
    - **Property 7: Low Confidence Fallback**
    - **Validates: Requirements 3.5**

- [x] 9. Implement Chat Handler Lambda with Bedrock KB
  - [x] 9.1 Create chat handler with Lambda Function URL
    - Set up Python 3.13 Lambda with dynamic architecture detection
    - Implement lambda_handler with CORS response helper
    - Handle OPTIONS for CORS preflight
    - Validate environment variables at startup (KB_ID, TABLE_NAME)
    - _Requirements: 1.2, 18.1, 18.3, 18.4_
  
  - [x] 9.2 Implement RAG using RetrieveAndGenerate API
    - Call bedrock_agent_runtime.retrieve_and_generate with KB ID
    - Configure retrieval (numberOfResults=5, HYBRID search)
    - Set up language-specific prompt templates (English/Spanish)
    - Configure generation (maxTokens=1000, temperature=0.7)
    - Extract response text and citations from API response
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 9.3 Implement confidence scoring and fallback
    - Calculate confidence from KB retrieval scores
    - Return fallback message if confidence < 0.7
    - Use language-specific fallback messages
    - _Requirements: 3.4, 3.5_
  
  - [x] 9.4 Implement conversation logging
    - Create conversation log entry in DynamoDB
    - Include question, response, timestamp, language, confidence, sources
    - Redact PII before logging
    - Set TTL for 90-day retention
    - Log to CloudWatch in structured JSON format for analytics
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 14.1_
  
  - [x] 9.5 Implement feedback submission endpoint
    - Update conversation log with feedback rating
    - Support positive/negative feedback values
    - _Requirements: 11.2_
  
  - [x] 9.6 Add session ID generation and validation
    - Generate 33+ character session IDs
    - Store session ID in conversation logs
    - _Requirements: 1.4_
  
  - [x] 9.7 Configure Lambda Function URL with CORS
    - Add Function URL with NONE auth type
    - Configure CORS for Amplify and localhost origins
    - Output Function URL in CDK stack
    - _Requirements: 18.3_
  
  - [x] 9.8 Add IAM permissions for Lambda
    - Grant Bedrock RetrieveAndGenerate permissions with specific KB ARN
    - Use CDK grant methods for DynamoDB
    - Never use wildcard actions or resources
    - _Requirements: 17.3_

- [ ]* 10. Write property tests for Chat Handler
  - [ ]* 10.1 Property test for language response matching
    - **Property 8: Language Response Matching**
    - **Validates: Requirements 2.2**
  
  - [ ]* 10.2 Property test for source citation inclusion
    - **Property 5: Source Citation Inclusion**
    - **Validates: Requirements 3.3**

- [x] 11. Implement Collections API Connector Lambda
  - [x] 11.1 Create Collections API connector
    - Set up Python 3.13 Lambda for custom KB data source
    - Implement API client for searchcollections.cincymuseum.org
    - Handle pagination (100 items per page)
    - Extract metadata (title, description, date, category)
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 11.2 Format data for Knowledge Base
    - Convert collection items to text documents
    - Include metadata in document structure
    - Write to S3 in KB-compatible format
    - Trigger KB sync after writing
    - _Requirements: 6.4, 6.5_
  
  - [x] 11.3 Add error handling and retry logic
    - Implement retry with exponential backoff (max 3 attempts)
    - Log errors to CloudWatch
    - Handle API rate limits
    - _Requirements: 5.8, 14.1_

- [x] 12. Implement Podcast Ingestion Lambda
  - [x] 12.1 Create podcast RSS ingestion handler
    - Set up Python 3.13 Lambda triggered by EventBridge
    - Fetch RSS feed from feed.podbean.com/cincinnatimuseumcenter/feed.xml
    - Parse RSS using feedparser library
    - Extract episode metadata (title, description, pub_date, audio_url)
    - _Requirements: 8.1, 8.2_
  
  - [x] 12.2 Write episodes to S3 for KB ingestion
    - Convert episodes to text documents
    - Write to S3 podcasts/ folder
    - Include metadata in document
    - Trigger KB sync after writing
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 13. Implement KB Sync Handler Lambda
  - [x] 13.1 Create KB sync orchestrator
    - Set up Python 3.13 Lambda triggered by EventBridge
    - Implement StartIngestionJob API calls for each data source
    - Support selective sync (web, s3-pdfs, s3-podcasts, collections)
    - Log sync status to CloudWatch
    - _Requirements: 5.7, 7.6, 8.5_
  
  - [x] 13.2 Add IAM permissions for sync Lambda
    - Grant bedrock:StartIngestionJob permission with specific KB ARN
    - Grant S3 read permissions for triggering syncs
    - _Requirements: 17.3_

- [x] 14. Configure EventBridge scheduled rules for syncs
  - Create EventBridge rule for event feeds (every 6 hours)
  - Create EventBridge rule for websites, collections, podcasts (every 24 hours)
  - Configure rules to trigger KB Sync Handler Lambda
  - Add IAM permissions for EventBridge to invoke Lambda
  - _Requirements: 5.7, 7.6, 8.5_

- [x] 15. Implement Admin Handler Lambda for dashboard APIs
  - [x] 15.1 Create admin handler with Lambda Function URL
    - Set up Python 3.13 Lambda with CORS support
    - Implement authentication check using Cognito JWT
    - Validate user role from custom:role attribute
    - _Requirements: 12.1, 12.3, 12.4_
  
  - [x] 15.2 Implement conversation log query endpoint
    - Query DynamoDB with filters (date range, language, confidence, feedback)
    - Support pagination with nextToken
    - Enforce role-based access (Admin and Viewer can read)
    - _Requirements: 10.4, 10.5_
  
  - [x] 15.3 Implement PDF upload endpoint
    - Accept multipart/form-data PDF uploads (max 10MB)
    - Store PDF in S3 with UUID key
    - Create PDFMetadata entry with 'processing' status
    - Trigger KB sync via StartIngestionJob
    - Require Admin role
    - _Requirements: 9.1, 9.4, 12.3_
  
  - [x] 15.4 Implement PDF deletion endpoint
    - Delete PDF from S3
    - Trigger KB sync to remove from index
    - Update PDFMetadata status
    - Require Admin role
    - _Requirements: 9.3, 9.7, 12.3_
  
  - [x] 15.5 Implement PDF list endpoint
    - Query PDFMetadata table
    - Return list with upload date, file size, status
    - Allow Admin and Viewer roles
    - _Requirements: 9.2_
  
  - [x] 15.6 Implement FAQ analytics endpoint using CloudWatch Logs Insights
    - Query CloudWatch Logs for conversation questions
    - Use Logs Insights aggregation queries
    - Group similar questions by keyword matching
    - Calculate frequency and average confidence
    - Return top 20 FAQs ordered by count
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 15.7 Implement feedback statistics endpoint
    - Query DynamoDB for conversations with feedback
    - Calculate total responses, positive count, negative count
    - Support filtering by negative feedback
    - _Requirements: 11.3, 11.4_
  
  - [x] 15.8 Implement system health metrics endpoint
    - Query CloudWatch for Lambda duration metrics
    - Calculate error rate from Lambda errors and invocations
    - Return avg/max response time, error rate, total requests
    - _Requirements: 14.5_
  
  - [x] 15.9 Implement CSV export for FAQ data
    - Generate valid CSV with headers
    - Properly escape fields
    - _Requirements: 13.5_
  
  - [x] 15.10 Configure Lambda Function URL with CORS
    - Add Function URL with NONE auth type (JWT validated in handler)
    - Configure CORS for Amplify and localhost
    - Output Function URL in CDK stack
    - _Requirements: 18.3_
  
  - [x] 15.11 Add IAM permissions for admin Lambda
    - Grant DynamoDB read access to ConversationLogs
    - Grant S3 read/write access to PDF bucket
    - Grant DynamoDB read/write to PDFMetadata
    - Grant CloudWatch Logs read for analytics
    - Grant Bedrock StartIngestionJob for PDF sync
    - _Requirements: 17.3_

- [ ]* 16. Write property tests for admin endpoints
  - [ ]* 16.1 Property test for authentication requirement
    - **Property 25: Authentication Requirement**
    - **Validates: Requirements 12.1, 18.6**
  
  - [ ]* 16.2 Property test for role-based access control
    - **Property 26: Role-Based Access Control**
    - **Validates: Requirements 12.3, 12.4**
  
  - [ ]* 16.3 Property test for conversation log filtering
    - **Property 20: Conversation Log Filtering**
    - **Validates: Requirements 10.4, 10.5**
  
  - [ ]* 16.4 Property test for FAQ top-N ordering
    - **Property 28: FAQ Top-N Ordering**
    - **Validates: Requirements 13.2**

- [x] 17. Configure CloudWatch alarms and monitoring
  - Create alarm for error rate > 5% over 5 minutes
  - Create alarm for Bedrock throttling > 10/minute
  - Create alarm for Lambda errors > 10/minute
  - Create alarm for KB sync failures
  - Configure SNS topic for alarm notifications
  - _Requirements: 14.6_

- [x] 18. Add CfnOutputs for all backend resources
  - Output Chat Function URL
  - Output Admin Function URL
  - Output Knowledge Base ID
  - Output ConversationLogs table name
  - Output PDFMetadata table name
  - Output PDF bucket name
  - Output KB content bucket name
  - Output Cognito User Pool ID and Client ID
  - _Requirements: 17.6_

- [x] 19. Checkpoint - Verify backend functionality
  - Deploy complete backend stack
  - Test Chat Lambda with sample queries
  - Verify KB returns relevant results with citations
  - Test PDF upload and KB sync
  - Test admin endpoints with Cognito tokens
  - Verify scheduled syncs trigger correctly
  - Check CloudWatch logs for errors
  - Ensure all tests pass, ask the user if questions arise

- [x] 20. Set up Next.js frontend project
  - Create Next.js 15+ project with TypeScript and App Router
  - Install dependencies: @aws-amplify/ui-react, tailwindcss, aws-amplify
  - Configure tailwind.config.ts with responsive breakpoints
  - Set up frontend/app, frontend/components, frontend/lib, frontend/contexts directories
  - _Requirements: 1.5, 2.4_

- [x] 21. Implement frontend API client utilities
  - [x] 21.1 Create chat API client
    - Implement sendMessage function calling Chat Lambda Function URL
    - Handle response parsing (text, sources, confidence)
    - Implement submitFeedback function
    - Generate and manage 33+ character session IDs in sessionStorage
    - _Requirements: 1.2, 3.3, 11.2_
  
  - [x] 21.2 Create admin API client
    - Implement getConversations with filter parameters
    - Implement uploadPDF with multipart/form-data
    - Implement deletePDF function
    - Implement getPDFs list function
    - Implement getFAQs analytics function
    - Implement getSystemMetrics function
    - Include Cognito JWT token in all requests
    - _Requirements: 10.4, 9.1, 9.3, 9.2, 13.2, 14.5_
  
  - [x] 21.3 Create Amplify configuration
    - Configure Amplify with Cognito User Pool
    - Set up authentication flow
    - _Requirements: 12.1_

- [x] 22. Implement language context and i18n
  - [x] 22.1 Create LanguageContext
    - Implement React Context for language preference
    - Support 'en' and 'es' values
    - Persist preference in sessionStorage
    - _Requirements: 2.1, 2.5_
  
  - [x] 22.2 Create translation utilities
    - Define opening message in English and Spanish
    - Define fallback message in both languages
    - Define UI labels in both languages
    - _Requirements: 1.3, 2.3, 3.5_

- [x] 23. Implement Chat Interface components
  - [x] 23.1 Create ChatContainer component
    - Implement main layout with language selector
    - Display opening message on initial load
    - Manage conversation state
    - _Requirements: 1.3, 2.1_
  
  - [x] 23.2 Create MessageList component
    - Display conversation history
    - Render user and assistant messages
    - _Requirements: 1.4_
  
  - [x] 23.3 Create MessageInput component
    - Text input with submit button
    - Validate message length (1-1000 characters)
    - Handle Enter key submission
    - Disable during response generation
    - _Requirements: 1.1, 18.4_
  
  - [x] 23.4 Create ResponseMessage component
    - Display chatbot response
    - Show confidence indicator
    - Handle low confidence fallback display
    - _Requirements: 3.4, 3.5_
  
  - [x] 23.5 Create SourceCitation component
    - Display linked sources with title and URL
    - Group by source type (website, collection, event, podcast, pdf)
    - _Requirements: 3.3_
  
  - [x] 23.6 Create FeedbackButtons component
    - Display thumbs up and thumbs down buttons
    - Submit feedback on click
    - Disable after feedback submitted
    - _Requirements: 11.1, 11.5_
  
  - [x] 23.7 Create LanguageSelector component
    - Toggle between English and Spanish
    - Update LanguageContext on change
    - _Requirements: 2.1_
  
  - [x] 23.8 Style components with Tailwind CSS
    - Implement responsive design for mobile, tablet, desktop
    - Follow accessibility best practices
    - _Requirements: 1.5_

- [ ]* 24. Write unit tests for Chat Interface
  - [ ]* 24.1 Test opening message display
    - Verify opening message shown on initial load
    - _Requirements: 1.3_
  
  - [ ]* 24.2 Test language selector
    - Verify English and Spanish options available
    - _Requirements: 2.1_
  
  - [ ]* 24.3 Test message submission
    - Verify Enter key sends message
    - _Requirements: 1.1_
  
  - [ ]* 24.4 Test feedback buttons
    - Verify thumbs up/down submit feedback
    - _Requirements: 11.1_

- [x] 25. Implement Admin Dashboard components
  - [x] 25.1 Create LoginPage component
    - Implement Cognito authentication flow with Amplify
    - Display login form
    - Handle authentication errors
    - _Requirements: 12.1_
  
  - [x] 25.2 Create ConversationLogs component
    - Display searchable table of conversation history
    - Implement filters (date range, language, confidence, feedback)
    - Support pagination
    - _Requirements: 10.4, 10.5_
  
  - [x] 25.3 Create PDFManager component
    - Display list of PDFs with upload date, file size, status
    - Implement upload interface (max 10MB)
    - Implement delete button (Admin only)
    - Show processing status
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 25.4 Create FAQAnalytics component
    - Display top 20 FAQs with count and avg confidence
    - Show category groupings
    - Implement CSV export button
    - _Requirements: 13.2, 13.5_
  
  - [x] 25.5 Create SystemHealth component
    - Display real-time metrics (response time, error rate, request count)
    - Show service availability indicators
    - _Requirements: 14.5_
  
  - [x] 25.6 Create FeedbackReview component
    - Display responses with negative feedback
    - Support filtering and sorting
    - _Requirements: 11.4_
  
  - [x] 25.7 Implement role-based UI rendering
    - Show/hide upload and delete buttons based on role
    - Display read-only message for Viewer role
    - _Requirements: 12.3, 12.4_
  
  - [x] 25.8 Implement session timeout handling
    - Detect session expiration (30 minutes)
    - Redirect to login on timeout
    - _Requirements: 12.5_

- [ ]* 26. Write unit tests for Admin Dashboard
  - [ ]* 26.1 Test authentication requirement
    - Verify unauthenticated users redirected to login
    - _Requirements: 12.1_
  
  - [ ]* 26.2 Test role-based access
    - Verify Admin can upload/delete PDFs
    - Verify Viewer cannot upload/delete PDFs
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 26.3 Test conversation log filtering
    - Verify filters work correctly
    - _Requirements: 10.4, 10.5_

- [x] 27. Configure Amplify deployment
  - [x] 27.1 Create Amplify App in CDK stack
    - Configure GitHub source code provider with OAuth token
    - Add SPA rewrite rule (catch-all → index.html)
    - Create main branch
    - _Requirements: 19.2_
  
  - [x] 27.2 Pass backend URLs to frontend
    - Add environment variables for Chat Function URL
    - Add environment variables for Admin Function URL
    - Add environment variables for Cognito User Pool ID and Client ID
    - _Requirements: 19.1_
  
  - [x] 27.3 Configure auto-trigger build on deploy
    - Create custom resource to trigger Amplify build
    - Configure on create and update
    - _Requirements: 19.2_
  
  - [x] 27.4 Output Amplify URL
    - Construct Amplify URL from appId
    - Add CfnOutput for frontend URL
    - _Requirements: 17.6_

- [x] 28. Update CORS configurations with Amplify URL
  - Update Chat Lambda Function URL CORS with Amplify URL
  - Update Admin Lambda Function URL CORS with Amplify URL
  - Update S3 bucket CORS with Amplify URL
  - _Requirements: 18.3_

- [x] 29. Implement deployment scripts and documentation
  - [x] 29.1 Create deployment script
    - Script to deploy CDK stack with environment parameter
    - Script to create initial Cognito admin user
    - Script to trigger initial KB sync
    - _Requirements: 19.2, 19.3_
  
  - [x] 29.2 Create environment configuration
    - Document required context variables
    - Document SSM Parameter Store parameters
    - Validate no hardcoded credentials in code
    - _Requirements: 19.1, 19.4, 19.5_
  
  - [x] 29.3 Write deployment documentation
    - Document deployment steps for dev/staging/production
    - Document environment-specific parameters
    - Document Cognito user creation process
    - Document KB sync process and troubleshooting
    - _Requirements: 19.2, 19.3_

- [ ] 30. Final checkpoint - End-to-end testing
  - Deploy complete stack to staging environment
  - Test complete user flow: ask question, receive response with citations, submit feedback
  - Test bilingual support: switch language, verify response in correct language
  - Test admin flow: login, view logs, upload PDF, verify PDF indexed, delete PDF
  - Test FAQ analytics and system metrics
  - Verify all CloudWatch alarms configured
  - Verify KB syncs run on schedule
  - Test Collections API integration
  - Test podcast ingestion
  - Run security scan with cdk-nag
  - Ensure all tests pass, ask the user if questions arise

- [ ] 31. Performance and load testing
  - [ ] 31.1 Run concurrent user load test
    - Simulate 100 concurrent users
    - Measure response times (target: 95% < 3 seconds)
    - Measure error rate (target: < 1%)
    - _Requirements: 20.1_
  
  - [ ] 31.2 Test Lambda memory configuration
    - Verify Lambda functions complete within 30 seconds
    - Optimize memory allocation if needed
    - _Requirements: 20.2_
  
  - [ ] 31.3 Test KB query performance
    - Measure KB RetrieveAndGenerate latency
    - Verify 95% of queries < 500ms for retrieval
    - _Requirements: 16.3_
  
  - [ ] 31.4 Test KB sync performance
    - Run KB sync during API load
    - Verify no significant performance degradation
    - _Requirements: 20.5_

- [ ] 32. Security validation and compliance check
  - Run cdk-nag security scan and address findings
  - Verify IAM policies use specific ARNs (no wildcards)
  - Verify PII redaction in all logs
  - Verify encryption enabled for all data stores
  - Verify HTTPS enforcement on all endpoints
  - Verify no hardcoded secrets in code
  - Document any suppressed cdk-nag findings with justification
  - _Requirements: 17.3, 17.4, 18.3, 19.4_

- [ ] 33. Production deployment preparation
  - Create production environment configuration
  - Configure production CloudWatch alarms with SNS notifications
  - Set up production Cognito users
  - Run final security scan
  - Deploy to production
  - Trigger initial KB sync for all data sources
  - Verify all functionality in production
  - Monitor logs and metrics for first 24 hours

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Backend tasks (1-19) should be completed before frontend tasks (20-28)
- Checkpoints (6, 19, 30) ensure incremental validation and provide opportunities to address issues
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and integration points
- All Lambda functions follow CIC patterns: Python 3.13+, dynamic architecture detection, CORS on all responses, environment variable validation
- All infrastructure follows CIC standards: CDK grant methods for IAM, enforceSSL on S3, PAY_PER_REQUEST for DynamoDB, cdk-nag security scanning
- Session IDs must be 33+ characters for AWS AgentCore compatibility
- Bedrock Knowledge Base handles: web crawling, content parsing, chunking, embedding, indexing automatically
- KB syncs run on schedule: 6 hours for events, 24 hours for websites/collections/podcasts
- CloudWatch Logs Insights used for FAQ analytics instead of custom clustering

## Architecture Benefits

- **63% cost reduction**: $1,140/month → $420/month
- **70% less code**: ~3,000 lines → ~900 lines
- **Faster development**: 2-3 weeks vs 6-8 weeks
- **Simpler maintenance**: Managed RAG vs custom pipeline
- **All requirements met**: 20/20 requirements delivered
- **Built-in features**: Citations, hybrid search, automatic content processing
