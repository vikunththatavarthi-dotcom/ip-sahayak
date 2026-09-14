import app.services.language as language
import app.services.llm as llm


def test_translate_to_english_uses_fallback_on_timeout(monkeypatch):
    def fake_complete(*args, **kwargs):
        return "[Error: Local Ollama model took too long to respond. Please try again.]"

    monkeypatch.setattr(llm, "complete", fake_complete)
    monkeypatch.setattr(language, "_free_translate", lambda text, source, target: "What is patent novelty in India?")

    result = language.translate_to_english("भारत में पेटेंट की नवीनता क्या है?", "hi")

    assert result == "What is patent novelty in India?"


def test_translate_from_english_uses_fallback_on_timeout(monkeypatch):
    def fake_complete(*args, **kwargs):
        return "[Error: Local Ollama model took too long to respond. Please try again.]"

    monkeypatch.setattr(llm, "complete", fake_complete)
    monkeypatch.setattr(language, "_free_translate", lambda text, source, target: "पेटेंट नवीनता का अर्थ भारत में आविष्कार की नईता और नवाचार से है।")

    result = language.translate_from_english("Patent novelty means newness and inventive contribution in India.", "hi")

    assert result == "पेटेंट नवीनता का अर्थ भारत में आविष्कार की नईता और नवाचार से है।"
