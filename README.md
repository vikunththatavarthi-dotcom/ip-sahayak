# 🌐 IP-SAKTI Sahayak — Member 4: Multilingual & Voice Subsystem

> **Empowering Grassroots Indian Innovators with Voice-First Multilingual Patent & IP Assistance.**  
> Supports **English + Hindi (Devanagari) + Colloquial Hinglish (Roman Script)** with **BHASHINI (MeitY)** integration readiness.

---

## 📌 1. Overview & Flow

Indian innovators, artisans, MSMEs, and student inventors often express their patent and trademark questions in **Hindi or colloquial Hinglish** (*e.g., "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"*). However, Indian Patent Acts (1970), legal rulings, and RAG knowledge bases are in **formal English**.

**Member 4 Subsystem** solves this language divide:

```
[User Voice / Microphone]
         ↓
  (Speech-to-Text)
         ↓
[User Text: Hindi / Hinglish / English]
         ↓
process_multilingual_query(text, language)  ──→ [Language & Script Detection]
                                            ──→ [Domain-Aware Normalization]
         ↓
[Clean Normalized English Query + IP Intent]
         ↓
[IP-SAKTI RAG Engine & Indian Patent Law Knowledge Base]
         ↓
[English Grounded Legal Answer]
         ↓
format_multilingual_response(answer, lang, style) ──→ [Devanagari Hindi / Hinglish]
         ↓
(Text-to-Speech Engine / Audio Synthesis)
         ↓
[User Audio Playback .mp3]
```

---

## 🚀 2. Quick Start & Integration

### Installation
```bash
pip install -r requirements.txt
```

### Quick Code Example (How other team members import this)
```python
from src import (
    process_multilingual_query,
    format_multilingual_response,
    synthesize_speech,
    transcribe_audio,
)

# 1. User asks a question in Hinglish
raw_query = "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"

# 2. Process & Normalize the query for RAG
query_info = process_multilingual_query(raw_query)
print("Normalized for RAG:", query_info["normalized_query"])
# Output: 'How can I patent my Ayurvedic medicine formulation in India?'
print("Detected Language:", query_info["language"])
# Output: 'Hinglish (Hindi-English)'

# 3. Pass normalized query to your RAG engine
# english_rag_answer = rag_engine.query(query_info["normalized_query"])
english_rag_answer = (
    "Under Section 3(p) of the Patents Act 1970, Ayurvedic medicine requires "
    "novelty, synergistic effect, and approval from the National Biodiversity Authority (NBA)."
)

# 4. Localize response back to user's language & style
response_info = format_multilingual_response(
    english_response=english_rag_answer,
    target_language=query_info["target_response_language"],  # 'hindi'
    style=query_info["target_response_style"]                # 'hinglish' or 'devanagari'
)
print("Localized Answer:\n", response_info["localized_response"])

# 5. Generate Voice Audio
audio_info = synthesize_speech(
    text=response_info["localized_response"],
    language="hi"
)
print("Voice Audio file saved to:", audio_info["audio_path"])
```

---

## 🛠️ 3. Standard Interface Specifications

### A. `process_multilingual_query(text: str, language: Optional[str] = None)`
**Input:**
```python
text = "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"
```
**Returns:**
```json
{
  "original_query": "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?",
  "normalized_query": "How can I patent my Ayurvedic medicine formulation in India?",
  "language": "Hinglish (Hindi-English)",
  "detected_language": "hinglish",
  "detected_script": "latin",
  "confidence": 0.95,
  "is_code_mixed": true,
  "intent_category": "patent_ayurvedic_traditional_knowledge",
  "extracted_keywords": ["ayurvedic medicine", "patent"],
  "target_response_language": "hindi",
  "target_response_style": "hinglish",
  "engine": "rule_based_hinglish_normalizer"
}
```

### B. `format_multilingual_response(english_response: str, target_language: str, style: str)`
**Input:**
```python
english_response = "To patent an Ayurvedic medicine in India, you must satisfy Section 3(p)..."
```
**Returns:**
```json
{
  "original_english_response": "...",
  "localized_response": "Ayurvedic medicine ko patent karane ke liye aapko kuch baaton ka dhyan rakhna hoga: 1. Novelty (Section 3(p))...",
  "language": "hindi",
  "style": "hinglish",
  "engine": "rule_based_hinglish_generator"
}
```

---

## 🎙️ 4. Voice Subsystem (STT & TTS)

- **Speech-to-Text (`transcribe_audio`)**: Supports audio files (`.wav`, `.mp3`, `.m4a`) and microphone audio streams with automatic speech recognition for Hindi and Indian English.
- **Text-to-Speech (`synthesize_speech`)**: Generates crystal clear audio voice outputs in `.mp3` format and base64 encoded streams for web audio player widgets.
- **Microphone Recorder (`record_audio_from_mic`)**: Records live queries from physical microphones with ambient noise calibration.

---

## 🏛️ 5. BHASHINI (MeitY) Architecture Roadmap

This module is designed to adhere to the Government of India's **BHASHINI (National Language Translation Mission)** standard:

1. **Tier 1 (BHASHINI Live)**: Configured in `src/multilingual/bhashini_client.py` for ULCA pipeline inference (ASR $\rightarrow$ NMT $\rightarrow$ TTS).
2. **Tier 2 (Generative LLM)**: Gemini / OpenAI zero-shot domain normalizer for nuanced Indian dialect code-switching.
3. **Tier 3 (Zero-Dependency Offline Fallback)**: Built-in semantic normalizer and `deep-translator` ensuring **100% demo uptime** during hackathon judging.

---

## 🖥️ 6. Running the Demo & Tests

### Run Unit & Integration Tests:
```bash
python -m pytest tests -v
```

### Interactive CLI Mode (Live Terminal Demo):
```bash
python -m src.demo.app
```

### Run Single Query via CLI:
```bash
python -m src.demo.app --query "Maine Ayurvedic medicine banayi hai, isko patent kaise karu?"
```

### Launch Interactive Web Dashboard:
```bash
python -m src.demo.app --web --port 5000
```
Open `http://localhost:5000` in your browser.

---

## 📊 7. PPT Slide Talking Points (For Member 4 Presentation)

| Topic | Key Pitch / Highlight |
|---|---|
| **Problem Addressed** | 90%+ of grassroots inventors in India speak Hindi/Hinglish, while Indian Patent Office (IPO) and legal databases are exclusively in English. |
| **Our Solution** | Real-time bilingual code-switching normalizer converting conversational Hinglish to search-optimized English legal queries. |
| **Statutory Preservation** | Retains critical IP terminology (Section 3(p), Section 3(d), NBA approval, Form 1/2, TM-A) across translations. |
| **Voice-First Accessibility** | Full end-to-end voice loop (Whisper/STT $\rightarrow$ Translation $\rightarrow$ RAG $\rightarrow$ Localized TTS audio). |
| **Digital India / Bhashini** | Architecture ready for MeitY's Bhashini ULCA API pipeline with 3-tier offline safety fallback. |
