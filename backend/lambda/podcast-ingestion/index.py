"""
Podcast RSS Ingestion Lambda

Fetches podcast episodes from Cincinnati Museum Center's RSS feed,
formats them for Bedrock Knowledge Base ingestion, and writes to S3.

Requirements: 8.1, 8.2
"""

import json
import boto3
import os
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Any

# AWS clients at module level for reuse across warm invocations
s3_client = boto3.client('s3')

# Environment variables
KB_BUCKET = os.environ.get('KB_BUCKET')
PODCAST_FEED_URL = 'https://feed.podbean.com/cincinnatimuseumcenter/feed.xml'


def lambda_handler(event, context):
    """
    Fetch podcast episodes from RSS feed and write to S3 for KB ingestion
    
    Triggered by EventBridge scheduled rule (every 24 hours)
    """
    try:
        # Validate environment variables
        if not KB_BUCKET:
            raise ValueError("KB_BUCKET environment variable not set")
        
        print(f"Starting podcast ingestion from {PODCAST_FEED_URL}")
        
        # Fetch RSS feed
        episodes = fetch_podcast_episodes()
        
        print(f"Fetched {len(episodes)} podcast episodes")
        
        # Format for KB ingestion
        documents = format_episodes_for_kb(episodes)
        
        # Write to S3
        write_to_s3(documents)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Podcast ingestion successful',
                'episodesProcessed': len(episodes),
                'documentsCreated': len(documents)
            })
        }
        
    except requests.exceptions.RequestException as e:
        print(f"RSS feed request error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'RSS feed request failed: {str(e)}'})
        }
    except ET.ParseError as e:
        print(f"XML parsing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'XML parsing failed: {str(e)}'})
        }
    except Exception as e:
        print(f"Error in podcast ingestion: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def fetch_podcast_episodes() -> List[Dict[str, Any]]:
    """
    Fetch podcast episodes from RSS feed
    
    Returns:
        List of episode dictionaries with metadata
    """
    print(f"Fetching RSS feed from {PODCAST_FEED_URL}")
    
    # Fetch RSS feed with timeout
    response = requests.get(PODCAST_FEED_URL, timeout=30)
    response.raise_for_status()
    
    # Parse XML
    root = ET.fromstring(response.content)
    
    # Find all items (episodes) in the feed
    # RSS namespace handling
    episodes = []
    
    # Navigate to channel/item elements
    channel = root.find('channel')
    if channel is None:
        print("No channel element found in RSS feed")
        return episodes
    
    items = channel.findall('item')
    print(f"Found {len(items)} items in RSS feed")
    
    for item in items:
        try:
            # Extract episode metadata
            title_elem = item.find('title')
            description_elem = item.find('description')
            pub_date_elem = item.find('pubDate')
            
            # Find enclosure (audio URL) - may have namespace
            enclosure_elem = item.find('enclosure')
            audio_url = ''
            if enclosure_elem is not None:
                audio_url = enclosure_elem.get('url', '')
            
            # Extract text content
            title = title_elem.text if title_elem is not None and title_elem.text else ''
            description = description_elem.text if description_elem is not None and description_elem.text else ''
            pub_date = pub_date_elem.text if pub_date_elem is not None and pub_date_elem.text else ''
            
            # Skip episodes without meaningful content
            if not title and not description:
                continue
            
            episode = {
                'title': title.strip(),
                'description': description.strip(),
                'pub_date': pub_date.strip(),
                'audio_url': audio_url.strip()
            }
            
            episodes.append(episode)
            
        except Exception as e:
            print(f"Error parsing episode: {str(e)}")
            continue
    
    return episodes


def format_episodes_for_kb(episodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format podcast episodes as documents for KB ingestion
    
    Args:
        episodes: List of episode dictionaries from RSS feed
        
    Returns:
        List of formatted documents with text and metadata
    """
    documents = []
    
    for episode in episodes:
        title = episode.get('title', '')
        description = episode.get('description', '')
        pub_date = episode.get('pub_date', '')
        audio_url = episode.get('audio_url', '')
        
        # Create text content for embedding
        text_parts = []
        if title:
            text_parts.append(f"Podcast Episode: {title}")
        if description:
            text_parts.append(f"Description: {description}")
        if pub_date:
            text_parts.append(f"Published: {pub_date}")
        
        text_content = "\n".join(text_parts)
        
        # Create document with metadata
        document = {
            'text': text_content,
            'metadata': {
                'source_url': audio_url if audio_url else 'https://feed.podbean.com/cincinnatimuseumcenter/feed.xml',
                'source_type': 'podcast',
                'publication_date': pub_date,
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
    s3_key = f"podcasts/podcasts_{timestamp}.json"
    
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
    
    print(f"Successfully wrote podcast episodes to S3")
