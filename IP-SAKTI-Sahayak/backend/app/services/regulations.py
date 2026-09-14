"""
services/regulations.py — Regulation Change Impact Engine.

Ships with a curated set of real/representative Indian IP & AYUSH regulatory
notifications. Matches them against a BusinessProfile to produce personalized
"why this applies to you" impact briefs. In production, SEED_NOTIFICATIONS
would be periodically refreshed from ipindia.gov.in / ayush.gov.in gazette
feeds; for this MVP it is a static, editable list (see the JSON file too).
"""
from __future__ import annotations

from typing import List

from app.models.db import BusinessProfile
from app.models.schemas import ImpactBrief, RegulationNotification

SEED_NOTIFICATIONS: List[dict] = [
    {
        "id": "reg-001",
        "title": "Revised Heavy Metal Limits in Herbal/Ayurvedic Extracts",
        "authority": "Ministry of AYUSH",
        "date": "2025-11-01",
        "summary": "Tightened permissible limits for lead, arsenic, cadmium and mercury in "
                   "herbal extracts and finished Ayurvedic/Siddha/Unani products, with mandatory "
                   "updated lab testing records before renewal of manufacturing licence.",
        "tags": ["ayurveda", "siddha", "unani", "multi-herb", "manufacturer", "startup", "msme"],
    },
    {
        "id": "reg-002",
        "title": "Reduced Patent & Trademark Statutory Fees for DPIIT-Recognised Startups",
        "authority": "IP India (CGPDTM)",
        "date": "2025-08-15",
        "summary": "Confirms continuation of up to 80% fee concession on patent filing and "
                   "examination fees, and reduced trademark fees, for DPIIT-recognised startups "
                   "and small entities.",
        "tags": ["startup", "msme", "individual"],
    },
    {
        "id": "reg-003",
        "title": "Draft Amendment: Expedited Examination for Traditional-Medicine-Adjacent Patents",
        "authority": "IP India (CGPDTM)",
        "date": "2025-09-20",
        "summary": "Proposes a fast-track examination lane for patent applications that build on "
                   "(but go beyond) traditional knowledge with demonstrated novel processing or "
                   "clinical data, aiming to cut pendency for AYUSH-adjacent innovation.",
        "tags": ["ayurveda", "siddha", "unani", "homeopathy", "multi-herb", "startup"],
    },
    {
        "id": "reg-004",
        "title": "Mandatory QR-Code Batch Traceability on Ayurvedic Product Labels",
        "authority": "Ministry of AYUSH",
        "date": "2025-12-01",
        "summary": "New labelling requirement mandating a scannable QR code per batch linking to "
                   "manufacturing licence, test certificate, and ingredient sourcing — in addition "
                   "to existing Rule 161 disclosures.",
        "tags": ["ayurveda", "siddha", "unani", "multi-herb", "manufacturer", "ready to launch", "commercialized"],
    },
    {
        "id": "reg-005",
        "title": "TKDL Access Expansion for Patent Examiners in International Offices",
        "authority": "CSIR-TKDL / WIPO",
        "date": "2025-07-10",
        "summary": "Expands Traditional Knowledge Digital Library (TKDL) access to more international "
                   "patent offices, increasing the likelihood that composition-only claims over known "
                   "traditional formulations will be flagged as prior art during international/PCT "
                   "examination.",
        "tags": ["ayurveda", "siddha", "unani", "homeopathy", "multi-herb"],
    },
    {
        "id": "reg-006",
        "title": "Simplified GMP Certification Renewal for Small AYUSH Manufacturers",
        "authority": "Ministry of AYUSH",
        "date": "2025-06-05",
        "summary": "Streamlines the Schedule T GMP renewal process for small-scale AYUSH manufacturers "
                   "with a self-declaration option in place of a full re-inspection, subject to a "
                   "random audit sampling.",
        "tags": ["msme", "manufacturer", "ayurveda", "siddha", "unani"],
    },
]


def _norm(s: str | None) -> str:
    return (s or "").strip().lower()


def get_all_notifications() -> List[RegulationNotification]:
    return [RegulationNotification(**n) for n in SEED_NOTIFICATIONS]


def get_impacts_for_profile(profile: BusinessProfile | None) -> List[ImpactBrief]:
    if profile is None:
        return []

    tags_of_interest = {
        _norm(profile.entity_type),
        _norm(profile.ayush_category),
        _norm(profile.stage),
    }
    tags_of_interest = {t for t in tags_of_interest if t}

    briefs: List[ImpactBrief] = []
    for n in SEED_NOTIFICATIONS:
        n_tags = {t.lower() for t in n["tags"]}
        overlap = tags_of_interest & n_tags
        if not overlap:
            continue

        # Impact level heuristic: more overlapping tags + stage relevance = higher impact
        stage = _norm(profile.stage)
        impact = "MEDIUM"
        if len(overlap) >= 2:
            impact = "HIGH"
        if stage in ("ready to launch", "commercialized") and any(
            t in n_tags for t in ("manufacturer", "ready to launch", "commercialized")
        ):
            impact = "HIGH"
        if len(overlap) == 1 and stage in ("ideation", "formulation"):
            impact = "LOW"

        why = (
            f"This notification applies because your profile matches: "
            f"{', '.join(sorted(overlap))}."
        )

        actions = []
        if "GMP" in n["title"] or "Heavy Metal" in n["title"] or "QR-Code" in n["title"]:
            actions.append("Review current lab testing / labelling records against the new requirement.")
            actions.append("Add a compliance-calendar deadline before your next licence renewal.")
        if "Fee" in n["title"] or "Expedited" in n["title"]:
            actions.append("Check eligibility for the concession/fast-track and update your filing budget/timeline.")
        if "TKDL" in n["title"]:
            actions.append("Run (or re-run) a TKDL prior-art search before filing or amending any patent claim.")
        if not actions:
            actions.append("Review the full notification text and consult an IP/AYUSH advisor if unsure.")

        briefs.append(ImpactBrief(
            notification=RegulationNotification(**n),
            impact_level=impact,
            why_it_applies=why,
            required_actions=actions,
        ))

    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    briefs.sort(key=lambda b: order.get(b.impact_level, 3))
    return briefs
