"""
Chat Handler Lambda

Processes user questions using Bedrock Knowledge Base RetrieveAndGenerate API.
Handles conversation logging, feedback submission, and confidence scoring.
"""

import json
import os
import boto3
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

# AWS clients at module level for reuse across warm invocations
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
dynamodb = boto3.resource('dynamodb')

# Environment variables
KB_ID = os.environ.get('KB_ID')
TABLE_NAME = os.environ.get('TABLE_NAME')
REGION = os.environ.get('AWS_REGION', 'us-east-1')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle chat requests and feedback submissions.
    
    Routes:
    - POST /chat: Process user question
    - POST /feedback: Submit feedback for conversation
    - OPTIONS: CORS preflight
    """
    # Validate environment variables
    if not KB_ID:
        return create_response(500, {'error': 'KB_ID not configured'})
    if not TABLE_NAME:
        return create_response(500, {'error': 'TABLE_NAME not configured'})
    
    # Handle CORS preflight
    http_method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    if http_method == 'OPTIONS':
        return create_response(200, {'message': 'OK'})
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Route based on path or action
        path = event.get('rawPath', event.get('path', ''))
        
        if 'feedback' in path or body.get('action') == 'feedback':
            return handle_feedback(body)
        else:
            return handle_chat(body)
            
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})


def handle_chat(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle chat request using Bedrock KB RetrieveAndGenerate.
    """
    # Validate input
    message = body.get('message', '').strip()
    if not message:
        return create_response(400, {'error': 'Message is required'})
    
    if len(message) > 1000:
        return create_response(400, {'error': 'Message too long (max 1000 characters)'})
    
    language = body.get('language', 'en')
    if language not in ['en', 'es']:
        return create_response(400, {'error': 'Language must be "en" or "es"'})
    
    conversation_id = body.get('conversationId') or str(uuid.uuid4())
    
    # Language-specific prompts
    system_prompts = {
        'en': 'You are CincyMuse, a helpful assistant for Cincinnati Museum Center. Provide accurate, friendly responses about exhibits, collections, events, tickets, memberships, and support opportunities. Keep responses concise and informative.',
        'es': 'Eres CincyMuse, un asistente útil para el Cincinnati Museum Center. Proporciona respuestas precisas y amigables sobre exhibiciones, colecciones, eventos, boletos, membresías y oportunidades de apoyo. Mantén las respuestas concisas e informativas.',
    }
    
    try:
        # Call Bedrock KB RetrieveAndGenerate API
        response = bedrock_agent_runtime.retrieve_and_generate(
            input={
                'text': message,
            },
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': KB_ID,
                    'modelArn': f'arn:aws:bedrock:{REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
                    'retrievalConfiguration': {
                        'vectorSearchConfiguration': {
                            'numberOfResults': 5,
                        },
                    },
                    'generationConfiguration': {
                        'promptTemplate': {
                            'textPromptTemplate': f'{system_prompts[language]}\n\nContext: $search_results$\n\nQuestion: $query$\n\nAnswer:',
                        },
                        'inferenceConfig': {
                            'textInferenceConfig': {
                                'maxTokens': 1000,
                                'temperature': 0.7,
                            },
                        },
                    },
                },
            },
        )
        
        # Extract response and citations
        output_text = response.get('output', {}).get('text', '')
        citations = response.get('citations', [])
        
        # Calculate confidence from retrieval scores
        confidence = calculate_confidence_from_citations(citations)
        
        # Extract sources
        sources = extract_sources_from_citations(citations)
        
        # Check confidence threshold
        if confidence < 0.7:
            fallback_messages = {
                'en': "You've asked a great question, but it's one I don't have the details for just yet. For the most accurate information, please contact our team at (513) 287-7000.",
                'es': "Has hecho una gran pregunta, pero es una para la que aún no tengo los detalles. Para obtener la información más precisa, comunícate con nuestro equipo al (513) 287-7000.",
            }
            output_text = fallback_messages[language]
            sources = []
        
        # Log conversation
        log_conversation(conversation_id, message, output_text, language, confidence, sources)
        
        return create_response(200, {
            'conversationId': conversation_id,
            'response': output_text,
            'sources': sources,
            'confidence': confidence,
        })
        
    except Exception as e:
        print(f"Error calling Bedrock KB: {str(e)}")
        return create_response(500, {'error': 'Failed to generate response'})


def handle_feedback(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle feedback submission for a conversation.
    """
    conversation_id = body.get('conversationId')
    rating = body.get('rating')
    
    if not conversation_id:
        return create_response(400, {'error': 'conversationId is required'})
    
    if rating not in ['positive', 'negative']:
        return create_response(400, {'error': 'rating must be "positive" or "negative"'})
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'conversationId': conversation_id},
            UpdateExpression='SET feedback = :rating',
            ExpressionAttributeValues={':rating': rating},
        )
        
        return create_response(200, {'message': 'Feedback recorded'})
        
    except Exception as e:
        print(f"Error recording feedback: {str(e)}")
        return create_response(500, {'error': 'Failed to record feedback'})


def calculate_confidence_from_citations(citations: list) -> float:
    """Calculate average confidence from citation scores."""
    scores = []
    for citation in citations:
        for ref in citation.get('retrievedReferences', []):
            score = ref.get('metadata', {}).get('x-amz-bedrock-kb-retrieval-score')
            if score:
                scores.append(float(score))
    
    return sum(scores) / len(scores) if scores else 0.0


def extract_sources_from_citations(citations: list) -> list:
    """Extract unique sources from citations."""
    sources = []
    seen_urls = set()
    
    for citation in citations:
        for ref in citation.get('retrievedReferences', []):
            location = ref.get('location', {})
            url = location.get('s3Location', {}).get('uri') or location.get('webLocation', {}).get('url', '')
            
            if url and url not in seen_urls:
                seen_urls.add(url)
                metadata = ref.get('metadata', {})
                title = metadata.get('x-amz-bedrock-kb-source-uri', url)
                
                sources.append({
                    'title': title,
                    'url': url,
                    'type': categorize_source(url),
                })
    
    return sources


def categorize_source(url: str) -> str:
    """Categorize source by URL pattern."""
    url_lower = url.lower()
    if 's3://' in url_lower or url_lower.endswith('.pdf'):
        return 'pdf'
    elif 'searchcollections' in url_lower:
        return 'collection'
    elif 'event' in url_lower or 'omnimax' in url_lower:
        return 'event'
    elif 'podcast' in url_lower or 'podbean' in url_lower:
        return 'podcast'
    else:
        return 'website'


def log_conversation(conversation_id: str, question: str, response: str, 
                     language: str, confidence: float, sources: list) -> None:
    """Log conversation to DynamoDB with PII redaction."""
    from shared.pii_redactor import redact_pii
    
    table = dynamodb.Table(TABLE_NAME)
    timestamp = datetime.utcnow().isoformat()
    ttl = int((datetime.utcnow() + timedelta(days=90)).timestamp())
    
    table.put_item(
        Item={
            'conversationId': conversation_id,
            'timestamp': timestamp,
            'question': redact_pii(question),
            'response': redact_pii(response),
            'language': language,
            'confidence': str(confidence),
            'sources': sources,
            'ttl': ttl,
        }
    )
    
    # Also log to CloudWatch for analytics
    print(json.dumps({
        'event': 'conversation',
        'conversationId': conversation_id,
        'language': language,
        'confidence': confidence,
        'sourceCount': len(sources),
    }))


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create API Gateway response with CORS headers."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        'body': json.dumps(body),
    }
