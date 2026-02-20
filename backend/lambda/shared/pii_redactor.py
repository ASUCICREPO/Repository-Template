"""
PII Redaction Module

Redacts Personally Identifiable Information (PII) from text before logging.
Supports email, phone, credit card, SSN, and address patterns.
"""

import re
from typing import Dict, Pattern


# Regex patterns for PII detection
PII_PATTERNS: Dict[str, Pattern] = {
    'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    'phone': re.compile(r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b'),
    'credit_card': re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
    'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    'address': re.compile(r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b', re.IGNORECASE),
}


def redact_pii(text: str) -> str:
    """
    Redact PII from text using regex patterns.
    
    Args:
        text: Input text that may contain PII
        
    Returns:
        Text with PII replaced by [REDACTED_<type>] placeholders
        
    Example:
        >>> redact_pii("Contact me at john@example.com or 555-123-4567")
        "Contact me at [REDACTED_EMAIL] or [REDACTED_PHONE]"
    """
    if not text:
        return text
    
    redacted_text = text
    
    # Apply each pattern
    for pii_type, pattern in PII_PATTERNS.items():
        placeholder = f'[REDACTED_{pii_type.upper()}]'
        redacted_text = pattern.sub(placeholder, redacted_text)
    
    return redacted_text


def redact_dict(data: dict) -> dict:
    """
    Recursively redact PII from dictionary values.
    
    Args:
        data: Dictionary that may contain PII in values
        
    Returns:
        Dictionary with PII redacted from string values
    """
    if not isinstance(data, dict):
        return data
    
    redacted = {}
    for key, value in data.items():
        if isinstance(value, str):
            redacted[key] = redact_pii(value)
        elif isinstance(value, dict):
            redacted[key] = redact_dict(value)
        elif isinstance(value, list):
            redacted[key] = [redact_dict(item) if isinstance(item, dict) else redact_pii(item) if isinstance(item, str) else item for item in value]
        else:
            redacted[key] = value
    
    return redacted
