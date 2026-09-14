"""
services/rag.py — Core RAG pipeline: retrieval → grounded answer → confidence → actions.

Pipeline (per query):
  1. Detect language → translate query to English
  2. Embed query → similarity search in Chroma
  3. Build grounded prompt with retrieved chunks
  4. Call LLM → answer
  5. Score confidence
  6. Translate answer back to user's language
  7. Return structured response
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Dict, List, Optional, Set

from app.core.config import get_settings
from app.models.schemas import Action, ChatResponse, SourceRef
from app.services.confidence import score_confidence
from app.services.language import (
    LANGUAGE_NAMES,
    detect_language,
    normalize_language_code,
    translate_from_english,
    translate_to_english,
)
from app.services.llm import GROUNDING_SYSTEM_PROMPT, complete, complete_json
from app.services.vector_store import RetrievedChunk, similarity_search

logger = logging.getLogger(__name__)
settings = get_settings()


# ============================================================
# Prompt building
# ============================================================

def _build_grounded_prompt(
    query_en: str,
    chunks: List[RetrievedChunk],
    target_language: Optional[str] = None,
) -> str:
    """
    Build the user-facing prompt that injects retrieved evidence chunks.
    The LLM is instructed to answer ONLY from this evidence.
    """
    if not chunks:
        evidence_block = (
            "No relevant evidence was found in the knowledge base for this query."
        )
    else:
        evidence_parts = []
        for i, chunk in enumerate(chunks, start=1):
            source_label = chunk.source_title or "Unknown Source"
            authority = chunk.authority or ""
            url = chunk.source_url or ""
            meta_line = f"Source: {source_label}"
            if authority:
                meta_line += f" | Authority: {authority}"
            if url:
                meta_line += f" | URL: {url}"
            snippet = chunk.text[:600] if len(chunk.text) > 600 else chunk.text
            evidence_parts.append(
                f"[Evidence {i}]\n{meta_line}\n\n{snippet}"
            )
        evidence_block = "\n\n---\n\n".join(evidence_parts)

    target_language_name = LANGUAGE_NAMES.get(target_language or "en", "English")
    return (
        f"EVIDENCE (use ONLY the following to answer the question):\n\n"
        f"{evidence_block}\n\n"
        f"---\n\n"
        f"QUESTION: {query_en}\n\n"
        f"IMPORTANT OUTPUT RULES:\n"
        f"- Answer in {target_language_name}.\n"
        f"- Do not answer in English unless there is no reliable {target_language_name} equivalent for a technical or legal term.\n"
        f"- Preserve important legal/IP terms like Patent, Novelty, Prior Art, Inventive Step, Trademark, Copyright, TKDL, and AYUSH in English when needed.\n"
        f"- Cite source titles for every factual claim.\n"
        f"- If the evidence does not fully answer the question, say so explicitly.\n"
        f"- End with numbered Next Steps if supported by evidence."
    )


# ============================================================
# Action extraction
# ============================================================

_ACTION_EXTRACTION_PROMPT = """Based on the following answer about Indian IP or AYUSH regulations, \
extract a structured list of next steps the user should take.

Respond with valid JSON only:
{{
  "actions": [
    {{
      "step": 1,
      "description": "<concrete action>",
      "required_documents": ["<doc1>", "<doc2>"]
    }}
  ]
}}

If no clear next steps can be extracted, return {{"actions": []}}.

Answer text:
{answer}
"""


def _extract_actions(answer: str) -> List[Action]:
    """Parse next steps from the LLM answer into structured Action objects."""
    import re
    # 1. Fast regex extraction from text (prevents double LLM call latency)
    regex_actions: List[Action] = []
    lines = answer.split("\n")
    in_next_steps = False
    for line in lines:
        line_s = line.strip()
        if any(h in line_s.lower() for h in ["next step", "अगले कदम", "அடுத்த படிகள்", "తదుపరి దశలు", "actions to take"]):
            in_next_steps = True
            continue
        m = re.match(r"^(?:(?:Step|चरण|படி|దశ)\s*)?(\d+)[\.\:\)]\s*(.*)", line_s, re.IGNORECASE)
        if m:
            step_num = int(m.group(1))
            desc = m.group(2).strip()
            if desc and len(desc) > 5:
                regex_actions.append(Action(step=step_num, description=desc, required_documents=[]))
        elif in_next_steps and re.match(r"^[\*\-\•]\s*(.*)", line_s):
            m_bullet = re.match(r"^[\*\-\•]\s*(.*)", line_s)
            desc = m_bullet.group(1).strip()
            if desc and len(desc) > 5:
                regex_actions.append(Action(step=len(regex_actions) + 1, description=desc, required_documents=[]))

    if regex_actions:
        return regex_actions[:5]

    # 2. LLM fallback if regex found no steps
    try:
        raw = complete_json(
            _ACTION_EXTRACTION_PROMPT.format(answer=answer[:2000]),
            max_tokens=512,
        )
        data = json.loads(raw)
        actions = []
        for item in data.get("actions", []):
            actions.append(
                Action(
                    step=item.get("step", len(actions) + 1),
                    description=item.get("description", ""),
                    required_documents=item.get("required_documents", []),
                )
            )
        return actions
    except Exception as e:
        logger.warning(f"Action extraction failed: {e}")
        return []


# ============================================================
# Main RAG function
# ============================================================

def detect_query_intent(query: str) -> str:
    """Classify user query intent into one of 15 statutory domain categories."""
    q = query.lower()
    if any(k in q for k in ["deadline", "due date", "expiry", "time limit", "days left"]):
        return "DEADLINE"
    elif any(k in q for k in ["ayush", "ayurved", "siddha", "unani", "herb", "turmeric", "ashwagandha", "neem"]):
        return "AYUSH"
    elif any(k in q for k in ["tkdl", "traditional knowledge", "prior art", "section 3(p)"]):
        return "TRADITIONAL_KNOWLEDGE"
    elif any(k in q for k in ["biological", "nba", "biodiversity", "nba approval", "form iii", "abs"]):
        return "BIOLOGICAL_MATERIAL"
    elif any(k in q for k in ["patentability", "novelty", "inventive step", "section 3(d)", "patentable"]):
        return "PATENTABILITY"
    elif any(k in q for k in ["trademark", "brand", "logo", "class 5", "nice class", "tm-a"]):
        return "TRADEMARK"
    elif any(k in q for k in ["copyright", "manual", "artwork", "literary"]):
        return "COPYRIGHT"
    elif any(k in q for k in ["design", "bottle shape", "visual appearance"]):
        return "DESIGN"
    elif any(k in q for k in ["gi", "geographical indication"]):
        return "GI"
    elif any(k in q for k in ["msme", "startup", "health check", "subsidy"]):
        return "MSME"
    elif any(k in q for k in ["section", "act", "provision", "rule", "law"]):
        return "LEGAL_EXPLANATION"
    elif any(k in q for k in ["checklist", "document required", "form"]):
        return "COMPLIANCE"
    elif any(k in q for k in ["process", "procedure", "how to file", "steps"]):
        return "APPLICATION_PROCEDURE"
    elif any(k in q for k in ["scan", "examination report", "office action"]):
        return "DOCUMENT_QA"
    return "GENERAL_IP"


def prioritize_chunks(chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
    """
    Sort retrieved chunks according to authority hierarchy (Feature 19):
    1. Current official Act
    2. Current Rules
    3. Official government guidelines
    4. Official manuals
    5. Official forms/procedures
    6. Official government FAQs
    7. Historical/Draft documents
    """
    def priority_score(chunk: RetrievedChunk) -> int:
        dt = (chunk.metadata.get("document_type") or "").lower()
        title = (chunk.source_title or "").lower()

        if "act" in dt or "act" in title:
            return 10
        elif "rule" in dt or "rules" in title:
            return 9
        elif "guideline" in dt or "guidelines" in title:
            return 8
        elif "manual" in dt or "manuals" in title:
            return 7
        elif "form" in dt or "notice" in title:
            return 6
        elif "faq" in dt:
            return 5
        elif "draft" in dt or "historical" in dt:
            return 1
        return 4

    return sorted(chunks, key=lambda c: (priority_score(c), c.score), reverse=True)


def _relevant_domains(query_en: str, requested_domain: Optional[str]) -> Set[str]:
    """Identify every knowledge domain implicated by the question."""
    domains: Set[str] = {"ip", "regulatory"}
    if requested_domain == "ayurveda":
        domains.add("ayurveda")
    query = query_en.lower()
    ayurveda_terms = (
        "ayurved", "ayush", "traditional knowledge", "tkdl", "herb", "herbal",
        "medicinal plant", "formulation", "siddha", "unani", "sowa rigpa",
    )
    if any(term in query for term in ayurveda_terms):
        domains.add("ayurveda")
    return domains


def _select_cross_domain_chunks(
    chunks: List[RetrievedChunk], domains: Set[str], limit: int
) -> List[RetrievedChunk]:
    """Keep evidence from each implicated domain before filling remaining slots."""
    ranked = prioritize_chunks(chunks)
    selected: List[RetrievedChunk] = []
    seen_domains: Set[str] = set()
    for chunk in ranked:
        chunk_domain = str(chunk.metadata.get("domain", "")).lower()
        if chunk_domain in domains and chunk_domain not in seen_domains:
            selected.append(chunk)
            seen_domains.add(chunk_domain)
        if len(selected) >= limit:
            return selected
    for chunk in ranked:
        if chunk not in selected:
            selected.append(chunk)
        if len(selected) >= limit:
            break
    return selected


# ============================================================
# Main RAG function
# ============================================================

async def answer_query(
    query: str,
    language: Optional[str] = None,
    domain: Optional[str] = None,
    conversation_id: Optional[str] = None,
    extra_context: Optional[str] = None,
) -> ChatResponse:
    """
    Full RAG pipeline with intent routing & source prioritization.

    Args:
        query: User's question
        language: BCP-47 language code (e.g., 'hi', 'ta', 'en')
        domain: UI preference; combined queries still retrieve all relevant domains.
        conversation_id: Resume existing conversation
        extra_context: Extra context to add to the query
    """
    # 1. Intent Routing (Feature 18)
    intent = detect_query_intent(query)
    logger.info(f"Query intent detected: {intent}")

    # 2. Language detection & normalisation
    detected_lang = normalize_language_code(language or detect_language(query))
    logger.info(f"Query language detected: {detected_lang}")

    # 3. Translate query to English for retrieval
    query_en = translate_to_english(query, detected_lang)
    logger.info(f"English query: {query_en[:120]}")

    # 4. Retrieve broadly then keep evidence across every implicated domain.
    # A strict Ayurveda filter would hide patent material for combined queries.
    domains = _relevant_domains(query_en, domain)
    raw_chunks = similarity_search(query_en, top_k=max(settings.retrieval_top_k * 4, 8))
    domain_chunks = [
        chunk for chunk in raw_chunks
        if str(chunk.metadata.get("domain", "")).lower() in domains
    ]
    chunks = _select_cross_domain_chunks(domain_chunks or raw_chunks, domains, settings.retrieval_top_k)
    chunks = [chunk for chunk in chunks if chunk.score >= settings.retrieval_min_score]

    top_score = f"{chunks[0].score:.3f}" if chunks else "N/A"
    logger.info(f"Retrieved & prioritized {len(chunks)} chunks (top score: {top_score})")

    # 5. Build grounded prompt (inject extra context first if provided)
    full_query = query_en
    if extra_context:
        full_query = f"Document context:\n{extra_context[:2000]}\n\nUser question: {query_en}"

    grounded_prompt = _build_grounded_prompt(full_query, chunks, target_language=detected_lang)

    # 6. Refuse safely on retrieval failure instead of generating an answer.
    if not chunks:
        answer_en = (
            "I could not retrieve sufficiently relevant supporting material from the current "
            "knowledge base, so I cannot provide a reliable answer. Please consult the official "
            "IP India, Ministry of AYUSH, TKDL, or WIPO source for this issue. "
            "This is informational guidance, not legal or medical advice."
        )
        answer_final = translate_from_english(answer_en, detected_lang)
    else:
        answer_en = complete(grounded_prompt, system_prompt=GROUNDING_SYSTEM_PROMPT)
        if answer_en.lstrip().startswith("[Local Ollama Not Detected]") or answer_en.lstrip().startswith("[STUB"):
            answer_en = (
                "Supporting sources were retrieved, but the answer generator is not available. "
                "Start the configured local Ollama model or configure the optional Anthropic provider, "
                "then ask again. No substantive legal or medical conclusion is being made."
            )
            answer_final = translate_from_english(answer_en, detected_lang)
        else:
            answer_final = answer_en

    # 7. Confidence scoring
    confidence_result = score_confidence(chunks, answer_final)
    logger.info(
        f"Confidence: {confidence_result.label} (score={confidence_result.score})"
    )

    # 9. Extract actions
    actions = _extract_actions(answer_en)

    # 10. Build source references
    sources: List[SourceRef] = []
    seen_ids: set[str] = set()
    for chunk in chunks:
        sid = chunk.source_id or chunk.chunk_id
        if sid in seen_ids:
            continue
        seen_ids.add(sid)
        sources.append(
            SourceRef(
                id=sid,
                title=chunk.source_title or "Unknown Source",
                authority=chunk.authority,
                url=chunk.source_url,
                document_type=chunk.metadata.get("document_type"),
                relevance_score=round(chunk.score, 4),
                snippet=chunk.text[:800] + ("..." if len(chunk.text) > 800 else ""),
            )
        )

    # 11. Assemble response
    conv_id = conversation_id or str(uuid.uuid4())
    message_id = str(uuid.uuid4())

    return ChatResponse(
        message_id=message_id,
        conversation_id=conv_id,
        answer=answer_final,
        sources=sources,
        confidence=confidence_result.label,
        confidence_score=confidence_result.score,
        actions=actions,
        detected_language=detected_lang,
    )
