"""
Collections API Connector Lambda

Fetches collection data from searchcollections.cincymuseum.org API,
formats it for Bedrock Knowledge Base ingestion, and writes to S3.

Requirements: 6.1, 6.2, 6.3
"""

import json
import boto3
import os
import requests
from datetime import datetime
from typing import Dict, List, Any

# AWS clients at module level for reuse across warm invocations
s3_client = boto3.client('s3')

# Environment variables
KB_BUCKET = os.environ.get('KB_BUCKET')
COLLECTIONS_API_BASE = 'https://searchcollections.cincymuseum.org/api'


def lambda_handler(event, context):
    """
    Fetch collections from API and write to S3 for KB ingestion
    
    Triggered by EventBridge scheduled rule (every 24 hours)
    """
    try:
        # Validate environment variables
        if not KB_BUCKET:
            raise ValueError("KB_BUCKET environment variable not set")
        
        print(f"Starting collections ingestion from {COLLECTIONS_API_BASE}")
        
        # Fetch collections with pagination
        collections = fetch_all_collections()
        
        print(f"Fetched {len(collections)} collection items")
        
        # Format for KB ingestion
        documents = format_collections_for_kb(collections)
        
        # Write to S3
        write_to_s3(documents)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Collections ingestion successful',
                'itemsProcessed': len(collections),
                'documentsCreated': len(documents)
            })
        }
        
    except requests.exceptions.RequestException as e:
        print(f"API request error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'API request failed: {str(e)}'})
        }
    except Exception as e:
        print(f"Error in collections connector: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def fetch_all_collections() -> List[Dict[str, Any]]:
    """
    Fetch all collection items from API with pagination
    
    Returns:
        List of collection item dictionaries
    """
    all_items = []
    page = 1
    per_page = 100
    max_retries = 3
    
    while True:
        retry_count = 0
        while retry_count < max_retries:
            try:
                print(f"Fetching page {page} (items per page: {per_page})")
                
                response = requests.get(
                    f"{COLLECTIONS_API_BASE}/collections",
                    params={'page': page, 'per_page': per_page},
                    timeout=30
                )
                response.raise_for_status()
                
                data = response.json()
                items = data.get('items', [])
                
                if not items:
                    print(f"No more items found at page {page}")
                    return all_items
                
                all_items.extend(items)
                print(f"Fetched {len(items)} items from page {page}, total: {len(all_items)}")
                
                page += 1
                break  # Success, exit retry loop
                
            except requests.exceptions.Timeout:
                retry_count += 1
                print(f"Timeout on page {page}, retry {retry_count}/{max_retries}")
                if retry_count >= max_retries:
                    raise
            except requests.exceptions.RequestException as e:
                retry_count += 1
                print(f"Request error on page {page}: {str(e)}, retry {retry_count}/{max_retries}")
                if retry_count >= max_retries:
                    raise
    
    return all_items


def format_collections_for_kb(collections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format collection items as documents for KB ingestion
    
    Args:
        collections: List of collection items from API
        
    Returns:
        List of formatted documents with text and metadata
    """
    documents = []
    
    for item in collections:
        # Extract metadata
        item_id = item.get('id', 'unknown')
        title = item.get('title', '')
        description = item.get('description', '')
        date = item.get('date', '')
        category = item.get('category', '')
        
        # Skip items without meaningful content
        if not title and not description:
            print(f"Skipping item {item_id} - no title or description")
            continue
        
        # Create text content for embedding
        text_parts = []
        if title:
            text_parts.append(f"Title: {title}")
        if description:
            text_parts.append(f"Description: {description}")
        if date:
            text_parts.append(f"Date: {date}")
        if category:
            text_parts.append(f"Category: {category}")
        
        text_content = "\n".join(text_parts)
        
        # Create document with metadata
        document = {
            'text': text_content,
            'metadata': {
                'source_url': f"https://searchcollections.cincymuseum.org/objects/{item_id}",
                'source_type': 'collection',
                'collection_id': str(item_id),
                'category': category,
                'date': date,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        documents.append(document)
    
    return documents


def write_to_s3(documents: List[Dict[str, Any]]) -> None:
    """
    Write formatted documents to S3 for KB ingestion
    
    Args:
        documents: List of formatted documents
    """
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    s3_key = f"collections/collections_{timestamp}.json"
    
    # Write as JSONL (one JSON object per line) for KB ingestion
    jsonl_content = "\n".join(json.dumps(doc) for doc in documents)
    
    print(f"Writing {len(documents)} documents to s3://{KB_BUCKET}/{s3_key}")
    
    s3_client.put_object(
        Bucket=KB_BUCKET,
        Key=s3_key,
        Body=jsonl_content.encode('utf-8'),
        ContentType='application/x-ndjson',
        Metadata={
            'document_count': str(len(documents)),
            'ingestion_timestamp': timestamp
        }
    )
    
    print(f"Successfully wrote collections to S3")
