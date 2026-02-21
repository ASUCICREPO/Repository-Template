# CincyMuse Chatbot API Documentation

This document provides comprehensive API documentation for the CincyMuse chatbot system.

---

## Overview

The CincyMuse chatbot exposes two Lambda Function URLs for API access:

1. **Chat API**: Public endpoint for user interactions (chat messages, feedback)
2. **Admin API**: Authenticated endpoint for dashboard operations (logs, PDFs, analytics)

**Architecture**: Lambda Function URLs (no API Gateway) with CORS support for web clients.

---

## Base URLs

### Chat API
```
https://[CHAT_FUNCTION_ID].lambda-url.[REGION].on.aws/
```

**Example**:
```
https://abc123def456.lambda-url.us-east-1.on.aws/
```

### Admin API
```
https://[ADMIN_FUNCTION_ID].lambda-url.[REGION].on.aws/
```

**Example**:
```
https://xyz789ghi012.lambda-url.us-east-1.on.aws/
```

> **Note**: Actual Function URLs are provided in CloudFormation stack outputs after deployment. See `ChatFunctionUrl` and `AdminFunctionUrl` outputs.

---

## Authentication

### Chat API
- **Authentication**: None required (public endpoint)
- **Rate Limiting**: Enforced at Lambda level (100 requests/minute per IP)

### Admin API
- **Authentication**: Cognito JWT token required
- **Authorization**: Role-based access control (Admin/Viewer)
- **Header Format**: `Authorization: Bearer <JWT_TOKEN>`

#### Obtaining JWT Token

Use AWS Amplify Auth or Cognito SDK to authenticate:

```typescript
import { Auth } from 'aws-amplify';

const user = await Auth.signIn(email, password);
const jwtToken = user.signInUserSession.idToken.jwtToken;
```

---

## Common Headers

### Request Headers
| Header | Description | Required |
|--------|-------------|----------|
| `Content-Type` | `application/json` | Yes (for POST) |
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes (Admin API only) |

### Response Headers
All responses include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

---

## 1) Chat Endpoints

Public endpoints for user interactions with the chatbot.

---

### POST / — Send Chat Message

Send a user question and receive an AI-generated response with source citations.

**Purpose**: Process user questions using Bedrock Knowledge Base RetrieveAndGenerate API.

**Request Body**:
```json
{
  "message": "string - User's question (1-1000 characters)",
  "language": "string - 'en' or 'es'",
  "conversationId": "string - Optional UUID for conversation context"
}
```

**Example Request**:
```json
{
  "message": "What are the museum hours?",
  "language": "en"
}
```

**Response**:
```json
{
  "conversationId": "string - UUID for this conversation",
  "response": "string - AI-generated response",
  "sources": [
    {
      "title": "string - Source document title",
      "url": "string - Source URL",
      "type": "string - 'website' | 'collection' | 'event' | 'podcast' | 'pdf'"
    }
  ],
  "confidence": "number - Confidence score (0.0-1.0)"
}
```

**Example Response**:
```json
{
  "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "response": "The Cincinnati Museum Center is open Tuesday through Sunday from 10:00 AM to 5:00 PM. We are closed on Mondays. Extended hours until 8:00 PM on Thursdays.",
  "sources": [
    {
      "title": "Hours & Admission",
      "url": "https://www.cincymuseum.org/hours",
      "type": "website"
    }
  ],
  "confidence": 0.92
}
```

**Low Confidence Response** (confidence < 0.7):
```json
{
  "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "response": "You've asked a great question, but it's one I don't have the details for just yet. For the most accurate information, please contact our team at (513) 287-7000.",
  "sources": [],
  "confidence": 0.45
}
```

**Status Codes**:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid input (empty message, invalid language, message too long)
- `500 Internal Server Error` - Bedrock API error or system failure

**Error Response**:
```json
{
  "error": "string - Error message"
}
```

---

### POST / — Submit Feedback

Submit user feedback (thumbs up/down) for a conversation.

**Purpose**: Record user satisfaction with chatbot responses for quality monitoring.

**Request Body**:
```json
{
  "action": "feedback",
  "conversationId": "string - UUID from chat response",
  "rating": "string - 'positive' or 'negative'"
}
```

**Example Request**:
```json
{
  "action": "feedback",
  "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rating": "positive"
}
```

**Response**:
```json
{
  "message": "Feedback recorded"
}
```

**Status Codes**:
- `200 OK` - Feedback recorded successfully
- `400 Bad Request` - Missing conversationId or invalid rating
- `500 Internal Server Error` - Database error

---

### OPTIONS / — CORS Preflight

Handle CORS preflight requests from browsers.

**Purpose**: Allow cross-origin requests from frontend applications.

**Response**:
```json
{
  "message": "OK"
}
```

**Status Codes**:
- `200 OK` - CORS preflight successful

---

## 2) Admin Endpoints

Authenticated endpoints for admin dashboard operations.

**Authentication Required**: All admin endpoints require a valid Cognito JWT token in the `Authorization` header.

---

### GET /conversations — Query Conversation Logs

Retrieve conversation logs with optional filters.

**Purpose**: View and analyze user interactions for quality monitoring and insights.

**Authorization**: Admin or Viewer role

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string (ISO 8601) | No | Filter conversations after this date |
| `endDate` | string (ISO 8601) | No | Filter conversations before this date |
| `language` | string | No | Filter by language ('en' or 'es') |
| `minConfidence` | number | No | Filter by minimum confidence score (0.0-1.0) |
| `feedback` | string | No | Filter by feedback ('positive' or 'negative') |
| `limit` | number | No | Max results to return (default 50, max 500) |
| `nextToken` | string | No | Pagination token from previous response |

**Example Request**:
```
GET /conversations?language=en&minConfidence=0.7&limit=100
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "conversations": [
    {
      "conversationId": "string - UUID",
      "timestamp": "string - ISO 8601 timestamp",
      "question": "string - User's question (PII redacted)",
      "response": "string - Chatbot's response",
      "language": "string - 'en' or 'es'",
      "confidence": "string - Confidence score",
      "sources": [
        {
          "title": "string",
          "url": "string",
          "type": "string"
        }
      ],
      "feedback": "string - 'positive' | 'negative' (optional)"
    }
  ],
  "count": "number - Number of conversations returned",
  "nextToken": "string - Pagination token (optional)"
}
```

**Example Response**:
```json
{
  "conversations": [
    {
      "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "timestamp": "2024-01-15T14:30:00.000Z",
      "question": "What exhibits are currently on display?",
      "response": "Currently, we have three major exhibits...",
      "language": "en",
      "confidence": "0.88",
      "sources": [
        {
          "title": "Current Exhibits",
          "url": "https://www.cincymuseum.org/exhibits",
          "type": "website"
        }
      ],
      "feedback": "positive"
    }
  ],
  "count": 1
}
```

**Status Codes**:
- `200 OK` - Query successful
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Database query error

---

### GET /pdfs — List PDF Documents

Retrieve list of all uploaded PDF documents.

**Purpose**: View customer service documents in the knowledge base.

**Authorization**: Admin or Viewer role

**Response**:
```json
{
  "pdfs": [
    {
      "pdfId": "string - UUID",
      "filename": "string - Original filename",
      "s3Key": "string - S3 object key",
      "uploadDate": "string - ISO 8601 timestamp",
      "fileSize": "number - File size in bytes",
      "status": "string - 'processing' | 'indexed' | 'error'",
      "uploadedBy": "string - Cognito user ID"
    }
  ]
}
```

**Example Response**:
```json
{
  "pdfs": [
    {
      "pdfId": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
      "filename": "membership-faq.pdf",
      "s3Key": "customer-service/b2c3d4e5-f6g7-8901-bcde-f12345678901-membership-faq.pdf",
      "uploadDate": "2024-01-10T09:15:00.000Z",
      "fileSize": 245760,
      "status": "indexed",
      "uploadedBy": "us-east-1:abc123-def456-ghi789"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Query successful
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Database query error

---

### POST /pdfs — Upload PDF Document

Upload a new PDF document to the knowledge base.

**Purpose**: Add customer service documents for the chatbot to reference.

**Authorization**: Admin role only (Viewer role returns 403)

**Request Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
- `file`: PDF file (max 10MB)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | No | Original filename (default: 'document.pdf') |

**Example Request** (using cURL):
```bash
curl -X POST "https://xyz789.lambda-url.us-east-1.on.aws/pdfs?filename=ticket-policy.pdf" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@ticket-policy.pdf"
```

**Response**:
```json
{
  "pdfId": "string - UUID",
  "filename": "string - Filename",
  "status": "processing",
  "uploadDate": "string - ISO 8601 timestamp"
}
```

**Example Response**:
```json
{
  "pdfId": "c3d4e5f6-g7h8-9012-cdef-g23456789012",
  "filename": "ticket-policy.pdf",
  "status": "processing",
  "uploadDate": "2024-01-15T16:45:00.000Z"
}
```

**Status Codes**:
- `200 OK` - Upload successful, processing started
- `400 Bad Request` - File too large or invalid format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User lacks Admin role
- `500 Internal Server Error` - S3 upload error

**Notes**:
- PDF processing is asynchronous. Check status via GET /pdfs
- Knowledge Base sync is triggered automatically after upload
- Indexing typically completes within 5-10 minutes

---

### DELETE /pdfs/{pdfId} — Delete PDF Document

Delete a PDF document from the knowledge base.

**Purpose**: Remove outdated or incorrect customer service documents.

**Authorization**: Admin role only (Viewer role returns 403)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `pdfId` | string | UUID of the PDF to delete |

**Example Request**:
```
DELETE /pdfs/c3d4e5f6-g7h8-9012-cdef-g23456789012
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "status": "success",
  "message": "PDF deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Deletion successful
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User lacks Admin role
- `404 Not Found` - PDF with specified ID does not exist
- `500 Internal Server Error` - S3 deletion error

**Notes**:
- Knowledge Base sync is triggered automatically after deletion
- Embeddings are removed from the index within 5 minutes

---

### GET /analytics/faqs — Get FAQ Analytics

Retrieve frequently asked questions with statistics.

**Purpose**: Identify common user questions and knowledge gaps.

**Authorization**: Admin or Viewer role

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | Response format ('json' or 'csv') |

**Example Request**:
```
GET /analytics/faqs
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (JSON format):
```json
{
  "faqs": [
    {
      "question": "string - Representative question",
      "count": "number - Number of times asked",
      "avgConfidence": "number - Average confidence score",
      "category": "string - Question category"
    }
  ]
}
```

**Example Response**:
```json
{
  "faqs": [
    {
      "question": "What are the museum hours?",
      "count": 127,
      "avgConfidence": 0.91,
      "category": "Tickets & Hours"
    },
    {
      "question": "How much are tickets?",
      "count": 98,
      "avgConfidence": 0.88,
      "category": "Tickets & Hours"
    },
    {
      "question": "What exhibits are currently on display?",
      "count": 76,
      "avgConfidence": 0.85,
      "category": "Exhibits & Collections"
    }
  ]
}
```

**CSV Export**:
```
GET /analytics/faqs?format=csv
```

Returns CSV file with headers: `question,count,avgConfidence,category`

**Status Codes**:
- `200 OK` - Query successful
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - CloudWatch Logs Insights query error

**Notes**:
- FAQs are generated from last 30 days of conversation logs
- Questions are grouped by semantic similarity
- Returns top 20 most frequently asked questions

---

### GET /analytics/feedback — Get Feedback Statistics

Retrieve feedback statistics and optionally list negative feedback conversations.

**Purpose**: Monitor user satisfaction and identify problematic responses.

**Authorization**: Admin or Viewer role

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `negativeOnly` | boolean | No | Include list of negative feedback conversations |

**Example Request**:
```
GET /analytics/feedback?negativeOnly=true
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "totalResponses": "number - Total responses with feedback",
  "positiveCount": "number - Positive feedback count",
  "negativeCount": "number - Negative feedback count",
  "negativeConversations": [
    {
      "conversationId": "string",
      "timestamp": "string",
      "question": "string",
      "response": "string",
      "confidence": "string"
    }
  ]
}
```

**Example Response**:
```json
{
  "totalResponses": 450,
  "positiveCount": 398,
  "negativeCount": 52,
  "negativeConversations": [
    {
      "conversationId": "d4e5f6g7-h8i9-0123-defg-h34567890123",
      "timestamp": "2024-01-15T11:20:00.000Z",
      "question": "Do you have dinosaur fossils?",
      "response": "You've asked a great question, but it's one I don't have the details for just yet...",
      "confidence": "0.42"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Query successful
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Database query error

---

### GET /analytics/metrics — Get System Health Metrics

Retrieve system health metrics from CloudWatch.

**Purpose**: Monitor chatbot performance and reliability.

**Authorization**: Admin or Viewer role

**Example Request**:
```
GET /analytics/metrics
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "avgResponseTime": "number - Average response time in milliseconds (last 24 hours)",
  "maxResponseTime": "number - Maximum response time in milliseconds (last 24 hours)",
  "errorRate": "number - Error rate percentage (last 24 hours)",
  "totalRequests": "number - Total requests (last 24 hours)"
}
```

**Example Response**:
```json
{
  "avgResponseTime": 1847.32,
  "maxResponseTime": 4521.18,
  "errorRate": 1.2,
  "totalRequests": 1247
}
```

**Status Codes**:
- `200 OK` - Query successful
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - CloudWatch API error

---

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    "data": "..."
  }
}
```

### Error Response
```json
{
  "statusCode": 400 | 401 | 403 | 404 | 500,
  "body": {
    "error": "Error message describing what went wrong"
  }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `400` | Bad Request | Invalid request parameters or body |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | User lacks required permissions (Admin role) |
| `404` | Not Found | Requested resource does not exist |
| `500` | Internal Server Error | Server-side error (Bedrock, DynamoDB, S3) |

---

## Rate Limiting

**Chat API**:
- Limit: 100 requests per minute per IP address
- Enforcement: Lambda-level throttling
- Response: 429 Too Many Requests (if exceeded)

**Admin API**:
- Limit: No explicit rate limit (protected by authentication)
- Cognito session timeout: 30 minutes

---

## SDK / Client Examples

### JavaScript/TypeScript

```typescript
// Chat API - Send message
const chatResponse = await fetch('https://abc123.lambda-url.us-east-1.on.aws/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are the museum hours?',
    language: 'en',
  }),
});

const chatData = await chatResponse.json();
console.log(chatData.response);

// Admin API - Get conversations
const adminResponse = await fetch('https://xyz789.lambda-url.us-east-1.on.aws/conversations?limit=50', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});

const conversations = await adminResponse.json();
```

### Python

```python
import requests

# Chat API - Send message
chat_url = 'https://abc123.lambda-url.us-east-1.on.aws/'
response = requests.post(
    chat_url,
    headers={'Content-Type': 'application/json'},
    json={
        'message': 'What are the museum hours?',
        'language': 'en',
    }
)

data = response.json()
print(data['response'])

# Admin API - Get conversations
admin_url = 'https://xyz789.lambda-url.us-east-1.on.aws/conversations'
response = requests.get(
    admin_url,
    headers={'Authorization': f'Bearer {jwt_token}'},
    params={'limit': 50}
)

conversations = response.json()
```

### cURL

```bash
# Chat API - Send message
curl -X POST 'https://abc123.lambda-url.us-east-1.on.aws/' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What are the museum hours?",
    "language": "en"
  }'

# Admin API - Get conversations
curl -X GET 'https://xyz789.lambda-url.us-east-1.on.aws/conversations?limit=50' \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'

# Admin API - Upload PDF
curl -X POST 'https://xyz789.lambda-url.us-east-1.on.aws/pdfs?filename=policy.pdf' \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'file=@policy.pdf'
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial API release with chat and admin endpoints |

---

## Support

For API-related issues or questions:
- **Technical Support**: Contact Cincinnati Museum Center IT team
- **Documentation**: See [Architecture Deep Dive](./architectureDeepDive.md) for implementation details
- **Deployment**: See [Deployment Guide](./deploymentGuide.md) for setup instructions
