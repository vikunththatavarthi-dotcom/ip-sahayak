"""
Unit tests for IP-SAKTI Sahayak Multilingual detection, normalization, and translation.
"""

import pytest
from src.multilingual.detector import detect_language_and_script
from src.multilingual.normalizer import QueryNormalizer
from src.multilingual.translator import ResponseTranslator
from src.multilingual.pipeline import process_multilingual_query, format_multilingual_response


def test_language_detection_hinglish():
    query = "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"
    res = detect_language_and_script(query)
    assert res["language"] == "hinglish"
    assert res["script"] == "latin"
    assert res["is_code_mixed"] is True


def test_language_detection_hindi_devanagari():
    query = "आयुर्वेदिक दवा का पेटेंट कैसे कराएं?"
    res = detect_language_and_script(query)
    assert res["language"] == "hindi"
    assert res["script"] == "devanagari"


def test_language_detection_english():
    query = "How can I register my trademark and logo in India?"
    res = detect_language_and_script(query)
    assert res["language"] == "english"
    assert res["script"] == "latin"


def test_process_multilingual_query_hinglish_example():
    """Tests the exact hackathon user prompt example."""
    raw_query = "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"
    result = process_multilingual_query(raw_query)

    assert "normalized_query" in result
    assert "language" in result
    assert "ayurvedic" in result["normalized_query"].lower()
    assert "patent" in result["normalized_query"].lower()
    assert result["detected_language"] == "hinglish"
    assert result["target_response_language"] == "hindi"


def test_process_multilingual_query_trademark_hinglish():
    raw_query = "Brand name aur logo register karne ke liye kitna fees lagta hai?"
    result = process_multilingual_query(raw_query)

    assert "trademark" in result["normalized_query"].lower() or "logo" in result["normalized_query"].lower()
    assert result["detected_language"] == "hinglish"


def test_format_multilingual_response_hinglish():
    english_answer = (
        "Under Section 3(p) of the Patents Act 1970, Ayurvedic medicine requires novelty and NBA approval."
    )
    result = format_multilingual_response(english_answer, target_language="hindi", style="hinglish")

    assert "localized_response" in result
    assert len(result["localized_response"]) > 0
    assert result["style"] == "hinglish"


def test_format_multilingual_response_devanagari():
    english_answer = "Patent application requires Form 1 and Form 2."
    result = format_multilingual_response(english_answer, target_language="hindi", style="devanagari")

    assert "localized_response" in result
    assert len(result["localized_response"]) > 0
