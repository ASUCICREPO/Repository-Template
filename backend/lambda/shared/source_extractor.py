"""
Source Extractor Module

Extracts and formats source citations from Bedrock Knowledge Base responses.
Deduplicates sources and categorizes by type.
"""

from typing import List, Dict, Any
from urllib.parse import urlparse


def extract_sources(kb_response: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Extract source citations from Bedrock KB response.
    
    Args:
        kb_response: Response from Bedrock RetrieveAndGenerate API
                    Contains 'citations' field with source references
        
    Returns:
        List of deduplicated sources with title, url, and type
        
    Example:
        >>> response = {
        ...     'citations': [
        ...         {'retrievedReferences': [
        ...             {'location': {'s3Location': {'uri': 's3://bucket/file.pdf'}},
        ...              'metadata': {'title': 'Guide'}}
        ...         ]}
        ...     ]
        ... }
        >>> extract_sources(response)
        [{'title': 'Guide', 'url': 's3://bucket/file.pdf', 'type': 'pdf'}]
    """
    sources = []
    seen_urls = set()
    
    # Extract citations from response
    citations = kb_response.get('citations', [])
    
    for citation in citations:
        references = citation.get('retrievedReferences', [])
        
        for ref in references:
            # Extract location
            location = ref.get('location', {})
            url = None
            
            # Check different location types
            if 's3Location' in location:
                url = location['s3Location'].get('uri', '')
            elif 'webLocation' in location:
                url = location['webLocation'].get('url', '')
            elif 'type' in location and location['type'] == 'WEB':
                url = location.get('url', '')
            
            if not url or url in seen_urls:
                continue
            
            seen_urls.add(url)
            
            # Extract metadata
            metadata = ref.get('metadata', {})
            title = metadata.get('title', '') or metadata.get('x-amz-bedrock-kb-source-uri', '') or url
            
            # Determine source type
            source_type = categorize_source(url)
            
            sources.append({
                'title': title,
                'url': url,
                'type': source_type,
            })
    
    return sources


def categorize_source(url: str) -> str:
    """
    Categorize source by URL pattern.
    
    Args:
        url: Source URL
        
    Returns:
        Source type: 'website', 'collection', 'event', 'podcast', or 'pdf'
    """
    url_lower = url.lower()
    
    if 's3://' in url_lower or url_lower.endswith('.pdf'):
        return 'pdf'
    elif 'searchcollections.cincymuseum.org' in url_lower:
        return 'collection'
    elif 'event' in url_lower or 'omnimax' in url_lower:
        return 'event'
    elif 'podcast' in url_lower or 'podbean' in url_lower:
        return 'podcast'
    else:
        return 'website'


def format_sources_for_display(sources: List[Dict[str, str]]) -> str:
    """
    Format sources as human-readable text.
    
    Args:
        sources: List of source dictionaries
        
    Returns:
        Formatted string with numbered sources
    """
    if not sources:
        return ''
    
    formatted = []
    for i, source in enumerate(sources, 1):
        formatted.append(f"{i}. {source['title']} ({source['url']})")
    
    return '\n'.join(formatted)
