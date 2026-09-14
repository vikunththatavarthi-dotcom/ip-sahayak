"""
Unit tests for IP-SAKTI Sahayak Voice STT & TTS.
"""

import os
from pathlib import Path
from src.voice.tts import synthesize_speech
from src.voice.stt import transcribe_audio


def test_tts_synthesis():
    text = "Ayurvedic medicine ko patent karane ke liye Form 1 file karein."
    res = synthesize_speech(text=text, language="hi")

    assert res["status"] == "success"
    assert res["audio_path"] is not None
    assert os.path.exists(res["audio_path"])
    assert res["audio_base64"] is not None
    assert len(res["audio_base64"]) > 50


def test_tts_empty_handling():
    res = synthesize_speech(text="", language="hi")
    assert res["status"] == "error"
