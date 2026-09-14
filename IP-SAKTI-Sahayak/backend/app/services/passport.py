"""
services/passport.py — Compliance Digital Twin & Passport generator.

Rule-based engine (no LLM call needed) that evaluates a BusinessProfile
and produces:
  - Recommended IP protection pathways
  - AYUSH regulatory obligations
  - A priority-tagged actionable checklist
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.models.db import BusinessProfile
from app.models.schemas import ChecklistItem, CompliancePassport

AYUSH_CATEGORIES = {"ayurveda", "siddha", "unani", "homeopathy", "yoga", "multi-herb"}

STAGE_ORDER = ["ideation", "formulation", "clinical trial", "ready to launch", "commercialized"]


def _norm(s: str | None) -> str:
    return (s or "").strip().lower()


def generate_passport(profile: BusinessProfile) -> CompliancePassport:
    entity_type = _norm(profile.entity_type)
    ayush_category = _norm(profile.ayush_category)
    stage = _norm(profile.stage)
    is_ayush = ayush_category in AYUSH_CATEGORIES and ayush_category != ""

    pathways: List[str] = []
    obligations: List[str] = []
    checklist: List[ChecklistItem] = []

    # ---- IP protection pathway recommendations ----
    if profile.formulation_summary or profile.product_claims:
        pathways.append(
            "Patent — if the formulation involves a novel process, synergistic combination, "
            "or non-obvious extraction method (raw traditional herb mixes alone are not patentable "
            "under Section 3(p) of the Patents Act)."
        )
        checklist.append(ChecklistItem(
            priority="HIGH",
            title="Run a Traditional Knowledge (TK) sensitivity check",
            description="Before filing, assess whether your formulation is genuinely novel vs. based on "
                        "publicly known traditional knowledge, using the TK Risk Indicator.",
            category="ip_protection",
        ))
    if profile.brand_name:
        pathways.append("Trademark — protect the brand/product name, logo, and packaging trade dress.")
        checklist.append(ChecklistItem(
            priority="HIGH",
            title="File a trademark application for your brand name",
            description=f"Register '{profile.brand_name}' under the correct NICE class (typically Class 5 "
                        "for medicinal preparations, Class 3 for cosmetics) before public launch.",
            category="ip_protection",
        ))
    pathways.append("Trade Secret — for manufacturing processes/ratios you choose not to disclose publicly.")
    if stage in ("ready to launch", "commercialized"):
        pathways.append("Design Registration — if packaging or product shape is visually distinctive.")

    # ---- AYUSH regulatory obligations ----
    if is_ayush:
        obligations.append("AYUSH Drug Manufacturing Licence (Form 24D/25D) from the State Licensing Authority.")
        obligations.append("Good Manufacturing Practices (GMP) compliance under Schedule T of the Drugs & Cosmetics Rules.")
        obligations.append("Labelling compliance under Rule 161 (ingredient list, batch no., mfg/expiry dates, "
                            "licence number, dosage/usage directions).")
        if entity_type in ("startup", "msme", "manufacturer"):
            obligations.append("Certificate of Pharmaceutical Product (CoPP) if planning to export.")
        checklist.append(ChecklistItem(
            priority="HIGH" if stage in ("ready to launch", "commercialized") else "MEDIUM",
            title="Confirm AYUSH manufacturing licence status",
            description="Apply for/renew Form 24D (manufacturing licence) and Form 25D (loan licence, if applicable) "
                        "with your State AYUSH Licensing Authority before commercial sale.",
            category="ayush_regulatory",
        ))
        checklist.append(ChecklistItem(
            priority="MEDIUM",
            title="Audit product labels against Rule 161",
            description="Ensure every SKU's label carries the mandatory disclosures — ingredient list, batch "
                        "number, manufacturing/expiry dates, licence number, and directions for use.",
            category="labelling",
        ))

    # ---- Stage-based checklist ----
    try:
        stage_idx = STAGE_ORDER.index(stage)
    except ValueError:
        stage_idx = 0

    if stage_idx <= 1:  # Ideation / Formulation
        checklist.append(ChecklistItem(
            priority="MEDIUM",
            title="Document your R&D trail",
            description="Keep dated lab notebooks, formulation iterations, and test results — this becomes "
                        "critical evidence of novelty and inventorship if you file a patent later.",
            category="general",
        ))
    if stage_idx >= 2:  # Clinical Trial and beyond
        checklist.append(ChecklistItem(
            priority="MEDIUM",
            title="Retain clinical/safety trial documentation",
            description="Safety and efficacy data will be required for AYUSH licensing and strengthens any "
                        "future patent or regulatory submission.",
            category="ayush_regulatory",
        ))
    if stage_idx >= 3 and entity_type in ("startup", "msme"):
        checklist.append(ChecklistItem(
            priority="LOW",
            title="Check MSME/Startup India fee concessions",
            description="Startups and MSMEs recognised by DPIIT are eligible for up to 80% reduction in "
                        "patent and trademark statutory fees — verify eligibility before filing.",
            category="general",
        ))

    if not checklist:
        checklist.append(ChecklistItem(
            priority="LOW",
            title="Complete your business profile",
            description="Add formulation, brand, and stage details to generate a tailored compliance checklist.",
            category="general",
        ))

    # Sort checklist by priority
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    checklist.sort(key=lambda c: order.get(c.priority, 3))

    return CompliancePassport(
        profile_id=profile.id,
        protection_pathways=pathways or ["Add product/brand details to see recommended IP pathways."],
        ayush_obligations=obligations or ["No AYUSH-specific obligations detected (non-AYUSH profile)."],
        checklist=checklist,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
