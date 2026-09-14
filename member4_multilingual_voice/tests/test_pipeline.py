"""
End-to-End Integration test for Member 4 Subsystem:
User Query (Hinglish/Hindi) -> Normalized English -> Mock RAG -> Localized Hindi/Hinglish -> Audio TTS.
"""

from src.multilingual.pipeline import process_multilingual_query, format_multilingual_response
from src.demo.mock_rag import MockIPRAGEngine
from src.voice.tts import synthesize_speech


def test_full_member4_pipeline_e2e():
    rag_engine = MockIPRAGEngine()

    # Step 1: User Input (Hinglish)
    raw_query = "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"

    # Step 2: Normalize
    processed = process_multilingual_query(raw_query)
    assert processed["detected_language"] == "hinglish"
    assert "ayurvedic" in processed["normalized_query"].lower()

    # Step 3: RAG Retrieval (Mock)
    rag_output = rag_engine.query(
        processed["normalized_query"],
        intent_category=processed["intent_category"]
    )
    assert "Patents Act, 1970" in rag_output["answer"]
    assert "Section 3(p)" in rag_output["answer"]

    # Step 4: Localize back to user language
    localized = format_multilingual_response(
        english_response=rag_output["answer"],
        target_language=processed["target_response_language"],
        style="hinglish"
    )
    assert len(localized["localized_response"]) > 0

    # Step 5: Synthesize speech
    tts_out = synthesize_speech(
        text=localized["localized_response"],
        language=processed["target_response_language"]
    )
    assert tts_out["status"] == "success"
    assert tts_out["audio_path"] is not None
