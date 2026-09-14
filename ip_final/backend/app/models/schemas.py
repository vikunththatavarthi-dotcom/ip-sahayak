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
    snippet: Optional[str] = None


class Action(BaseModel):
    """A next-step action generated from the answer."""

    step: int
    description: str
    required_documents: List[str] = Field(default_factory=list)


# ============================================================
# Language and Domain Options
# ============================================================


class LanguageOption(BaseModel):
    """Available language option."""

    code: str = Field(description="BCP-47 language code, e.g. 'hi', 'ta'")
    name: str = Field(description="Language name in English")
    native_name: str = Field(description="Language name in native script")


class DomainOption(BaseModel):
    """Available IP domain/category."""

    id: str = Field(description="Domain identifier: general_ip, patent, trademark, etc.")
    name: str = Field(description="Display name")
    description: str = Field(description="Short description of this domain")
    icon: Optional[str] = Field(None, description="Emoji or icon identifier")


class ConfigResponse(BaseModel):
    """Available languages and domains."""

    languages: List[LanguageOption] = Field(description="Supported languages")
    domains: List[DomainOption] = Field(description="Supported IP domains")


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
    domain: Optional[str] = Field("general_ip", description="IP domain: general_ip, patent, trademark, copyright, design, gi, ayurveda")
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
# Generic error
# ============================================================


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
    extra: Optional[Any] = None


# ============================================================
# Business Profile & Compliance Passport Schemas
# ============================================================


class IPAssetSchema(BaseModel):
    asset_type: str = Field(description="Patent | Trademark | GI | Copyright")
    title: str = Field(..., min_length=1)
    status: str = Field(default="Granted", description="Granted | Pending | Draft | Expired")
    registration_no: Optional[str] = None


class BusinessProfileCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=256)
    sector: str = Field(default="AYUSH", description="AYUSH | Pharma | Biotech | Software | MSME | Other")
    company_type: str = Field(default="Startup", description="Startup | MSME | Enterprise | Researcher")
    registration_number: Optional[str] = None
    state: Optional[str] = None
    ip_assets: List[IPAssetSchema] = Field(default_factory=list)


class BusinessProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    sector: Optional[str] = None
    company_type: Optional[str] = None
    registration_number: Optional[str] = None
    state: Optional[str] = None
    ip_assets: Optional[List[IPAssetSchema]] = None


class BusinessProfileResponse(BaseModel):
    id: str
    company_name: str
    sector: str
    company_type: str
    registration_number: Optional[str] = None
    state: Optional[str] = None
    ip_assets: List[IPAssetSchema] = Field(default_factory=list)
    created_at: str
    updated_at: str


class ChecklistItem(BaseModel):
    item: str
    status: str = Field(description="PASSED | WARNING | CRITICAL")
    guidance: str


class AssetBreakdown(BaseModel):
    patents_count: int = 0
    trademarks_count: int = 0
    copyrights_count: int = 0
    gis_count: int = 0
    total_assets: int = 0


class CompliancePassportResponse(BaseModel):
    profile_id: str
    company_name: str
    sector: str
    company_type: str
    overall_score: int = Field(description="Compliance Score between 0 and 100")
    status_level: str = Field(description="EXCELLENT | GOOD | NEEDS_ATTENTION | HIGH_RISK")
    asset_breakdown: AssetBreakdown
    compliance_checklist: List[ChecklistItem] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    next_filing_deadline: Optional[str] = None


# ============================================================
# TKDL Risk Assessment Schemas (POST /api/tk-risk/assess)
# ============================================================


class IngredientInput(BaseModel):
    name: str = Field(..., min_length=1, description="Common or traditional herb name e.g. Ashwagandha")
    latin_name: Optional[str] = Field(None, description="Botanical name e.g. Withania somnifera")
    percentage: Optional[float] = Field(None, description="Composition percentage")


class TKRiskRequest(BaseModel):
    formulation_name: str = Field(..., min_length=1, max_length=256)
    system: str = Field(default="Ayurveda", description="Ayurveda | Siddha | Unani | Polyherbal")
    ingredients: List[IngredientInput] = Field(..., min_items=1)
    proposed_claims: Optional[str] = Field(None, description="Intended therapeutic benefit or product claim")


class TKMatchResult(BaseModel):
    ingredient_name: str
    traditional_name: str
    latin_name: str
    system: str
    tkdl_reference: str
    classical_text_source: str
    risk_factor: str = Field(description="HIGH_PRIOR_ART | MODERATE | LOW")
    known_therapeutic_use: str


class TKRiskResponse(BaseModel):
    formulation_name: str
    system: str
    overall_risk_score: int = Field(description="Section 3(p) Patent Rejection Risk (0-100)")
    risk_level: str = Field(description="HIGH_RISK | MODERATE_RISK | LOW_RISK")
    matched_entries: List[TKMatchResult] = Field(default_factory=list)
    patentability_assessment: str
    key_recommendations: List[str] = Field(default_factory=list)
    section_3p_compliance_status: str


# ============================================================
# IP Type Recommender Schemas (Feature 1)
# ============================================================


class IPTypeRecommendation(BaseModel):
    ip_type: str  # Patent | Trademark | Design | Copyright | Geographical Indication | Traditional Knowledge
    relevant: bool
    status: str  # Highly Relevant | Potentially Relevant | Not Relevant | Requires Verification
    why: str
    potential_areas: List[str] = Field(default_factory=list)


class IPRecommendRequest(BaseModel):
    description: str = Field(..., min_length=5, description="Product or invention description")


class IPRecommendResponse(BaseModel):
    recommendations: List[IPTypeRecommendation]
    summary: str
    disclaimer: str = "This is a preliminary assessment and does not constitute legal advice."


# ============================================================
# Patentability Pre-Screen Schemas (Feature 2)
# ============================================================


class PatentabilityRequest(BaseModel):
    title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    ingredients: Optional[str] = None
    technical_process: Optional[str] = None
    claimed_new: Optional[str] = None
    technical_advantage: Optional[str] = None
    is_tk_involved: bool = False
    is_biological_involved: bool = False


class PatentabilityResponse(BaseModel):
    novelty: str = "UNKNOWN"  # LOW | MEDIUM | HIGH | UNKNOWN
    inventive_step: str = "UNKNOWN"  # LOW | MEDIUM | HIGH | UNKNOWN
    industrial_applicability: str = "HIGH"  # LOW | MEDIUM | HIGH | UNKNOWN
    tk_risk: str = "UNKNOWN"  # LOW | MEDIUM | HIGH | UNKNOWN
    biological_material_risk: str = "UNKNOWN"  # LOW | MEDIUM | HIGH | UNKNOWN
    potential_exclusions: List[str] = Field(default_factory=list)
    relevant_provisions: List[str] = Field(default_factory=list)
    relevant_sources: List[SourceRef] = Field(default_factory=list)
    recommended_next_steps: List[str] = Field(default_factory=list)
    assessment_summary: str
    disclaimer: str = "Preliminary assessment based on indexed sources. Does not guarantee patentability."


# ============================================================
# AYUSH / TK Analysis Schemas (Feature 3)
# ============================================================


class AyushAnalysisRequest(BaseModel):
    description: str = Field(..., min_length=5)


class AyushAnalysisResponse(BaseModel):
    traditional_ingredients_detected: List[str] = Field(default_factory=list)
    tk_concern: str = "UNKNOWN"  # YES | NO | UNKNOWN
    biological_resource_concern: str = "UNKNOWN"  # YES | NO | UNKNOWN
    relevant_provisions: List[str] = Field(default_factory=list)
    relevant_sources: List[SourceRef] = Field(default_factory=list)
    recommended_verification: List[str] = Field(default_factory=list)
    assessment: str
    disclaimer: str = "Preliminary AYUSH/TK analysis based on indexed official guidelines."


# ============================================================
# Biological Material Compliance Schemas (Feature 4)
# ============================================================


class BioMaterialRequest(BaseModel):
    biological_resource_used: bool = True
    resource_name: Optional[str] = None
    source_location: Optional[str] = None
    geographical_origin: Optional[str] = None
    associated_tk: Optional[str] = None
    obtained_from_india: bool = True
    traditional_use_based: bool = False


class BioMaterialResponse(BaseModel):
    biological_material_detected: bool
    source: str
    geographical_origin: str
    traditional_knowledge: str
    compliance_areas: List[str] = Field(default_factory=list)
    relevant_official_sources: List[SourceRef] = Field(default_factory=list)
    mandatory_approvals: List[str] = Field(default_factory=list)
    disclaimer: str = "Preliminary regulatory review based on Biological Diversity Act 2002."


# ============================================================
# MSME IP Health Check Schemas (Feature 8)
# ============================================================


class MSMEHealthCheckRequest(BaseModel):
    has_registered_business: bool = False
    has_brand_name: bool = False
    has_logo: bool = False
    has_unique_product: bool = False
    has_tech_innovation: bool = False
    has_product_docs: bool = False
    has_confidential_info: bool = False
    has_searched_patents: bool = False
    has_searched_trademarks: bool = False
    uses_biological_resources: bool = False
    traditional_knowledge_involved: bool = False


class MSMEHealthCheckResponse(BaseModel):
    overall_score: int
    patent_readiness: int
    trademark_readiness: int
    design_readiness: int
    copyright_readiness: int
    documentation_readiness: int
    strengths: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)


# ============================================================
# Cost Estimator Schemas (Feature 10)
# ============================================================


class CostEstimatorRequest(BaseModel):
    ip_type: str = Field(..., description="Patent | Trademark | Design | Copyright | GI")
    applicant_type: str = Field(default="Startup", description="Individual | Startup | MSME | Educational | Enterprise")
    application_type: str = Field(default="Standard", description="Provisional | Complete | Single Class | Multi Class")


class CostFeeItem(BaseModel):
    head: str
    fee_inr: int
    note: str


class CostEstimatorResponse(BaseModel):
    ip_type: str
    applicant_type: str
    application_type: str
    estimated_official_fee: int
    fee_breakdown: List[CostFeeItem] = Field(default_factory=list)
    additional_possible_costs: List[str] = Field(default_factory=list)
    professional_fees_included: bool = False
    source_document: str = "Official Patent/TM/Copyright/Design Fee Schedules"


# ============================================================
# Prior-Art Similarity Search Schemas (Feature 11)
# ============================================================


class PriorArtSearchRequest(BaseModel):
    query: str = Field(..., min_length=5)
    top_k: int = 5


class PriorArtSearchResultItem(BaseModel):
    document_title: str
    document_type: str
    similarity_score: float  # Percentage (e.g. 86.5)
    relevant_passage: str
    why_relevant: str
    source_url: Optional[str] = None


class PriorArtSearchResponse(BaseModel):
    results: List[PriorArtSearchResultItem] = Field(default_factory=list)
    summary_disclaimer: str = "Potentially relevant documents were found. Further verification is recommended."


# ============================================================
# Trademark Pre-Screen Schemas (Feature 12)
# ============================================================


class TrademarkPreScreenRequest(BaseModel):
    brand_name: str = Field(..., min_length=1)
    product_service: str = Field(..., min_length=2)
    industry_category: Optional[str] = None


class TrademarkPreScreenResponse(BaseModel):
    brand_name: str
    preliminary_assessment: str  # Potentially Suitable | Requires Further Review | High Risk of Objection
    recommended_nice_class: str
    potential_concerns: List[str] = Field(default_factory=list)
    absolute_grounds_sec9: str
    relative_grounds_sec11: str
    relevant_provisions: List[str] = Field(default_factory=list)
    disclaimer: str = "This is a preliminary assessment based on trademark principles and is NOT a live trademark availability search."


# ============================================================
# Legal Explainer Schemas (Feature 14)
# ============================================================


class LegalExplainRequest(BaseModel):
    query: str = Field(..., min_length=2, description="e.g. 'Section 3(d)' or 'Section 3(p)'")


class LegalExplainResponse(BaseModel):
    provision_name: str
    section_number: str
    source_document: str
    plain_english_explanation: str
    why_it_matters: str
    practical_example: str


# ============================================================
# Compliance Checklist & Roadmap Schemas (Features 7, 9, 13)
# ============================================================


class ChecklistItemDetail(BaseModel):
    item: str
    explanation: str
    why_needed: str
    source_document: str
    relevant_provision: str


class ComplianceChecklistResponse(BaseModel):
    ip_type: str
    checklist: List[ChecklistItemDetail] = Field(default_factory=list)


class TemplateMetadata(BaseModel):
    id: str
    name: str
    type: str
    summary: str
    highlights: List[str] = Field(default_factory=list)
    recommended_for: List[str] = Field(default_factory=list)
    file_name: str


class TemplateLibraryResponse(BaseModel):
    templates: List[TemplateMetadata] = Field(default_factory=list)


class TemplateExportRequest(BaseModel):
    template_id: str = Field(..., min_length=1)
    title: Optional[str] = None
    applicant_name: Optional[str] = None
    company_name: Optional[str] = None


class RoadmapStep(BaseModel):
    step_number: int
    title: str
    description: str
    required_documents: List[str] = Field(default_factory=list)
    timeline: str


class IPRoadmapResponse(BaseModel):
    ip_type: str
    steps: List[RoadmapStep] = Field(default_factory=list)


# ============================================================
# IP Assessment PDF Report Request Schema (Feature 17)
# ============================================================


class AssessmentReportRequest(BaseModel):
    applicant_name: str = Field(default="Valued Inventor / MSME")
    invention_title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    ingredients: Optional[str] = None
    brand_name: Optional[str] = None
    product_service: Optional[str] = None
    workflow_name: Optional[str] = None
    workflow_steps: List[str] = Field(default_factory=list)
    session_summary: Optional[str] = None


# ============================================================
# International IP & Global Filing Schemas (WIPO/USPTO/EPO)
# ============================================================


class JurisdictionComparisonItem(BaseModel):
    jurisdiction: str
    authority: str
    statutory_basis: str
    filing_route: str
    priority_deadline: str
    estimated_official_fee: str
    key_requirements: List[str] = Field(default_factory=list)
    search_databases: List[str] = Field(default_factory=list)


class InternationalAdvisorRequest(BaseModel):
    invention_title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    applicant_resident_in_india: bool = Field(default=True)
    first_filing_in_india: bool = Field(default=True)
    first_filing_date: Optional[str] = None  # YYYY-MM-DD
    target_jurisdictions: List[str] = Field(default_factory=lambda: ["WIPO PCT", "USPTO", "EPO"])
    applicant_type: str = Field(default="Startup", description="Individual | Startup | Small Entity | Large Entity")


class InternationalAdvisorResponse(BaseModel):
    recommended_strategy: str
    pct_applicable: bool
    paris_convention_deadline: Optional[str] = None
    national_phase_deadline: Optional[str] = None
    section_39_ffl_required: bool
    section_39_guidance: str
    required_filings: List[str] = Field(default_factory=list)
    jurisdiction_comparisons: List[JurisdictionComparisonItem] = Field(default_factory=list)
    actionable_next_steps: List[str] = Field(default_factory=list)
    sources: List[SourceRef] = Field(default_factory=list)
    disclaimer: str


# ============================================================
# GI & Copyright Protection Guidance Schemas
# ============================================================


class GIProtectionRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    goods_category: str = Field(default="Agricultural", description="Agricultural | Handicraft | Manufactured | Foodstuff | Natural")
    geographical_origin: str = Field(..., min_length=2)
    applicant_type: str = Field(default="Producers Association", description="Producers Association | Cooperative Society | Government Body | Individual Producer")
    description_of_uniqueness: str = Field(..., min_length=10)


class GIProtectionResponse(BaseModel):
    eligibility_status: str
    gi_goods_category: str
    legal_basis: str
    authorized_user_guidance: str
    assignment_rule: str
    application_form: str
    estimated_official_fee: str
    required_proofs: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    sources: List[SourceRef] = Field(default_factory=list)
    disclaimer: str


class CopyrightGuidanceRequest(BaseModel):
    work_title: str = Field(..., min_length=2)
    work_category: str = Field(default="Software Code", description="Software Code | User Manual / Documentation | Label Artwork / Graphics | Website Content")
    author_type: str = Field(default="Employee in Service", description="Employee in Service | Independent Contractor / Agency | Sole Author / Individual")
    description: str = Field(..., min_length=10)


class CopyrightGuidanceResponse(BaseModel):
    statutory_category: str
    originality_assessment: str
    first_owner_of_copyright: str
    mandatory_agreements_needed: List[str] = Field(default_factory=list)
    term_of_protection: str
    section_52_fair_dealing_scope: str
    registration_process: List[str] = Field(default_factory=list)
    sources: List[SourceRef] = Field(default_factory=list)
    disclaimer: str




