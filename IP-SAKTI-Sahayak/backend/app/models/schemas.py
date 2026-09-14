"""
models/schemas.py — Pydantic request/response models for all API endpoints.
"""
from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


# ============================================================
# Shared sub-models
# ============================================================


class SourceRef(BaseModel):
    """A single retrieved knowledge-base source cited in an answer."""

    id: str
    title: str
    authority: Optional[str] = None
    url: Optional[str] = None
    document_type: Optional[str] = None
    relevance_score: Optional[float] = None


class Action(BaseModel):
    """A next-step action generated from the answer."""

    step: int
    description: str
    required_documents: List[str] = Field(default_factory=list)


class DeadlineInfo(BaseModel):
    deadline_date: Optional[str] = None
    description: Optional[str] = None


class DocumentSummary(BaseModel):
    doc_type: str = ""
    summary: str = ""
    deadline_date: Optional[str] = None
    key_requirements: List[str] = Field(default_factory=list)


# ============================================================
# POST /api/chat
# ============================================================


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4096, description="User's question")
    language: Optional[str] = Field(None, description="BCP-47 language tag, e.g. 'hi', 'ta'")
    conversation_id: Optional[str] = Field(None, description="Resume an existing conversation")


class ChatResponse(BaseModel):
    message_id: str
    conversation_id: str
    answer: str
    sources: List[SourceRef] = Field(default_factory=list)
    confidence: str = Field(description="HIGH | MEDIUM | LOW")
    confidence_score: float
    actions: List[Action] = Field(default_factory=list)
    detected_language: Optional[str] = None


# ============================================================
# POST /api/upload
# ============================================================


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    file_size: int
    extracted_text_preview: str = Field(description="First ~500 chars of extracted text")
    page_count: int = 0


# ============================================================
# POST /api/document/analyze
# ============================================================


class DocumentAnalyzeRequest(BaseModel):
    document_id: str
    question: Optional[str] = None
    language: Optional[str] = None


class DocumentAnalyzeResponse(BaseModel):
    document_id: str
    summary: DocumentSummary
    deadline: Optional[DeadlineInfo] = None
    requirements: List[str] = Field(default_factory=list)
    sources: List[SourceRef] = Field(default_factory=list)
    confidence: str = "MEDIUM"
    confidence_score: float = 0.0
    answer: Optional[str] = None


# ============================================================
# GET /api/sources
# ============================================================


class SourceListItem(BaseModel):
    id: str
    title: str
    authority: Optional[str] = None
    url: Optional[str] = None
    document_type: Optional[str] = None
    topic: Optional[str] = None
    publication_date: Optional[str] = None


class SourcesResponse(BaseModel):
    sources: List[SourceListItem]
    total: int


# ============================================================
# POST /api/feedback
# ============================================================


class FeedbackRequest(BaseModel):
    message_id: str
    rating: int = Field(..., description="1 for thumbs-up, -1 for thumbs-down")
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    ok: bool
    message_id: str


# ============================================================
# Digital Twin — Business Profile & Compliance Passport
# ============================================================


class IPAsset(BaseModel):
    type: str  # Patent/Trademark/Copyright/Design
    application_number: Optional[str] = None
    status: Optional[str] = None
    filing_date: Optional[str] = None


class BusinessProfileIn(BaseModel):
    business_name: Optional[str] = None
    entity_type: Optional[str] = None
    state_location: Optional[str] = None
    ayush_category: Optional[str] = None
    stage: Optional[str] = None
    brand_name: Optional[str] = None
    product_claims: Optional[str] = None
    formulation_summary: Optional[str] = None
    active_ip_assets: List[IPAsset] = Field(default_factory=list)


class BusinessProfileOut(BusinessProfileIn):
    id: str
    created_at: str
    updated_at: str


class ChecklistItem(BaseModel):
    priority: str  # HIGH/MEDIUM/LOW
    title: str
    description: str
    category: str  # ip_protection/ayush_regulatory/labelling/general


class CompliancePassport(BaseModel):
    profile_id: str
    protection_pathways: List[str]
    ayush_obligations: List[str]
    checklist: List[ChecklistItem]
    generated_at: str


# ============================================================
# TK Risk Indicator
# ============================================================


class TKRiskRequest(BaseModel):
    profile_id: Optional[str] = None
    ingredients: str = Field(..., min_length=1)
    extraction_process: Optional[str] = None
    therapeutic_claims: Optional[str] = None


class TKRiskResponse(BaseModel):
    id: str
    sensitivity_level: str  # HIGH/MEDIUM/LOW
    sensitivity_score: float
    recommendation: str
    flagged_ingredients: List[str]
    recommended_pathway: str


# ============================================================
# Regulation Impact Engine
# ============================================================


class RegulationNotification(BaseModel):
    id: str
    title: str
    authority: str
    date: str
    summary: str
    tags: List[str]


class ImpactBrief(BaseModel):
    notification: RegulationNotification
    impact_level: str  # HIGH/MEDIUM/LOW
    why_it_applies: str
    required_actions: List[str]


class RegulationImpactResponse(BaseModel):
    profile_id: Optional[str] = None
    impacts: List[ImpactBrief]


# ============================================================
# Compliance Calendar
# ============================================================


class ComplianceEventIn(BaseModel):
    profile_id: str
    title: str
    event_type: str = "manual"
    due_date: Optional[str] = None
    notes: Optional[str] = None


class ComplianceEventOut(ComplianceEventIn):
    id: str
    status: str
    source: str
    created_at: str


class CalendarResponse(BaseModel):
    events: List[ComplianceEventOut]


# ============================================================
# Expert Review Brief
# ============================================================


class ExpertBriefRequest(BaseModel):
    profile_id: Optional[str] = None
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None
    extra_notes: Optional[str] = None


# ============================================================
# Generic error
# ============================================================


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
    extra: Optional[Any] = None
