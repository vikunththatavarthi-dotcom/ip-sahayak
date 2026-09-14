"""
services/tk_risk.py — Traditional Knowledge (TK) sensitivity indicator.

Rule-based heuristic assessing whether an AYUSH formulation is likely to be
treated as unpatentable traditional knowledge under Section 3(p) of the
Indian Patents Act, vs. a genuinely novel, patentable invention.

This is NOT a substitute for a TKDL prior-art search or legal opinion —
it is a fast triage signal shown clearly as such to the user.
"""
from __future__ import annotations

import re
import uuid
from typing import List, Tuple

# A representative (non-exhaustive) list of well-known Ayurvedic/Siddha/Unani
# single herbs & classical formulations that are widely documented as
# traditional / public-domain knowledge (TKDL-indexed).
KNOWN_TK_INGREDIENTS = [
    "ashwagandha", "turmeric", "curcumin", "neem", "tulsi", "holy basil",
    "triphala", "amla", "brahmi", "shatavari", "guduchi", "giloy",
    "ginger", "black pepper", "piperine", "long pepper", "pippali",
    "licorice", "yashtimadhu", "haritaki", "bibhitaki", "aloe vera",
    "sandalwood", "cinnamon", "cardamom", "clove", "fenugreek",
    "moringa", "guggul", "arjuna", "punarnava", "chyawanprash",
]

NOVELTY_SIGNALS = [
    "nano", "nanoparticle", "novel extraction", "supercritical", "encapsulat",
    "synerg", "bioavailab", "patented process", "proprietary process",
    "standardized extract", "isolated compound", "novel delivery",
    "liposomal", "fermentation", "biotransformation", "clinical trial",
]

GENERIC_CLAIM_SIGNALS = [
    "immunity", "digestion", "stress relief", "general wellness", "traditional remedy",
    "boosts energy", "detox", "rejuvenat",
]


def _find_matches(text: str, vocabulary: List[str]) -> List[str]:
    text_l = text.lower()
    return [term for term in vocabulary if re.search(r"\b" + re.escape(term) + r"\b", text_l)]


def assess(ingredients: str, extraction_process: str | None, therapeutic_claims: str | None) -> dict:
    ingredients = ingredients or ""
    extraction_process = extraction_process or ""
    therapeutic_claims = therapeutic_claims or ""

    combined_process_claims = f"{extraction_process} {therapeutic_claims}"

    flagged = _find_matches(ingredients, KNOWN_TK_INGREDIENTS)
    novelty_hits = _find_matches(combined_process_claims, NOVELTY_SIGNALS)
    generic_hits = _find_matches(combined_process_claims, GENERIC_CLAIM_SIGNALS)

    num_ingredients = len([i for i in re.split(r"[,+&\n]", ingredients) if i.strip()])
    is_combination = num_ingredients >= 2

    # ---- Scoring heuristic (0 = highly sensitive/likely unpatentable, 1 = likely novel) ----
    score = 0.5
    score -= 0.08 * min(len(flagged), 4)          # known TK herbs pull toward "sensitive"
    score += 0.12 * min(len(novelty_hits), 4)       # documented novel process pulls toward "patentable"
    score -= 0.06 * min(len(generic_hits), 3)       # vague generic claims pull toward "sensitive"
    score += 0.10 if is_combination and len(flagged) >= 2 else 0.0  # combos can be novel if paired w/ process
    if not extraction_process.strip():
        score -= 0.08  # no documented process = harder to argue novelty
    score = max(0.0, min(1.0, score))

    if score >= 0.62:
        level = "LOW"
        pathway = "Novel formulation / process patent may be viable"
        recommendation = (
            "Your description includes signals of a documented novel process or synergistic "
            "formulation. This does not guarantee patentability, but it is a reasonable candidate "
            "for a patent claiming the specific process, ratio, or delivery mechanism — not the raw "
            "herbs themselves. Run a formal TKDL prior-art search before filing."
        )
    elif score >= 0.38:
        level = "MEDIUM"
        pathway = "Narrow process/combination patent + trademark for the brand"
        recommendation = (
            "This formulation combines known traditional ingredients. A patent purely on the "
            "ingredient mix is unlikely to succeed under Section 3(p). Consider narrowing the claim "
            "to a specific, non-obvious extraction ratio, delivery method, or clinically demonstrated "
            "synergistic effect — and rely on trademark + trade secret protection for the brand and "
            "exact process."
        )
    else:
        level = "HIGH"
        pathway = "AYUSH trademark + trade secret (patent on raw combination unlikely)"
        recommendation = (
            "This formulation closely resembles publicly documented traditional knowledge with generic "
            "therapeutic claims. Under Section 3(p) of the Patents Act, traditional knowledge and "
            "aggregation/duplication of known properties of traditionally known components are not "
            "patentable as such. Focus protection on your brand name (trademark), packaging (design), "
            "and any truly proprietary manufacturing process (trade secret) instead of a composition patent."
        )

    return {
        "id": str(uuid.uuid4()),
        "sensitivity_level": level,
        "sensitivity_score": round(score, 2),
        "recommendation": recommendation,
        "flagged_ingredients": flagged,
        "recommended_pathway": pathway,
    }
