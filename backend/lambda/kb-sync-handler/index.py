"""
KB Sync Handler Lambda

Triggers Bedrock Knowledge Base ingestion jobs for data sources.
Supports selective sync (web, s3-pdfs, s3-podcasts, collections) or full sync.

Requirements: 5.7, 7.6, 8.5
"""

import json
import boto3
import os
from typing import Dict, List, Any

# AWS clients at module level for reuse across warm invocations
bedrock_agent_client = boto3.client('bedrock-agent')

# Environment variables
KB_ID = os.environ.get('KB_ID')
WEB_DATA_SOURCE_IDS = os.environ.get('WEB_DATA_SOURCE_IDS', '')  # Comma-separated
PDF_DATA_SOURCE_ID = os.environ.get('PDF_DATA_SOURCE_ID')
PODCAST_DATA_SOURCE_ID = os.environ.get('PODCAST_DATA_SOURCE_ID')


def lambda_handler(event, context):
    """
    Trigger KB ingestion jobs for specified data sources
    
    Event can specify:
    - source_type: 'web', 's3-pdfs', 's3-podcasts', 'all' (default: 'all')
    - Triggered by EventBridge scheduled rules or manual invocation
    """
    try:
        # Validate environment variables
        if not KB_ID:
            raise ValueError("KB_ID environment variable not set")
        
        # Determine which data sources to sync
        source_type = event.get('source_type', 'all')
        
        print(f"Starting KB sync for source type: {source_type}")
        
        results = []
        
        # Sync web crawlers (cincymuseum.org, supportcmc.org)
        if source_type in ['all', 'web']:
            web_results = sync_web_data_sources()
            results.extend(web_results)
        
        # Sync PDF data source
        if source_type in ['all', 's3-pdfs']:
            if PDF_DATA_SOURCE_ID:
                pdf_result = sync_data_source(PDF_DATA_SOURCE_ID, 'PDF Documents')
                results.append(pdf_result)
            else:
                print("PDF_DATA_SOURCE_ID not configured, skipping")
        
        # Sync podcast data source
        if source_type in ['all', 's3-podcasts']:
            if PODCAST_DATA_SOURCE_ID:
                podcast_result = sync_data_source(PODCAST_DATA_SOURCE_ID, 'Podcast Episodes')
                results.append(podcast_result)
            else:
                print("PODCAST_DATA_SOURCE_ID not configured, skipping")
        
        # Summary
        success_count = sum(1 for r in results if r['status'] == 'started')
        failed_count = len(results) - success_count
        
        print(f"KB sync completed: {success_count} started, {failed_count} failed")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'KB sync completed',
                'results': results,
                'summary': {
                    'started': success_count,
                    'failed': failed_count
                }
            })
        }
        
    except Exception as e:
        print(f"Error in KB sync handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def sync_web_data_sources() -> List[Dict[str, Any]]:
    """
    Sync all web crawler data sources
    
    Returns:
        List of sync results
    """
    results = []
    
    if not WEB_DATA_SOURCE_IDS:
        print("WEB_DATA_SOURCE_IDS not configured, skipping web sync")
        return results
    
    # Parse comma-separated data source IDs
    data_source_ids = [ds_id.strip() for ds_id in WEB_DATA_SOURCE_IDS.split(',') if ds_id.strip()]
    
    for idx, data_source_id in enumerate(data_source_ids):
        source_name = f"Web Crawler {idx + 1}"
        result = sync_data_source(data_source_id, source_name)
        results.append(result)
    
    return results


def sync_data_source(data_source_id: str, source_name: str) -> Dict[str, Any]:
    """
    Start ingestion job for a specific data source
    
    Args:
        data_source_id: Bedrock data source ID
        source_name: Human-readable name for logging
        
    Returns:
        Dictionary with sync result
    """
    try:
        print(f"Starting ingestion job for {source_name} (ID: {data_source_id})")
        
        response = bedrock_agent_client.start_ingestion_job(
            knowledgeBaseId=KB_ID,
            dataSourceId=data_source_id
        )
        
        ingestion_job = response.get('ingestionJob', {})
        job_id = ingestion_job.get('ingestionJobId', 'unknown')
        status = ingestion_job.get('status', 'unknown')
        
        print(f"Ingestion job started for {source_name}: Job ID {job_id}, Status {status}")
        
        return {
            'data_source_id': data_source_id,
            'source_name': source_name,
            'job_id': job_id,
            'status': 'started',
            'bedrock_status': status
        }
        
    except bedrock_agent_client.exceptions.ConflictException as e:
        # Ingestion job already in progress
        print(f"Ingestion job already in progress for {source_name}: {str(e)}")
        return {
            'data_source_id': data_source_id,
            'source_name': source_name,
            'status': 'already_in_progress',
            'error': str(e)
        }
    except Exception as e:
        print(f"Failed to start ingestion job for {source_name}: {str(e)}")
        return {
            'data_source_id': data_source_id,
            'source_name': source_name,
            'status': 'failed',
            'error': str(e)
        }
