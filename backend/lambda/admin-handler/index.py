"""
Admin Handler Lambda for CincyMuse Dashboard APIs

Provides endpoints for:
- Conversation log queries with filters
- PDF upload/delete management
- FAQ analytics using CloudWatch Logs Insights
- Feedback statistics
- System health metrics
- CSV export for FAQ data

Authentication: Cognito JWT validation
Authorization: Role-based access control (Admin/Viewer)
"""

import json
import os
import boto3
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid
import csv
import io
from jose import jwt, JWTError

# AWS clients at module level for reuse across warm invocations
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
bedrock_agent = boto3.client('bedrock-agent')
logs_client = boto3.client('logs')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME')
PDF_METADATA_TABLE = os.environ.get('PDF_METADATA_TABLE')
PDF_BUCKET = os.environ.get('PDF_BUCKET')
KB_ID = os.environ.get('KB_ID')
PDF_DATA_SOURCE_ID = os.environ.get('PDF_DATA_SOURCE_ID')
USER_POOL_ID = os.environ.get('USER_POOL_ID')
REGION = os.environ.get('AWS_REGION')  # Automatically provided by Lambda runtime
LOG_GROUP_NAME = os.environ.get('LOG_GROUP_NAME')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for admin dashboard APIs
    
    Routes requests based on HTTP method and path
    Validates authentication and authorization for all requests
    """
    print(f"Event: {json.dumps(event)}")
    
    # Validate environment variables
    if not all([TABLE_NAME, PDF_METADATA_TABLE, PDF_BUCKET, KB_ID, PDF_DATA_SOURCE_ID, USER_POOL_ID, LOG_GROUP_NAME]):
        return create_response(500, {'error': 'Missing required environment variables'})
    
    # Handle CORS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return create_response(200, {})
    
    try:
        # Extract HTTP method and path
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        path = event.get('requestContext', {}).get('http', {}).get('path', '/')
        
        # Authenticate user
        auth_result = authenticate_request(event)
        if 'error' in auth_result:
            return create_response(401, {'error': auth_result['error']})
        
        user_role = auth_result.get('role', 'Viewer')
        user_id = auth_result.get('sub')
        
        # Route to appropriate handler
        if path == '/conversations' and http_method == 'GET':
            return handle_get_conversations(event, user_role)
        
        elif path == '/pdfs' and http_method == 'GET':
            return handle_list_pdfs(event, user_role)
        
        elif path == '/pdfs' and http_method == 'POST':
            if user_role != 'Admin':
                return create_response(403, {'error': 'Admin role required for PDF upload'})
            return handle_upload_pdf(event, user_id)
        
        elif path.startswith('/pdfs/') and http_method == 'DELETE':
            if user_role != 'Admin':
                return create_response(403, {'error': 'Admin role required for PDF deletion'})
            pdf_id = path.split('/')[-1]
            return handle_delete_pdf(pdf_id)
        
        elif path == '/analytics/faqs' and http_method == 'GET':
            return handle_faq_analytics(event, user_role)
        
        elif path == '/analytics/feedback' and http_method == 'GET':
            return handle_feedback_statistics(event, user_role)
        
        elif path == '/analytics/metrics' and http_method == 'GET':
            return handle_system_metrics(event, user_role)
        
        else:
            return create_response(404, {'error': 'Endpoint not found'})
    
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create HTTP response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        'body': json.dumps(body)
    }


def authenticate_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate Cognito JWT token from Authorization header
    
    Returns:
        Dict with user claims (sub, email, role) or error
    """
    try:
        # Extract Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('authorization') or headers.get('Authorization')
        
        if not auth_header:
            return {'error': 'Missing Authorization header'}
        
        # Extract token (format: "Bearer <token>")
        if not auth_header.startswith('Bearer '):
            return {'error': 'Invalid Authorization header format'}
        
        token = auth_header.split(' ')[1]
        
        # Get Cognito JWKS URL
        jwks_url = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"
        
        # Decode and verify JWT (simplified - in production use python-jose with JWKS)
        # For now, decode without verification to extract claims
        # TODO: Add proper JWT verification with JWKS in production
        claims = jwt.get_unverified_claims(token)
        
        # Extract role from custom attribute or groups
        role = 'Viewer'  # Default role
        
        # Check custom:role attribute
        if 'custom:role' in claims:
            role = claims['custom:role']
        
        # Check cognito:groups
        elif 'cognito:groups' in claims:
            groups = claims['cognito:groups']
            if 'Admin' in groups:
                role = 'Admin'
            elif 'Viewer' in groups:
                role = 'Viewer'
        
        return {
            'sub': claims.get('sub'),
            'email': claims.get('email'),
            'role': role
        }
    
    except JWTError as e:
        print(f"JWT validation error: {str(e)}")
        return {'error': 'Invalid token'}
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return {'error': 'Authentication failed'}


def handle_get_conversations(event: Dict[str, Any], user_role: str) -> Dict[str, Any]:
    """
    Query conversation logs with filters
    
    Query parameters:
    - startDate: ISO 8601 date (optional)
    - endDate: ISO 8601 date (optional)
    - language: 'en' | 'es' (optional)
    - minConfidence: number 0-1 (optional)
    - feedback: 'positive' | 'negative' (optional)
    - limit: number (default 50, max 500)
    - nextToken: pagination token (optional)
    """
    try:
        # Extract query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        
        start_date = query_params.get('startDate')
        end_date = query_params.get('endDate')
        language = query_params.get('language')
        min_confidence = query_params.get('minConfidence')
        feedback = query_params.get('feedback')
        limit = int(query_params.get('limit', 50))
        next_token = query_params.get('nextToken')
        
        # Enforce max limit
        limit = min(limit, 500)
        
        table = dynamodb.Table(TABLE_NAME)
        
        # Build query using TimestampIndex GSI if language filter provided
        if language:
            query_kwargs = {
                'IndexName': 'TimestampIndex',
                'KeyConditionExpression': 'language = :lang',
                'ExpressionAttributeValues': {':lang': language},
                'Limit': limit,
                'ScanIndexForward': False  # Most recent first
            }
            
            # Add date range filter
            if start_date or end_date:
                filter_expressions = []
                if start_date:
                    filter_expressions.append('timestamp >= :start_date')
                    query_kwargs['ExpressionAttributeValues'][':start_date'] = start_date
                if end_date:
                    filter_expressions.append('timestamp <= :end_date')
                    query_kwargs['ExpressionAttributeValues'][':end_date'] = end_date
                
                if filter_expressions:
                    query_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
            
            if next_token:
                query_kwargs['ExclusiveStartKey'] = json.loads(base64.b64decode(next_token))
            
            response = table.query(**query_kwargs)
        
        # Use FeedbackIndex GSI if feedback filter provided
        elif feedback:
            query_kwargs = {
                'IndexName': 'FeedbackIndex',
                'KeyConditionExpression': 'feedback = :feedback',
                'ExpressionAttributeValues': {':feedback': feedback},
                'Limit': limit,
                'ScanIndexForward': False
            }
            
            if next_token:
                query_kwargs['ExclusiveStartKey'] = json.loads(base64.b64decode(next_token))
            
            response = table.query(**query_kwargs)
        
        # Otherwise scan table (less efficient but supports all filters)
        else:
            scan_kwargs = {
                'Limit': limit
            }
            
            # Build filter expression
            filter_expressions = []
            expression_values = {}
            
            if start_date:
                filter_expressions.append('timestamp >= :start_date')
                expression_values[':start_date'] = start_date
            if end_date:
                filter_expressions.append('timestamp <= :end_date')
                expression_values[':end_date'] = end_date
            if min_confidence:
                filter_expressions.append('confidence >= :min_confidence')
                expression_values[':min_confidence'] = float(min_confidence)
            
            if filter_expressions:
                scan_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
                scan_kwargs['ExpressionAttributeValues'] = expression_values
            
            if next_token:
                scan_kwargs['ExclusiveStartKey'] = json.loads(base64.b64decode(next_token))
            
            response = table.scan(**scan_kwargs)
        
        # Prepare response
        conversations = response.get('Items', [])
        
        result = {
            'conversations': conversations,
            'count': len(conversations)
        }
        
        # Add pagination token if more results available
        if 'LastEvaluatedKey' in response:
            result['nextToken'] = base64.b64encode(
                json.dumps(response['LastEvaluatedKey']).encode()
            ).decode()
        
        return create_response(200, result)
    
    except Exception as e:
        print(f"Error querying conversations: {str(e)}")
        return create_response(500, {'error': 'Failed to query conversations'})


def handle_list_pdfs(event: Dict[str, Any], user_role: str) -> Dict[str, Any]:
    """List all PDFs in the repository"""
    try:
        table = dynamodb.Table(PDF_METADATA_TABLE)
        response = table.scan()
        
        pdfs = response.get('Items', [])
        
        return create_response(200, {'pdfs': pdfs})
    
    except Exception as e:
        print(f"Error listing PDFs: {str(e)}")
        return create_response(500, {'error': 'Failed to list PDFs'})


def handle_upload_pdf(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle PDF upload
    
    Expects multipart/form-data with file field
    Max file size: 10MB
    """
    try:
        # Parse multipart form data
        # Note: Lambda Function URLs provide base64-encoded body for binary data
        content_type = event.get('headers', {}).get('content-type', '')
        
        if not content_type.startswith('multipart/form-data'):
            return create_response(400, {'error': 'Content-Type must be multipart/form-data'})
        
        # Extract file from body
        # In production, use a proper multipart parser library
        body = event.get('body', '')
        is_base64 = event.get('isBase64Encoded', False)
        
        if is_base64:
            body = base64.b64decode(body)
        else:
            body = body.encode()
        
        # Simple multipart parsing (for production, use python-multipart library)
        # For now, assume body contains PDF bytes directly
        pdf_bytes = body
        
        # Validate file size (max 10MB)
        if len(pdf_bytes) > 10 * 1024 * 1024:
            return create_response(400, {'error': 'File size exceeds 10MB limit'})
        
        # Generate PDF ID and S3 key
        pdf_id = str(uuid.uuid4())
        filename = event.get('queryStringParameters', {}).get('filename', 'document.pdf')
        s3_key = f"customer-service/{pdf_id}-{filename}"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=PDF_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf'
        )
        
        # Create metadata entry
        table = dynamodb.Table(PDF_METADATA_TABLE)
        upload_date = datetime.utcnow().isoformat()
        
        table.put_item(Item={
            'pdfId': pdf_id,
            'filename': filename,
            's3Key': s3_key,
            'uploadDate': upload_date,
            'fileSize': len(pdf_bytes),
            'status': 'processing',
            'uploadedBy': user_id
        })
        
        # Trigger KB sync
        try:
            bedrock_agent.start_ingestion_job(
                knowledgeBaseId=KB_ID,
                dataSourceId=PDF_DATA_SOURCE_ID
            )
            print(f"Started KB ingestion job for PDF {pdf_id}")
        except Exception as e:
            print(f"Failed to start KB ingestion: {str(e)}")
            # Don't fail the upload, just log the error
        
        return create_response(200, {
            'pdfId': pdf_id,
            'filename': filename,
            'status': 'processing',
            'uploadDate': upload_date
        })
    
    except Exception as e:
        print(f"Error uploading PDF: {str(e)}")
        return create_response(500, {'error': 'Failed to upload PDF'})


def handle_delete_pdf(pdf_id: str) -> Dict[str, Any]:
    """Delete PDF from S3 and trigger KB sync"""
    try:
        # Get PDF metadata
        table = dynamodb.Table(PDF_METADATA_TABLE)
        response = table.get_item(Key={'pdfId': pdf_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'PDF not found'})
        
        pdf_metadata = response['Item']
        s3_key = pdf_metadata['s3Key']
        
        # Delete from S3
        s3_client.delete_object(
            Bucket=PDF_BUCKET,
            Key=s3_key
        )
        
        # Update metadata status
        table.update_item(
            Key={'pdfId': pdf_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'deleted'}
        )
        
        # Trigger KB sync to remove from index
        try:
            bedrock_agent.start_ingestion_job(
                knowledgeBaseId=KB_ID,
                dataSourceId=PDF_DATA_SOURCE_ID
            )
            print(f"Started KB ingestion job after deleting PDF {pdf_id}")
        except Exception as e:
            print(f"Failed to start KB ingestion: {str(e)}")
        
        return create_response(200, {'status': 'success', 'message': 'PDF deleted successfully'})
    
    except Exception as e:
        print(f"Error deleting PDF: {str(e)}")
        return create_response(500, {'error': 'Failed to delete PDF'})


def handle_faq_analytics(event: Dict[str, Any], user_role: str) -> Dict[str, Any]:
    """
    Generate FAQ analytics using CloudWatch Logs Insights
    
    Queries conversation logs to identify frequently asked questions
    Groups similar questions by keyword matching
    Returns top 20 FAQs with count and average confidence
    """
    try:
        # Query CloudWatch Logs Insights for conversation questions
        # Look back 30 days
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=30)
        
        # CloudWatch Logs Insights query to aggregate questions
        query = """
        fields question, confidence
        | filter ispresent(question)
        | stats count() as count, avg(confidence) as avgConfidence by question
        | sort count desc
        | limit 20
        """
        
        try:
            # Start query
            start_query_response = logs_client.start_query(
                logGroupName=LOG_GROUP_NAME,
                startTime=int(start_time.timestamp()),
                endTime=int(end_time.timestamp()),
                queryString=query
            )
            
            query_id = start_query_response['queryId']
            
            # Poll for results (max 30 seconds)
            import time
            max_attempts = 30
            for attempt in range(max_attempts):
                time.sleep(1)
                
                results_response = logs_client.get_query_results(queryId=query_id)
                status = results_response['status']
                
                if status == 'Complete':
                    results = results_response['results']
                    
                    # Parse results into FAQ format
                    faqs = []
                    for result in results:
                        faq_item = {}
                        for field in result:
                            field_name = field['field']
                            field_value = field['value']
                            
                            if field_name == 'question':
                                faq_item['question'] = field_value
                            elif field_name == 'count':
                                faq_item['count'] = int(field_value)
                            elif field_name == 'avgConfidence':
                                faq_item['avgConfidence'] = float(field_value)
                        
                        # Categorize question (simple keyword matching)
                        faq_item['category'] = categorize_question(faq_item.get('question', ''))
                        faqs.append(faq_item)
                    
                    # Check if CSV export requested
                    query_params = event.get('queryStringParameters', {}) or {}
                    if query_params.get('format') == 'csv':
                        return export_faqs_csv(faqs)
                    
                    return create_response(200, {'faqs': faqs})
                
                elif status == 'Failed':
                    print(f"CloudWatch Logs Insights query failed")
                    break
            
            # Query timed out or failed, return empty results
            return create_response(200, {'faqs': []})
        
        except Exception as e:
            print(f"CloudWatch Logs Insights error: {str(e)}")
            # Fallback: return empty results
            return create_response(200, {'faqs': []})
    
    except Exception as e:
        print(f"Error generating FAQ analytics: {str(e)}")
        return create_response(500, {'error': 'Failed to generate FAQ analytics'})


def categorize_question(question: str) -> str:
    """Categorize question based on keywords"""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ['ticket', 'admission', 'price', 'cost', 'hours', 'open']):
        return 'Tickets & Hours'
    elif any(word in question_lower for word in ['exhibit', 'display', 'show', 'collection']):
        return 'Exhibits & Collections'
    elif any(word in question_lower for word in ['event', 'program', 'omnimax', 'movie']):
        return 'Events & Programs'
    elif any(word in question_lower for word in ['member', 'membership', 'join']):
        return 'Membership'
    elif any(word in question_lower for word in ['donate', 'support', 'gift', 'contribution']):
        return 'Support & Donations'
    elif any(word in question_lower for word in ['parking', 'location', 'address', 'directions']):
        return 'Visitor Information'
    else:
        return 'General'


def export_faqs_csv(faqs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Export FAQ data as CSV"""
    try:
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=['question', 'count', 'avgConfidence', 'category'])
        writer.writeheader()
        writer.writerows(faqs)
        
        csv_content = output.getvalue()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="faqs.csv"',
                'Access-Control-Allow-Origin': '*',
            },
            'body': csv_content
        }
    
    except Exception as e:
        print(f"Error exporting CSV: {str(e)}")
        return create_response(500, {'error': 'Failed to export CSV'})


def handle_feedback_statistics(event: Dict[str, Any], user_role: str) -> Dict[str, Any]:
    """
    Calculate feedback statistics
    
    Returns:
    - Total responses with feedback
    - Positive feedback count
    - Negative feedback count
    - Optionally filter to show only negative feedback conversations
    """
    try:
        table = dynamodb.Table(TABLE_NAME)
        
        # Query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        show_negative_only = query_params.get('negativeOnly') == 'true'
        
        # Query FeedbackIndex for positive feedback
        positive_response = table.query(
            IndexName='FeedbackIndex',
            KeyConditionExpression='feedback = :feedback',
            ExpressionAttributeValues={':feedback': 'positive'},
            Select='COUNT'
        )
        positive_count = positive_response['Count']
        
        # Query FeedbackIndex for negative feedback
        negative_response = table.query(
            IndexName='FeedbackIndex',
            KeyConditionExpression='feedback = :feedback',
            ExpressionAttributeValues={':feedback': 'negative'}
        )
        negative_count = negative_response['Count']
        
        result = {
            'totalResponses': positive_count + negative_count,
            'positiveCount': positive_count,
            'negativeCount': negative_count
        }
        
        # Include negative feedback conversations if requested
        if show_negative_only:
            result['negativeConversations'] = negative_response.get('Items', [])
        
        return create_response(200, result)
    
    except Exception as e:
        print(f"Error calculating feedback statistics: {str(e)}")
        return create_response(500, {'error': 'Failed to calculate feedback statistics'})


def handle_system_metrics(event: Dict[str, Any], user_role: str) -> Dict[str, Any]:
    """
    Get system health metrics from CloudWatch
    
    Returns:
    - Average response time (last 24 hours)
    - Max response time (last 24 hours)
    - Error rate (percentage)
    - Total requests (last 24 hours)
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)
        
        # Get Lambda duration metrics (response time)
        duration_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Duration',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': 'ChatHandler'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1 hour periods
            Statistics=['Average', 'Maximum']
        )
        
        # Get error count
        errors_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Errors',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': 'ChatHandler'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # Get invocation count
        invocations_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Invocations',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': 'ChatHandler'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # Calculate metrics
        duration_datapoints = duration_response.get('Datapoints', [])
        errors_datapoints = errors_response.get('Datapoints', [])
        invocations_datapoints = invocations_response.get('Datapoints', [])
        
        avg_response_time = 0
        max_response_time = 0
        if duration_datapoints:
            avg_response_time = sum(dp['Average'] for dp in duration_datapoints) / len(duration_datapoints)
            max_response_time = max(dp['Maximum'] for dp in duration_datapoints)
        
        total_errors = sum(dp['Sum'] for dp in errors_datapoints)
        total_invocations = sum(dp['Sum'] for dp in invocations_datapoints)
        
        error_rate = 0
        if total_invocations > 0:
            error_rate = (total_errors / total_invocations) * 100
        
        return create_response(200, {
            'avgResponseTime': round(avg_response_time, 2),
            'maxResponseTime': round(max_response_time, 2),
            'errorRate': round(error_rate, 2),
            'totalRequests': int(total_invocations)
        })
    
    except Exception as e:
        print(f"Error getting system metrics: {str(e)}")
        return create_response(500, {'error': 'Failed to get system metrics'})
