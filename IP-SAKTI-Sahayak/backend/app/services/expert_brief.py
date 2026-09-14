"""
services/expert_brief.py — One-click Expert Review Brief generator.

Produces a structured Markdown brief that a founder can hand to an IP
attorney or AYUSH consultant, pulling together their business profile,
latest chat context, and/or the most recent document analysis.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from app.models.db import BusinessProfile, Conversation, Message, UploadedDocument


def _fmt_ip_assets(raw_json: str) -> str:
    try:
        assets = json.loads(raw_json or "[]")
    except Exception:
        assets = []
    if not assets:
        return "- None on record\n"
    lines = []
    for a in assets:
        lines.append(
            f"- **{a.get('type', 'IP Asset')}** — App No: {a.get('application_number', 'N/A')}, "
            f"Status: {a.get('status', 'N/A')}, Filed: {a.get('filing_date', 'N/A')}"
        )
    return "\n".join(lines) + "\n"


def generate_brief_markdown(
    profile: Optional[BusinessProfile],
    conversation: Optional[Conversation],
    messages: list[Message],
    document: Optional[UploadedDocument],
    extra_notes: Optional[str],
) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    parts = [
        "# Expert Review Brief — IP-SAKTI Sahayak",
        f"*Generated {now}*",
        "",
        "> This brief is a decision-support summary, not legal advice. Please verify all "
        "citations and deadlines against official sources before acting.",
        "",
        "## 1. Business Context",
    ]

    if profile:
        parts += [
            f"- **Business / Innovator:** {profile.business_name or 'N/A'}",
            f"- **Entity Type:** {profile.entity_type or 'N/A'}",
            f"- **Location:** {profile.state_location or 'N/A'}",
            f"- **AYUSH Category:** {profile.ayush_category or 'N/A'}",
            f"- **Stage:** {profile.stage or 'N/A'}",
            f"- **Brand Name:** {profile.brand_name or 'N/A'}",
            "",
            "### Product / Formulation",
            profile.formulation_summary or "_Not provided._",
            "",
            "### Claims",
            profile.product_claims or "_Not provided._",
            "",
            "### Active IP Assets",
            _fmt_ip_assets(profile.active_ip_assets_json),
        ]
    else:
        parts.append("_No business profile on file._\n")

    parts.append("## 2. Relevant Q&A / Discussion")
    if messages:
        for m in messages[-10:]:
            role = "**User**" if m.role == "user" else "**Sahayak**"
            snippet = (m.text or "").strip()
            if len(snippet) > 800:
                snippet = snippet[:800] + "…"
            parts.append(f"- {role}: {snippet}")
            if m.confidence:
                parts.append(f"  - _Confidence: {m.confidence}_")
    else:
        parts.append("_No conversation linked._")
    parts.append("")

    parts.append("## 3. Document Analysis")
    if document:
        summary = {}
        try:
            summary = json.loads(document.summary_json or "{}")
        except Exception:
            pass
        parts += [
            f"- **File:** {document.filename}",
            f"- **Document Type:** {summary.get('doc_type', 'N/A')}",
            f"- **Deadline:** {summary.get('deadline_date', 'N/A')}",
            "- **Summary:**",
            summary.get("summary", "_N/A_"),
            "- **Key Requirements:**",
        ]
        reqs = summary.get("key_requirements", [])
        if reqs:
            parts += [f"  - {r}" for r in reqs]
        else:
            parts.append("  - _None extracted._")
    else:
        parts.append("_No document linked._")
    parts.append("")

    parts.append("## 4. Recommended Questions for Your IP Attorney / AYUSH Consultant")
    parts += [
        "1. Does the described formulation/process meet the novelty and inventive-step bar "
        "given Section 3(p) of the Patents Act?",
        "2. What is the fastest compliant route to protect the brand name given current filing timelines?",
        "3. Are there any outstanding AYUSH licensing gaps (Form 24D/25D, GMP, Rule 161 labelling) "
        "before commercial launch?",
        "4. Is there a live deadline (objection response, renewal, audit) that needs immediate action?",
    ]
    parts.append("")

    if extra_notes:
        parts += ["## 5. Additional Notes from User", extra_notes, ""]

    parts += [
        "---",
        "_IP-SAKTI Sahayak provides informational guidance based on referenced official sources. "
        "It is not a substitute for professional legal advice or official government decisions._",
    ]

    return "\n".join(parts)
