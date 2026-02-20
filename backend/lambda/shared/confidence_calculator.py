"""
Confidence Calculator Module

Calculates confidence scores from Bedrock Knowledge Base retrieval results.
Determines if responses meet the minimum confidence threshold.
"""

from typing import List, Dict, Any


CONFIDENCE_THRESHOLD = 0.7


def calculate_confidence(retrieval_results: List[Dict[str, Any]]) -> float:
    """
    Calculate confidence score from KB retrieval results.
    
    Uses the average relevance score from retrieved chunks.
    Bedrock KB returns scores between 0 and 1.
    
    Args:
        retrieval_results: List of retrieval results from Bedrock KB
                          Each result has a 'score' field
        
    Returns:
        Confidence score between 0 and 1
        
    Example:
        >>> results = [{'score': 0.85}, {'score': 0.75}, {'score': 0.65}]
        >>> calculate_confidence(results)
        0.75
    """
    if not retrieval_results:
        return 0.0
    
    # Extract scores from results
    scores = []
    for result in retrieval_results:
        score = result.get('score', 0.0)
        if isinstance(score, (int, float)):
            scores.append(float(score))
    
    if not scores:
        return 0.0
    
    # Return average score
    return sum(scores) / len(scores)


def meets_threshold(confidence: float, threshold: float = CONFIDENCE_THRESHOLD) -> bool:
    """
    Check if confidence meets minimum threshold.
    
    Args:
        confidence: Calculated confidence score
        threshold: Minimum required confidence (default: 0.7)
        
    Returns:
        True if confidence >= threshold, False otherwise
        
    Example:
        >>> meets_threshold(0.75)
        True
        >>> meets_threshold(0.65)
        False
    """
    return confidence >= threshold


def get_confidence_level(confidence: float) -> str:
    """
    Get human-readable confidence level.
    
    Args:
        confidence: Confidence score between 0 and 1
        
    Returns:
        Confidence level: 'high', 'medium', or 'low'
    """
    if confidence >= 0.8:
        return 'high'
    elif confidence >= 0.6:
        return 'medium'
    else:
        return 'low'
