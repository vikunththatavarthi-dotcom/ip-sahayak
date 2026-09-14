"""
routers/features.py — IP-SAKTI Sahayak Decision Support Features Router

Implements endpoints for:
  - Feature 1: IP Type Recommender ("Identify My IP")
  - Feature 2: Patentability Pre-Screening
  - Feature 3: AYUSH & Traditional Knowledge Analysis
  - Feature 4: Biological Material Compliance Checker
  - Feature 7 & 13: Compliance & Application Document Checklists
  - Feature 8: MSME IP Health Check
  - Feature 9: Visual Step-by-Step IP Roadmap
  - Feature 10: Official Fee Cost Estimator
  - Feature 11: Prior-Art Vector Similarity Search
  - Feature 12: Trademark Pre-Screening
  - Feature 14: Legal Language Explainer
  - Feature 17: IP Assessment Report PDF Generator
"""
from __future__ import annotations

import io
import json
import logging
import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    AssessmentReportRequest,
    AyushAnalysisRequest,
    AyushAnalysisResponse,
    BioMaterialRequest,
    BioMaterialResponse,
    ChecklistItemDetail,
    ComplianceChecklistResponse,
    CostEstimatorRequest,
    CostEstimatorResponse,
    CostFeeItem,
    GIProtectionRequest,
    GIProtectionResponse,
    CopyrightGuidanceRequest,
    CopyrightGuidanceResponse,
    InternationalAdvisorRequest,
    InternationalAdvisorResponse,
    IPRecommendRequest,
    IPRecommendResponse,
    IPRoadmapResponse,
    IPTypeRecommendation,
    JurisdictionComparisonItem,
    LegalExplainRequest,
    LegalExplainResponse,
    MSMEHealthCheckRequest,
    MSMEHealthCheckResponse,
    PatentabilityRequest,
    PatentabilityResponse,
    PriorArtSearchRequest,
    PriorArtSearchResponse,
    PriorArtSearchResultItem,
    RoadmapStep,
    SourceRef,
    TemplateExportRequest,
    TemplateLibraryResponse,
    TemplateMetadata,
    TrademarkPreScreenRequest,
    TrademarkPreScreenResponse,
)
from app.services.vector_store import similarity_search

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# FEATURE 1 — IP TYPE RECOMMENDER ("Identify My IP")
# ============================================================


@router.post(
    "/features/ip-recommend",
    response_model=IPRecommendResponse,
    summary="Identify potentially relevant IP protection types",
)
async def recommend_ip_types(payload: IPRecommendRequest) -> IPRecommendResponse:
    desc = payload.description.lower()
    recs: List[IPTypeRecommendation] = []

    # 1. Patent Check
    patent_keywords = [
        "formulation", "process", "technical", "invention", "method", "device",
        "apparatus", "extract", "ratio", "synthesis", "chemical", "composition",
        "active ingredient", "technique", "system", "algorithm", "mechanism"
    ]
    is_patent = any(kw in desc for kw in patent_keywords)
    recs.append(
        IPTypeRecommendation(
            ip_type="Patent",
            relevant=is_patent,
            status="Highly Relevant" if is_patent else "Potentially Relevant",
            why=(
                "Selected because your description references a unique technical process, "
                "formulation, composition, or functional innovation."
                if is_patent else
                "Consider if your product includes novel manufacturing methods or functional technical advantages."
            ),
            potential_areas=["Technical formulation / process", "Novel combination ratio", "Method of preparation"],
        )
    )

    # 2. Trademark Check
    tm_keywords = ["brand", "name", "logo", "mark", "tagline", "label", "identity", "packaging name", "symbol"]
    is_tm = any(kw in desc for kw in tm_keywords) or True  # Brand protection is relevant for almost all commercial products
    recs.append(
        IPTypeRecommendation(
            ip_type="Trademark",
            relevant=is_tm,
            status="Highly Relevant",
            why="Essential for protecting brand names, commercial titles, logos, packaging trade dress, and product line identities under the Trade Marks Act 1999.",
            potential_areas=["Brand Name", "Product Logo", "Label Artwork", "Tagline / Slogan"],
        )
    )

    # 3. Design Check
    design_keywords = ["bottle", "package", "shape", "visual", "appearance", "container", "pattern", "surface", "structure", "design", "aesthetic"]
    is_design = any(kw in desc for kw in design_keywords)
    recs.append(
        IPTypeRecommendation(
            ip_type="Design",
            relevant=is_design,
            status="Highly Relevant" if is_design else "Requires Verification",
            why=(
                "Selected because you mentioned unique bottle shapes, outer packaging geometry, or distinct non-functional visual aesthetics."
                if is_design else
                "Relevant if your product features a novel, non-functional outer shape, ornament, or container design registered under Designs Act 2000."
            ),
            potential_areas=["Container / Bottle Geometry", "Outer Packaging Surface Pattern", "3D Shape of Product"],
        )
    )

    # 4. Copyright Check
    copy_keywords = ["manual", "code", "artwork", "documentation", "guide", "literature", "paper", "brochure", "website", "text"]
    is_copy = any(kw in desc for kw in copy_keywords)
    recs.append(
        IPTypeRecommendation(
            ip_type="Copyright",
            relevant=is_copy,
            status="Highly Relevant" if is_copy else "Potentially Relevant",
            why=(
                "Selected because product documentation, instructional manuals, website copy, label literary work, or software code are original literary/artistic works."
                if is_copy else
                "Protects original user manuals, instructional leaflets, website content, and label literary/artistic artwork under Copyright Act 1957."
            ),
            potential_areas=["Product Manual / User Leaflet", "Label Artwork & Graphics", "Marketing Documentation"],
        )
    )

    # 5. Geographical Indication (GI) Check
    gi_keywords = ["region", "geographical", "gi", "origin", "traditional area", "location", "indigenous to", "kerala", "darjeeling", "kashmir", "assam"]
    is_gi = any(kw in desc for kw in gi_keywords)
    recs.append(
        IPTypeRecommendation(
            ip_type="Geographical Indication",
            relevant=is_gi,
            status="Potentially Relevant" if is_gi else "Not Relevant",
            why=(
                "Selected because your product references a specific geographical region or traditional localized origin."
                if is_gi else
                "Relevant only if the product possesses qualities or a reputation attributable to a specific geographical origin in India."
            ),
            potential_areas=["Regional Origin Claim", "Association with Recognized GI Territory"],
        )
    )

    # 6. Traditional Knowledge Considerations
    tk_keywords = ["herbal", "ayurvedic", "neem", "turmeric", "ashwagandha", "guduchi", "plant", "traditional", "classical", "herb", "ayush"]
    is_tk = any(kw in desc for kw in tk_keywords)
    recs.append(
        IPTypeRecommendation(
            ip_type="Traditional Knowledge",
            relevant=is_tk,
            status="Highly Relevant" if is_tk else "Requires Verification",
            why=(
                "Selected because traditional medicinal herbs or classical formulations were identified. Section 3(p) prior-art clearance is required."
                if is_tk else
                "Verify if any component derives from traditional knowledge or known medicinal plant applications."
            ),
            potential_areas=["TKDL Prior-Art Verification", "Section 3(p) Non-Patentability Review", "NBA Biological Resource Approval"],
        )
    )

    return IPRecommendResponse(
        recommendations=recs,
        summary=f"Identified {sum(1 for r in recs if r.relevant)} potentially relevant IP protection categories for your product description.",
        disclaimer="Preliminary IP identification based on description keywords. Consult a qualified patent/trademark agent for formal filings.",
    )


# ============================================================
# FEATURE 2 — PATENTABILITY PRE-SCREENING
# ============================================================


@router.post(
    "/features/patentability-prescreen",
    response_model=PatentabilityResponse,
    summary="Preliminary patentability pre-screen under Indian Patent Law",
)
async def patentability_prescreen(payload: PatentabilityRequest) -> PatentabilityResponse:
    text_corpus = f"{payload.title} {payload.description} {payload.ingredients or ''} {payload.technical_process or ''} {payload.claimed_new or ''}".lower()

    # 1. RAG retrieval for relevant patent provisions & legal guidelines
    chunks = similarity_search(payload.title + " " + payload.description[:300], top_k=4)
    sources: List[SourceRef] = []
    seen = set()
    for c in chunks:
        sid = c.source_id or c.chunk_id
        if sid not in seen:
            seen.add(sid)
            sources.append(
                SourceRef(
                    id=sid,
                    title=c.source_title or "Official IP Guideline",
                    authority=c.authority,
                    url=c.source_url,
                    document_type=c.metadata.get("document_type"),
                    relevance_score=round(c.score, 4),
                    snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
                )
            )

    # 2. Heuristic Analysis for Novelty, Inventive Step, TK Risk, Bio Risk
    exclusions: List[str] = []
    provisions: List[str] = []
    next_steps: List[str] = []

    # Check Section 3(p) — Traditional Knowledge
    tk_detected = payload.is_tk_involved or any(k in text_corpus for k in ["ayurved", "herb", "turmeric", "ashwagandha", "neem", "guduchi", "plant extract", "classical"])
    if tk_detected:
        tk_risk = "HIGH"
        exclusions.append("Section 3(p): Invention which in effect is traditional knowledge or aggregation of known properties of traditionally known component.")
        provisions.append("Section 3(p), Patents Act 1970")
        next_steps.append("Conduct formal Synergistic Efficacy Study (Combination Index < 1.0) to prove non-obvious synergy beyond individual known herbs.")
    else:
        tk_risk = "LOW"

    # Check Section 3(d) — Mere Discovery / New Form of Known Substance
    substance_detected = any(k in text_corpus for k in ["derivative", "salt", "polymorph", "formulation", "mixture", "extract", "ratio"])
    if substance_detected:
        exclusions.append("Section 3(d): Mere discovery of a new form of a known substance which does not result in the enhancement of known efficacy.")
        provisions.append("Section 3(d), Patents Act 1970")
        next_steps.append("Generate comparative experimental data demonstrating enhanced therapeutic efficacy over the nearest known prior-art compound/extract.")

    # Check Section 3(e) — Admixture
    if "ingredient" in text_corpus or "mixture" in text_corpus or payload.ingredients:
        exclusions.append("Section 3(e): Substance obtained by a mere admixture resulting only in aggregation of properties of components.")
        provisions.append("Section 3(e), Patents Act 1970")

    # Check Biological Material Risk — Section 6 BDA 2002
    bio_detected = payload.is_biological_involved or any(k in text_corpus for k in ["biological", "plant", "botanical", "fungus", "herb", "microorganism"])
    if bio_detected:
        bio_risk = "HIGH"
        provisions.append("Section 6, Biological Diversity Act 2002 (Mandatory NBA Approval)")
        next_steps.append("File Form III with National Biodiversity Authority (NBA) prior to grant of patent under Indian law.")
    else:
        bio_risk = "LOW"

    # Novelty & Inventive Step Scoring
    if payload.claimed_new and len(payload.claimed_new.strip()) > 15:
        novelty = "HIGH" if "synergistic" in text_corpus or "novel process" in text_corpus else "MEDIUM"
    else:
        novelty = "MEDIUM"

    if payload.technical_advantage and len(payload.technical_advantage.strip()) > 15:
        inventive_step = "HIGH" if "unexpected" in text_corpus or "enhanced efficacy" in text_corpus else "MEDIUM"
    else:
        inventive_step = "MEDIUM"

    provisions.extend(["Section 2(1)(j) - Novelty", "Section 2(1)(ja) - Inventive Step", "Section 2(1)(ac) - Industrial Applicability"])

    next_steps.extend([
        "Perform a comprehensive novelty prior-art search across Indian Patent Office (IPO) and global databases (WIPO Patentscope).",
        "Prepare draft Provisional Specification (Form 2) to establish priority date before public disclosure.",
        "Ensure full disclosure of biological source origin in Form 1 (Field of Invention & Specification)."
    ])

    summary = (
        f"Preliminary patentability evaluation for '{payload.title}': Novelty is assessed as {novelty}, "
        f"Inventive Step as {inventive_step}. "
        f"{'Traditional Knowledge concerns detected under Section 3(p).' if tk_risk == 'HIGH' else 'No immediate Section 3(p) block identified.'}"
    )

    return PatentabilityResponse(
        novelty=novelty,
        inventive_step=inventive_step,
        industrial_applicability="HIGH",
        tk_risk=tk_risk,
        biological_material_risk=bio_risk,
        potential_exclusions=exclusions,
        relevant_provisions=list(set(provisions)),
        relevant_sources=sources,
        recommended_next_steps=next_steps,
        assessment_summary=summary,
    )


# ============================================================
# FEATURE 3 — AYUSH & TRADITIONAL KNOWLEDGE ANALYSIS
# ============================================================


HERB_DICTIONARY = {
    "turmeric": ("Haridra / Turmeric", "Curcuma longa"),
    "haldi": ("Haridra / Haldi", "Curcuma longa"),
    "curcuma": ("Haridra / Turmeric", "Curcuma longa"),
    "neem": ("Nimba / Neem", "Azadirachta indica"),
    "ashwagandha": ("Ashwagandha", "Withania somnifera"),
    "asgandh": ("Ashwagandha", "Withania somnifera"),
    "guduchi": ("Guduchi / Giloy", "Tinospora cordifolia"),
    "giloy": ("Giloy", "Tinospora cordifolia"),
    "tulsi": ("Tulsi / Holy Basil", "Ocimum sanctum"),
    "triphala": ("Triphala Formulation", "Terminalia chebula + Terminalia bellirica + Phyllanthus emblica"),
    "amla": ("Amalaki / Amla", "Phyllanthus emblica"),
    "brahmi": ("Brahmi", "Bacopa monnieri"),
    "kalmegh": ("Kalmegh / Nilavembu", "Andrographis paniculata"),
    "shatavari": ("Shatavari", "Asparagus racemosus"),
    "licorice": ("Yashtimadhu / Licorice", "Glycyrrhiza glabra"),
    "mulethi": ("Yashtimadhu / Mulethi", "Glycyrrhiza glabra"),
}


@router.post(
    "/features/ayush-analysis",
    response_model=AyushAnalysisResponse,
    summary="Dedicated AYUSH & Traditional Knowledge risk analysis",
)
async def analyze_ayush(payload: AyushAnalysisRequest) -> AyushAnalysisResponse:
    text_lower = payload.description.lower()
    detected_herbs = []

    for kw, (trad_name, latin_name) in HERB_DICTIONARY.items():
        if kw in text_lower:
            item_str = f"{trad_name} ({latin_name})"
            if item_str not in detected_herbs:
                detected_herbs.append(item_str)

    # RAG search for AYUSH guidelines
    chunks = similarity_search("AYUSH Guidelines Traditional Knowledge Section 3(p) Biological Material", top_k=4)
    sources: List[SourceRef] = [
        SourceRef(
            id=c.source_id or c.chunk_id,
            title=c.source_title or "AYUSH Patent Guidelines",
            authority=c.authority,
            url=c.source_url,
            document_type=c.metadata.get("document_type"),
            relevance_score=round(c.score, 4),
            snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
        )
        for c in chunks
    ]

    has_tk = len(detected_herbs) > 0 or any(k in text_lower for k in ["herbal", "ayurved", "unani", "siddha", "traditional"])
    has_bio = has_tk or any(k in text_lower for k in ["plant", "botanical", "biological", "extract"])

    provisions = [
        "Section 3(p), Indian Patents Act 1970 (Traditional Knowledge Exclusions)",
        "Guidelines for Examination of AYUSH Related Inventions (CGPDTM 2012)",
        "Section 6, Biological Diversity Act 2002 (National Biodiversity Authority Compliance)",
        "Access and Benefit Sharing (ABS) Guidelines 2014"
    ]

    verifications = [
        "Verify whether the formulation is cited in classical texts (Ayurvedic Pharmacopoeia of India, Charaka Samhita, Sushruta Samhita).",
        "Search the Traditional Knowledge Digital Library (TKDL) database prior to patent drafting.",
        "Demonstrate synergistic efficacy via biological assays (Combination Index CI < 1.0).",
        "Obtain mandatory NBA (National Biodiversity Authority) approval prior to patent grant."
    ]

    assessment = (
        f"AYUSH Analysis detected {len(detected_herbs)} classical herb(s): {', '.join(detected_herbs) if detected_herbs else 'None explicitly listed'}. "
        f"High likelihood of Section 3(p) examiner objection unless novel extract fractions, synergistic non-obvious ratios, or novel delivery systems are claimed."
    )

    return AyushAnalysisResponse(
        traditional_ingredients_detected=detected_herbs if detected_herbs else ["General Herbal/Ayurvedic Material"],
        tk_concern="YES" if has_tk else "NO",
        biological_resource_concern="YES" if has_bio else "NO",
        relevant_provisions=provisions,
        relevant_sources=sources,
        recommended_verification=verifications,
        assessment=assessment,
    )


# ============================================================
# FEATURE 4 — BIOLOGICAL MATERIAL COMPLIANCE CHECKER
# ============================================================


@router.post(
    "/features/biomaterial-check",
    response_model=BioMaterialResponse,
    summary="Determine Biological Diversity Act (2002) compliance requirements",
)
async def check_biomaterial_compliance(payload: BioMaterialRequest) -> BioMaterialResponse:
    if not payload.biological_resource_used:
        return BioMaterialResponse(
            biological_material_detected=False,
            source="None declared",
            geographical_origin="N/A",
            traditional_knowledge="NO",
            compliance_areas=["No Biological Diversity Act compliance required."],
            relevant_official_sources=[],
            mandatory_approvals=[],
            disclaimer="Biological material check completed. No biological resources reported.",
        )

    compliance = [
        "Section 6(1) Biological Diversity Act 2002: Mandatory NBA approval before applying for IP.",
        "Rule 18, Biological Diversity Rules 2004: Application for seeking prior approval of National Biodiversity Authority.",
        "Form III Filing: Submission of Form III to NBA, Chennai with requisite fee.",
        "Access and Benefit Sharing (ABS): Benefit sharing obligation based on commercial utilization."
    ]

    approvals = [
        "Form III Application to National Biodiversity Authority (NBA)",
        "State Biodiversity Board (SBB) intimation for Indian entities",
        "Clearance of Source & Geographical Origin declaration in Patent Form 1"
    ]

    # RAG sources for Biological Diversity Act
    chunks = similarity_search("Biological Diversity Act 2002 NBA Form III Access Benefit Sharing", top_k=3)
    sources = [
        SourceRef(
            id=c.source_id or c.chunk_id,
            title=c.source_title or "Biological Diversity Act 2002",
            authority="National Biodiversity Authority / Ministry of Environment",
            url=c.source_url,
            document_type="Act / Guidelines",
            relevance_score=round(c.score, 4),
            snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
        )
        for c in chunks
    ]

    return BioMaterialResponse(
        biological_material_detected=True,
        source=payload.resource_name or payload.source_location or "Biological Resource / Botanical Material",
        geographical_origin=payload.geographical_origin or "India",
        traditional_knowledge="YES" if payload.traditional_use_based or payload.associated_tk else "NO",
        compliance_areas=compliance,
        relevant_official_sources=sources,
        mandatory_approvals=approvals,
    )


# ============================================================
# FEATURE 8 — MSME IP HEALTH CHECK
# ============================================================


@router.post(
    "/features/msme-health-check",
    response_model=MSMEHealthCheckResponse,
    summary="Assess MSME IP readiness and compliance score",
)
async def msme_health_check(payload: MSMEHealthCheckRequest) -> MSMEHealthCheckResponse:
    # Deterministic Scoring Algorithm
    base_score = 0

    if payload.has_registered_business:
        base_score += 10
    if payload.has_brand_name:
        base_score += 10
    if payload.has_logo:
        base_score += 10
    if payload.has_unique_product:
        base_score += 15
    if payload.has_tech_innovation:
        base_score += 15
    if payload.has_product_docs:
        base_score += 10
    if payload.has_confidential_info:
        base_score += 10
    if payload.has_searched_patents:
        base_score += 10
    if payload.has_searched_trademarks:
        base_score += 10

    # Risk penalties if bio/TK without search
    if payload.uses_biological_resources and not payload.has_searched_patents:
        base_score = max(5, base_score - 10)
    if payload.traditional_knowledge_involved and not payload.has_searched_patents:
        base_score = max(5, base_score - 10)

    overall = min(100, max(0, base_score))

    patent_readiness = 85 if (payload.has_tech_innovation and payload.has_searched_patents) else (50 if payload.has_tech_innovation else 25)
    tm_readiness = 90 if (payload.has_brand_name and payload.has_logo and payload.has_searched_trademarks) else (60 if payload.has_brand_name else 30)
    design_readiness = 75 if payload.has_unique_product else 40
    copyright_readiness = 80 if payload.has_product_docs else 45
    doc_readiness = 85 if (payload.has_product_docs and payload.has_confidential_info) else 40

    strengths = []
    risks = []
    actions = []

    if payload.has_brand_name and payload.has_logo:
        strengths.append("Established Brand & Visual Identity assets ready for Class registration.")
    else:
        risks.append("Unprotected Brand Name or Logo — vulnerable to trademark squatting.")
        actions.append("File Form TM-A for Brand Name & Logo under Trade Marks Act 1999.")

    if payload.has_tech_innovation:
        strengths.append("Technical innovation identified with high potential for patent filing.")
        if not payload.has_searched_patents:
            risks.append("No prior-art search conducted for technical innovation.")
            actions.append("Conduct comprehensive prior-art search across Indian Patent Office database.")

    if payload.uses_biological_resources or payload.traditional_knowledge_involved:
        risks.append("Biological material or Traditional Knowledge involved — Section 3(p) & NBA clearance required.")
        actions.append("Initiate TKDL prior-art review and submit Form III to National Biodiversity Authority.")

    if not payload.has_confidential_info:
        risks.append("Absence of Non-Disclosure Agreements (NDAs) exposing trade secrets.")
        actions.append("Execute bilateral NDAs with employees, manufacturers, and research partners.")

    return MSMEHealthCheckResponse(
        overall_score=overall,
        patent_readiness=patent_readiness,
        trademark_readiness=tm_readiness,
        design_readiness=design_readiness,
        copyright_readiness=copyright_readiness,
        documentation_readiness=doc_readiness,
        strengths=strengths if strengths else ["Registered MSME Business entity."],
        risks=risks if risks else ["Routine monitoring required."],
        recommended_actions=actions if actions else ["Maintain IP portfolio register."],
    )


# ============================================================
# FEATURE 10 — OFFICIAL FEE COST ESTIMATOR
# ============================================================


FEE_TABLE = {
    "patent": {
        "Individual": {"e_filing": 1600, "physical": 1750, "note": "Form 1 Natural Person / Startup / MSME concession fee"},
        "Startup": {"e_filing": 1600, "physical": 1750, "note": "Form 1 Startup 80% fee concession under Patents Rules 2024"},
        "MSME": {"e_filing": 1600, "physical": 1750, "note": "Form 1 Small Entity 80% fee concession under Patents Rules 2024"},
        "Educational": {"e_filing": 1600, "physical": 1750, "note": "Educational Institution statutory concession"},
        "Enterprise": {"e_filing": 8000, "physical": 8800, "note": "Large Entity standard statutory fee"},
    },
    "trademark": {
        "Individual": {"e_filing": 4500, "physical": 5000, "note": "Form TM-A Individual / Startup fee per class"},
        "Startup": {"e_filing": 4500, "physical": 5000, "note": "Form TM-A Startup 50% concession fee per class"},
        "MSME": {"e_filing": 4500, "physical": 5000, "note": "Form TM-A Small Entity 50% concession fee per class"},
        "Educational": {"e_filing": 4500, "physical": 5000, "note": "Form TM-A Educational institution fee per class"},
        "Enterprise": {"e_filing": 9000, "physical": 10000, "note": "Others standard statutory fee per class"},
    },
    "design": {
        "Individual": {"e_filing": 1000, "physical": 1000, "note": "Form 1 Natural Person / Startup design registration"},
        "Startup": {"e_filing": 1000, "physical": 1000, "note": "Form 1 Startup design registration fee"},
        "MSME": {"e_filing": 1000, "physical": 1000, "note": "Form 1 Small Entity design registration fee"},
        "Educational": {"e_filing": 1000, "physical": 1000, "note": "Educational institution design fee"},
        "Enterprise": {"e_filing": 4000, "physical": 4000, "note": "Large entity standard design registration fee"},
    },
    "copyright": {
        "Individual": {"e_filing": 500, "physical": 500, "note": "Form XIV Literary / Artistic work registration fee per work"},
        "Startup": {"e_filing": 500, "physical": 500, "note": "Form XIV Startup registration fee per work"},
        "MSME": {"e_filing": 500, "physical": 500, "note": "Form XIV Small Entity registration fee per work"},
        "Educational": {"e_filing": 500, "physical": 500, "note": "Form XIV Educational registration fee per work"},
        "Enterprise": {"e_filing": 500, "physical": 500, "note": "Form XIV Standard fee per work"},
    },
    "gi": {
        "Individual": {"e_filing": 5000, "physical": 5000, "note": "Form GI-1 Application for registration of Geographical Indication"},
        "Startup": {"e_filing": 5000, "physical": 5000, "note": "Form GI-1 Application fee"},
        "MSME": {"e_filing": 5000, "physical": 5000, "note": "Form GI-1 Application fee"},
        "Educational": {"e_filing": 5000, "physical": 5000, "note": "Form GI-1 Application fee"},
        "Enterprise": {"e_filing": 5000, "physical": 5000, "note": "Form GI-1 Standard statutory fee"},
    }
}


@router.post(
    "/features/cost-estimator",
    response_model=CostEstimatorResponse,
    summary="Estimate official government IP filing fees",
)
async def estimate_ip_costs(payload: CostEstimatorRequest) -> CostEstimatorResponse:
    ip_key = payload.ip_type.lower()
    app_key = payload.applicant_type

    cat_data = FEE_TABLE.get(ip_key, FEE_TABLE["patent"])
    fee_info = cat_data.get(app_key, cat_data.get("Startup", {"e_filing": 1600, "physical": 1750, "note": "Concession fee"}))

    base_fee = fee_info["e_filing"]

    breakdown = [
        CostFeeItem(head="Official E-Filing Application Fee", fee_inr=base_fee, note=fee_info["note"])
    ]

    add_costs = []
    if ip_key == "patent":
        request_exam_fee = 4000 if app_key in ["Individual", "Startup", "MSME", "Educational"] else 20000
        breakdown.append(CostFeeItem(head="Request for Examination (Form 18)", fee_inr=request_exam_fee, note="Mandatory for examination"))
        add_costs.extend(["Early Publication Fee (Form 9 - Optional): ₹2,500", "Physical Filing Surcharge: +10% on statutory fee"])
    elif ip_key == "trademark":
        add_costs.extend(["Notice of Opposition response (Form TM-O if opposed): ₹2,700", "Class Addition Fee: ₹4,500 per additional class"])
    elif ip_key == "design":
        add_costs.append("Inspection of Register Fee: ₹500")

    total_est = sum(item.fee_inr for item in breakdown)

    return CostEstimatorResponse(
        ip_type=payload.ip_type,
        applicant_type=payload.applicant_type,
        application_type=payload.application_type,
        estimated_official_fee=total_est,
        fee_breakdown=breakdown,
        additional_possible_costs=add_costs,
        professional_fees_included=False,
        source_document=f"First Schedule, {payload.ip_type.capitalize()} Rules (Govt of India Official Gazettes)",
    )


# ============================================================
# FEATURE 11 — PRIOR-ART SIMILARITY SEARCH
# ============================================================


@router.post(
    "/features/prior-art-search",
    response_model=PriorArtSearchResponse,
    summary="Search indexed knowledge base for prior-art & document similarity",
)
async def prior_art_search(payload: PriorArtSearchRequest) -> PriorArtSearchResponse:
    chunks = similarity_search(payload.query, top_k=payload.top_k)

    results: List[PriorArtSearchResultItem] = []
    for c in chunks:
        score_pct = round(c.score * 100, 1)
        doc_type = c.metadata.get("document_type", "Official Document").capitalize()
        title = c.source_title or "Indexed IP Document"

        # Formulate why relevant
        if score_pct > 80:
            why = "High semantic overlap with submitted technical query."
        elif score_pct > 65:
            why = "Moderate keyword and structural concept similarity."
        else:
            why = "General legal/regulatory context match."

        results.append(
            PriorArtSearchResultItem(
                document_title=title,
                document_type=doc_type,
                similarity_score=score_pct,
                relevant_passage=c.text[:400] + "..." if len(c.text) > 400 else c.text,
                why_relevant=why,
                source_url=c.source_url,
            )
        )

    return PriorArtSearchResponse(
        results=results,
        summary_disclaimer="Potentially relevant documents were found. This similarity search is based on indexed official documents and does not constitute a full novelty guarantee.",
    )


# ============================================================
# FEATURE 12 — TRADEMARK PRE-SCREEN
# ============================================================


@router.post(
    "/features/trademark-prescreen",
    response_model=TrademarkPreScreenResponse,
    summary="Preliminary trademark distinctiveness & class assessment",
)
async def trademark_prescreen(payload: TrademarkPreScreenRequest) -> TrademarkPreScreenResponse:
    name_upper = payload.brand_name.upper()
    prod_lower = payload.product_service.lower()

    # Determine recommended Nice Class
    nice_class = "Class 5 (Pharmaceuticals, AYUSH Formulations, Herbal Supplements)"
    if any(k in prod_lower for k in ["cosmetic", "soap", "skin", "cream", "shampoo"]):
        nice_class = "Class 3 (Cosmetics, Non-medicated Toiletries, Essential Oils)"
    elif any(k in prod_lower for k in ["tea", "food", "spice", "honey", "confectionery"]):
        nice_class = "Class 30 (Coffee, Tea, Rice, Spices, Herbal Infusions)"
    elif any(k in prod_lower for k in ["software", "app", "digital", "platform"]):
        nice_class = "Class 42 (Software & Technology Services) / Class 9 (Downloadable Software)"

    concerns = []
    # Check Section 9 (Absolute Grounds) — Descriptive words
    descriptive_words = ["AYUR", "HERBAL", "PURE", "NATURAL", "HEAL", "CURE", "MED", "PHARMA", "BEST", "SUPER"]
    if any(w in name_upper for w in descriptive_words):
        concerns.append("Section 9(1)(b) Warning: Name contains descriptive terms commonly used in the trade. Examiners may object that the mark lacks inherent distinctiveness.")

    if len(payload.brand_name.strip()) <= 3:
        concerns.append("Short acronym mark — higher probability of phonetic similarity conflicts under Section 11.")

    sec9_status = "Passes preliminary distinctiveness check." if not concerns else "Requires distinctiveness acquired through use proof or logo combination."
    sec11_status = "Requires search against TM Registry database for identical/similar prior marks."

    assessment = "Potentially Suitable" if not concerns else "Requires Further Review"

    return TrademarkPreScreenResponse(
        brand_name=payload.brand_name,
        preliminary_assessment=assessment,
        recommended_nice_class=nice_class,
        potential_concerns=concerns if concerns else ["No immediate descriptive objections identified."],
        absolute_grounds_sec9=sec9_status,
        relative_grounds_sec11=sec11_status,
        relevant_provisions=["Section 9 (Absolute Grounds for Refusal)", "Section 11 (Relative Grounds for Refusal)", "Nice Classification 11th Edition"],
        disclaimer="This is a preliminary assessment based on trademark principles and is NOT a live trademark registry search.",
    )


# ============================================================
# FEATURE 14 — LEGAL LANGUAGE EXPLAINER
# ============================================================


LEGAL_DATABASE = {
    "3(p)": {
        "name": "Section 3(p) — Traditional Knowledge Exclusion",
        "sec": "Section 3(p), Patents Act 1970",
        "doc": "Indian Patents Act 1970",
        "plain": "An invention that is essentially traditional knowledge, or simply combines known properties of traditional herbs/materials, CANNOT be patented in India.",
        "why": "Protects Indian traditional knowledge (like Ayurveda, Siddha, Unani) from being monopolized or bio-pirated by private entities without genuine technical innovation.",
        "example": "Filing a patent for mixing Turmeric and Honey for wound healing will be rejected under Section 3(p) because both herbs are already documented in TKDL for wound healing."
    },
    "3(d)": {
        "name": "Section 3(d) — Mere Discovery / Efficacy Requirement",
        "sec": "Section 3(d), Patents Act 1970",
        "doc": "Indian Patents Act 1970",
        "plain": "Simply discovering a new form, salt, polymorph, or formulation of an existing known substance is NOT patentable UNLESS it shows significantly enhanced therapeutic efficacy.",
        "why": "Prevents 'evergreening' of patents where pharmaceutical companies make minor chemical tweaks just to extend their monopoly without benefit.",
        "example": "Converting a known Ayurvedic liquid extract into a pill format is not patentable under Section 3(d) unless you prove the pill works significantly better in the body."
    },
    "3(e)": {
        "name": "Section 3(e) — Mere Admixture",
        "sec": "Section 3(e), Patents Act 1970",
        "doc": "Indian Patents Act 1970",
        "plain": "A simple mixture of known ingredients where each ingredient performs its expected function is NOT patentable.",
        "why": "Requires inventors to prove unexpected synergistic results rather than standard combinations.",
        "example": "Combining Neem (antibacterial) and Tulsi (cough relief) into one syrup is a mere admixture under 3(e) unless there is a true synergistic booster effect."
    },
    "section 6": {
        "name": "Section 6 — Biological Diversity Act Approval",
        "sec": "Section 6, Biological Diversity Act 2002",
        "doc": "Biological Diversity Act 2002",
        "plain": "Anyone applying for IP rights for an invention based on biological resources or associated knowledge obtained from India MUST obtain prior approval from the National Biodiversity Authority (NBA).",
        "why": "Ensures sovereign rights over Indian bio-resources and guarantees Access and Benefit Sharing (ABS) with local communities.",
        "example": "If your patented formulation uses Ashwagandha harvested in Madhya Pradesh, you must file Form III with NBA before the patent office can grant the patent."
    }
}


@router.post(
    "/features/legal-explain",
    response_model=LegalExplainResponse,
    summary="Explain Indian legal provisions in plain English",
)
async def explain_legal_provision(payload: LegalExplainRequest) -> LegalExplainResponse:
    q = payload.query.lower()

    for key, data in LEGAL_DATABASE.items():
        if key in q:
            return LegalExplainResponse(
                provision_name=data["name"],
                section_number=data["sec"],
                source_document=data["doc"],
                plain_english_explanation=data["plain"],
                why_it_matters=data["why"],
                practical_example=data["example"],
            )

    # Fallback RAG explanation
    chunks = similarity_search(payload.query, top_k=2)
    snippet = chunks[0].text[:300] if chunks else "Section provisions under Indian IP statutes."

    return LegalExplainResponse(
        provision_name=f"Explanation for '{payload.query}'",
        section_number=payload.query.upper(),
        source_document="Indian Intellectual Property Laws & Guidelines",
        plain_english_explanation=f"Based on indexed sources: {snippet}",
        why_it_matters="Ensures compliance with Indian statutory filing standards and avoids examiner objections.",
        practical_example="Always verify statutory provisions against current gazette notifications prior to filing.",
    )


# ============================================================
# FEATURE 7 & 13 — COMPLIANCE & DOCUMENT CHECKLISTS
# ============================================================


CHECKLIST_DATA = {
    "patent": [
        ChecklistItemDetail(item="Form 1 (Application for Grant of Patent)", explanation="Standard statutory filing form", why_needed="Establishes applicant identity, category (MSME/Startup), and priority date.", source_document="Patents Rules 2024", relevant_provision="Section 7, Patents Act 1970"),
        ChecklistItemDetail(item="Form 2 (Provisional / Complete Specification)", explanation="Full technical description & claims", why_needed="Provides complete disclosure of invention, drawings, and best mode of operation.", source_document="Patents Rules 2024", relevant_provision="Section 10, Patents Act 1970"),
        ChecklistItemDetail(item="Form 3 (Statement & Undertaking)", explanation="Details of foreign patent filings", why_needed="Mandatory disclosure of corresponding filings outside India within 6 months.", source_document="Patents Rules 2024", relevant_provision="Section 8, Patents Act 1970"),
        ChecklistItemDetail(item="Form 5 (Declaration as to Inventorship)", explanation="Statement of true & first inventors", why_needed="Confirms inventor entitlement and assignment of rights to applicant.", source_document="Patents Rules 2024", relevant_provision="Rule 13(6), Patents Rules 2024"),
        ChecklistItemDetail(item="Biological Material Disclosure (Form 1 Clause)", explanation="Declaration of source & geographical origin", why_needed="Mandatory if biological resources from India are used in the specification.", source_document="Patents Rules 2024", relevant_provision="Section 10(4)(d)(ii), Patents Act 1970"),
        ChecklistItemDetail(item="Form III NBA Approval (if applicable)", explanation="National Biodiversity Authority consent", why_needed="Required before patent grant if Indian biological resources are utilized.", source_document="Biological Diversity Act 2002", relevant_provision="Section 6, BDA 2002"),
    ],
    "trademark": [
        ChecklistItemDetail(item="Form TM-A (Application for Registration)", explanation="Primary trademark registration form", why_needed="Registers brand name, logo, or trade dress under specified Nice classes.", source_document="Trade Marks Rules 2017", relevant_provision="Section 18, Trade Marks Act 1999"),
        ChecklistItemDetail(item="Clear Representation of Mark", explanation="High-resolution JPEG/PNG logo or mark text", why_needed="Required for official journal publication and visual examination.", source_document="Trade Marks Rules 2017", relevant_provision="Rule 26, Trade Marks Rules 2017"),
        ChecklistItemDetail(item="User Affidavit (Form TM-A Attachment)", explanation="Proof of prior commercial use date", why_needed="Required if claiming use of the mark prior to filing date in India.", source_document="Trade Marks Rules 2017", relevant_provision="Rule 25, Trade Marks Rules 2017"),
        ChecklistItemDetail(item="MSME / Startup Certificate", explanation="UDYAM Registration or DIPP Certificate", why_needed="Entitles applicant to 50% statutory fee concession.", source_document="Trade Marks Rules 2017", relevant_provision="Schedule 1, Trade Marks Rules 2017"),
    ],
    "copyright": [
        ChecklistItemDetail(item="Form XIV (Application for Registration)", explanation="Statutory copyright application", why_needed="Registers original literary, artistic, or software works.", source_document="Copyright Rules 2013", relevant_provision="Section 45, Copyright Act 1957"),
        ChecklistItemDetail(item="Copies of Work (2 Original Copies)", explanation="Physical or digital deposit copy", why_needed="Deposited in Copyright Office library for record of authorship.", source_document="Copyright Rules 2013", relevant_provision="Rule 70, Copyright Rules 2013"),
        ChecklistItemDetail(item="No Objection Certificate (NOC) from Author", explanation="Assignment / NOC document", why_needed="Required if applicant is a company/employer and author is an employee.", source_document="Copyright Rules 2013", relevant_provision="Section 17, Copyright Act 1957"),
    ],
    "design": [
        ChecklistItemDetail(item="Form 1 (Application for Registration of Design)", explanation="Design application form", why_needed="Protects novel non-functional aesthetic shape or pattern.", source_document="Designs Rules 2001", relevant_provision="Section 5, Designs Act 2000"),
        ChecklistItemDetail(item="Four Copies of Representation of Design", explanation="Perspective, front, top, side views", why_needed="Defines visual scope of design protection across Locarno classes.", source_document="Designs Rules 2001", relevant_provision="Rule 14, Designs Rules 2001"),
    ],
    "gi": [
        ChecklistItemDetail(item="Form GI-1 (Application for GI Registration)", explanation="Geographical Indication application form", why_needed="Registers product associated with specific geographical region.", source_document="GI Rules 2002", relevant_provision="Section 11, GI Act 1999"),
        ChecklistItemDetail(item="Map & Geographical Territory Proof", explanation="Official region map and historical evidence", why_needed="Proves geographical origin and traditional reputation.", source_document="GI Rules 2002", relevant_provision="Rule 32, GI Rules 2002"),
    ]
}


@router.get(
    "/features/compliance-checklist/{ip_type}",
    response_model=ComplianceChecklistResponse,
    summary="Get dynamic compliance and application document checklist",
)
async def get_compliance_checklist(ip_type: str) -> ComplianceChecklistResponse:
    key = ip_type.lower()
    items = CHECKLIST_DATA.get(key, CHECKLIST_DATA["patent"])
    return ComplianceChecklistResponse(ip_type=ip_type, checklist=items)


# ============================================================
# FEATURE 9 — VISUAL STEP-BY-STEP IP ROADMAP
# ============================================================


ROADMAP_DATA = {
    "patent": [
        RoadmapStep(step_number=1, title="1. Identify IP", description="Determine technical novelty and confirm invention is not excluded under Section 3.", required_documents=["Invention Disclosure Sheet"], timeline="1-2 Weeks"),
        RoadmapStep(step_number=2, title="2. Prior-Art Search", description="Search IPO, WIPO, and TKDL databases to verify novelty.", required_documents=["Prior-Art Search Report"], timeline="1 Week"),
        RoadmapStep(step_number=3, title="3. File Application", description="Submit Form 1, Form 2 (Provisional/Complete), Form 3, and Form 5.", required_documents=["Form 1", "Form 2 Specification", "Form 3", "Form 5"], timeline="Day 1 (Establishes Priority)"),
        RoadmapStep(step_number=4, title="4. Publication", description="Official journal publication after 18 months (or 1 month via Form 9 early pub).", required_documents=["Form 9 (Optional)"], timeline="18 Months / 1 Month"),
        RoadmapStep(step_number=5, title="5. Request Examination", description="Submit Form 18 within 31 months from filing date.", required_documents=["Form 18"], timeline="Within 31 Months"),
        RoadmapStep(step_number=6, title="6. First Examination Report (FER)", description="Patent Office issues FER detailing novelty/objection findings.", required_documents=["FER Notice"], timeline="6-12 Months post Form 18"),
        RoadmapStep(step_number=7, title="7. Respond to Objections", description="Submit written response to FER within 6 months.", required_documents=["FER Written Response", "Amended Claims"], timeline="Within 6 Months"),
        RoadmapStep(step_number=8, title="8. Hearing & NBA Clearance", description="Attend hearing if requested and submit Form III NBA approval.", required_documents=["Form III NBA Consent"], timeline="2-4 Months"),
        RoadmapStep(step_number=9, title="9. Patent Grant", description="Patent is granted and certificate issued.", required_documents=["Patent Certificate"], timeline="Final Grant"),
    ],
    "trademark": [
        RoadmapStep(step_number=1, title="1. Brand & Class Identification", description="Select brand name/logo and identify Nice Classes (e.g. Class 5/3).", required_documents=["Logo File"], timeline="1-2 Days"),
        RoadmapStep(step_number=2, title="2. Trademark Search", description="Search TM Registry database for identical or phonetically similar marks.", required_documents=["TM Search Report"], timeline="1 Day"),
        RoadmapStep(step_number=3, title="3. File Application", description="File Form TM-A with MSME/Startup certificate.", required_documents=["Form TM-A", "MSME Cert", "User Affidavit"], timeline="Day 1 (Can use ™ symbol)"),
        RoadmapStep(step_number=4, title="4. Examination Report", description="Examiner issues report under Section 9 (distinctiveness) or Section 11 (similarity).", required_documents=["Exam Report"], timeline="1-3 Months"),
        RoadmapStep(step_number=5, title="5. Reply to Examination", description="File formal response to objections within 30 days.", required_documents=["Written Response"], timeline="Within 30 Days"),
        RoadmapStep(step_number=6, title="6. Journal Publication", description="Mark advertised in TM Journal for 4 months opposition window.", required_documents=["Journal Notice"], timeline="4 Months"),
        RoadmapStep(step_number=7, title="7. Registration Certificate", description="Issue of Registration Certificate (can use ® symbol).", required_documents=["TM Certificate"], timeline="6-8 Months Total"),
    ]
}


@router.get(
    "/features/roadmap/{ip_type}",
    response_model=IPRoadmapResponse,
    summary="Get visual step-by-step IP roadmap",
)
async def get_ip_roadmap(ip_type: str) -> IPRoadmapResponse:
    key = ip_type.lower()
    steps = ROADMAP_DATA.get(key, ROADMAP_DATA["patent"])
    return IPRoadmapResponse(ip_type=ip_type, steps=steps)


TEMPLATE_LIBRARY = {
    "invention-disclosure": TemplateMetadata(
        id="invention-disclosure",
        name="Invention Disclosure Sheet",
        type="Patent",
        summary="Capture novel invention details, inventors, and filing priorities in one record.",
        highlights=["Inventor details", "Novelty summary", "Commercial value", "Confidential notes"],
        recommended_for=["Startup", "Researcher", "MSME", "Innovator"],
        file_name="invention_disclosure_sheet.pdf",
    ),
    "trademark-filing": TemplateMetadata(
        id="trademark-filing",
        name="Trademark Filing Checklist",
        type="Trademark",
        summary="Organize class selection, the brand package, and use evidence before registration.",
        highlights=["Class selection", "Use affidavit", "Specimen", "Owner details"],
        recommended_for=["MSME", "Brand owner", "Startup"],
        file_name="trademark_filing_checklist.pdf",
    ),
    "compliance-memo": TemplateMetadata(
        id="compliance-memo",
        name="Compliance Readiness Memo",
        type="General",
        summary="Track deadlines, owners, and evidence for compliance actions across IP filings.",
        highlights=["Owner", "Deadline", "Evidence", "Regulatory trigger"],
        recommended_for=["MSME", "Enterprise", "Researcher"],
        file_name="compliance_readiness_memo.pdf",
    ),
}


@router.get(
    "/features/templates",
    response_model=TemplateLibraryResponse,
    summary="Get workflow templates available in the application",
)
async def get_template_library() -> TemplateLibraryResponse:
    return TemplateLibraryResponse(templates=list(TEMPLATE_LIBRARY.values()))


@router.get(
    "/features/templates/{template_id}",
    response_model=TemplateMetadata,
    summary="Fetch a single workflow template metadata record",
)
async def get_template_details(template_id: str) -> TemplateMetadata:
    template = TEMPLATE_LIBRARY.get(template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.post(
    "/features/templates/export",
    summary="Export a workflow template as a PDF document",
)
async def export_template_pdf(payload: TemplateExportRequest):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib import colors
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        template = TEMPLATE_LIBRARY.get(payload.template_id)
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

        title = payload.title or template.name
        applicant = payload.applicant_name or payload.company_name or "Applicant / Entity"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, textColor=colors.HexColor("#0c1911"), leading=22)
        body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=13, textColor=colors.HexColor("#1e293b"))
        small_style = ParagraphStyle("Small", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=11, textColor=colors.HexColor("#475569"))

        story = []
        story.append(Paragraph(title, title_style))
        story.append(Paragraph(f"Prepared for: {applicant}", body_style))
        story.append(Paragraph(f"Template type: {template.type}", body_style))
        story.append(Spacer(1, 12))

        rows = [
            [Paragraph("Section", body_style), Paragraph("Details", body_style)],
            [Paragraph("Purpose", body_style), Paragraph(template.summary, body_style)],
            [Paragraph("Recommended for", body_style), Paragraph(", ".join(template.recommended_for), body_style)],
            [Paragraph("Highlights", body_style), Paragraph("; ".join(template.highlights), body_style)],
        ]

        table = Table(rows, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ecfdf5")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 12))

        if template.id == "invention-disclosure":
            sections = [
                "1. Title of invention:",
                "2. Problem solved:",
                "3. Novel feature:",
                "4. Inventor(s):",
                "5. Prior-art search summary:",
                "6. Technical drawings / attachments:",
                "7. Commercial value and market use:",
                "8. Filing urgency / timeline:",
                "9. Confidentiality or IP risk notes:",
            ]
        elif template.id == "trademark-filing":
            sections = [
                "1. Brand name:",
                "2. Class(es):",
                "3. Goods or services description:",
                "4. Applicant name and address:",
                "5. First use date / user date:",
                "6. Specimen or label:",
                "7. TM application number (if any):",
                "8. Similar marks checked:",
                "9. Signed declaration:",
            ]
        else:
            sections = [
                "1. Business / product:",
                "2. Applicable law or regulation:",
                "3. Trigger date:",
                "4. Responsible owner:",
                "5. Required action:",
                "6. Evidence to attach:",
                "7. Upcoming deadline:",
                "8. Risk / impact if delayed:",
                "9. Status / approval:",
            ]

        story.append(Paragraph("Template Content", body_style))
        for section in sections:
            story.append(Paragraph(section, small_style))
            story.append(Spacer(1, 6))

        doc.build(story)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={template.file_name}"},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Template PDF export failed: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to export PDF template: {exc}")


@router.get(
    "/features/recommended-workflow/{profile_type}",
    summary="Return the most relevant workflow based on the user's business profile",
)
async def recommended_workflow(profile_type: str):
    profile_key = profile_type.lower()

    if "startup" in profile_key or "ayush" in profile_key or "innovator" in profile_key:
        workflow = {"id": "invention-disclosure", "name": "Patent Filing Workflow", "reason": "You appear to be building a product or invention that needs documentation and filing readiness."}
    elif "msme" in profile_key or "brand" in profile_key:
        workflow = {"id": "trademark-filing", "name": "Trademark Registration Workflow", "reason": "Your profile suggests a commercial brand or product identity that should be protected and monitored."}
    else:
        workflow = {"id": "compliance-memo", "name": "Compliance Readiness Memo", "reason": "A general compliance and action-tracking workflow is the most practical starting point for your current profile."}

    return workflow


# ============================================================
# FEATURE 17 — PDF ASSESSMENT REPORT GENERATOR
# ============================================================


@router.post(
    "/features/generate-report",
    summary="Generate downloadable IP Assessment PDF report",
)
async def generate_pdf_report(payload: AssessmentReportRequest):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#0c1911'))
        h2_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontSize=13, leading=16, textColor=colors.HexColor('#047857'), spaceBefore=10, spaceAfter=4)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9.5, leading=13, textColor=colors.HexColor('#1e293b'))
        alert_style = ParagraphStyle('Alert', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#92400e'))

        story = []

        # Title Header
        story.append(Paragraph("IP-SAKTI SAHAYAK — PRELIMINARY IP ASSESSMENT REPORT", title_style))
        story.append(Paragraph("<b>Ministry of AYUSH &amp; Indian IP Legal Guidance Decision-Support Engine</b>", body_style))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#047857'), spaceAfter=12))

        # Metadata Table
        meta_data = [
            [Paragraph("<b>Applicant / Entity:</b>", body_style), Paragraph(payload.applicant_name, body_style)],
            [Paragraph("<b>Invention / Product Title:</b>", body_style), Paragraph(payload.invention_title, body_style)],
            [Paragraph("<b>Selected Workflow:</b>", body_style), Paragraph(payload.workflow_name or "General IP Workflow", body_style)],
            [Paragraph("<b>Assessment Date:</b>", body_style), Paragraph("August 2026", body_style)],
        ]
        t_meta = Table(meta_data, colWidths=[150, 380])
        t_meta.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')), ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')), ('PADDING', (0, 0), (-1, -1), 6)]))
        story.append(t_meta)
        story.append(Spacer(1, 12))

        # Executive Summary
        story.append(Paragraph("1. Executive Summary", h2_style))
        summary_text = payload.session_summary or (
            f"This preliminary decision-support report analyzes the invention/product <i>'{payload.invention_title}'</i> across Indian Patent Law, Trade Marks Act 1999, Traditional Knowledge Digital Library (TKDL) guidelines, and Biological Diversity Act 2002 compliance."
        )
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))

        # Product Description
        story.append(Paragraph("2. Invention & Formulation Details", h2_style))
        story.append(Paragraph(f"<b>Description:</b> {payload.description}", body_style))
        if payload.ingredients:
            story.append(Paragraph(f"<b>Ingredients / Formulations:</b> {payload.ingredients}", body_style))
        if payload.brand_name:
            story.append(Paragraph(f"<b>Brand Name:</b> {payload.brand_name}", body_style))
        if payload.product_service:
            story.append(Paragraph(f"<b>Product / Service:</b> {payload.product_service}", body_style))
        story.append(Spacer(1, 8))

        # Workflow steps section
        if payload.workflow_steps:
            story.append(Paragraph("3. Selected Workflow Steps", h2_style))
            for idx, step in enumerate(payload.workflow_steps, start=1):
                story.append(Paragraph(f"{idx}. {step}", body_style))
            story.append(Spacer(1, 8))

        # Potential IP Protection Table
        story.append(Paragraph("4. Recommended IP Protection Categories", h2_style))
        ip_table_data = [
            [Paragraph("<b>IP Type</b>", body_style), Paragraph("<b>Relevance Status</b>", body_style), Paragraph("<b>Key Scope / Action</b>", body_style)],
            [Paragraph("Patent", body_style), Paragraph("High / Preliminary", body_style), Paragraph("Formulation process & synergistic ratio novelty (Form 1 & 2)", body_style)],
            [Paragraph("Trademark", body_style), Paragraph("Highly Relevant", body_style), Paragraph("Brand name & logo registration under Class 5 / 3 (Form TM-A)", body_style)],
            [Paragraph("Copyright", body_style), Paragraph("Potentially Relevant", body_style), Paragraph("Product user manual & packaging artwork (Form XIV)", body_style)],
            [Paragraph("Traditional Knowledge", body_style), Paragraph("Review Required", body_style), Paragraph("Section 3(p) prior-art clearance against TKDL gazettes", body_style)],
        ]
        t_ip = Table(ip_table_data, colWidths=[120, 130, 280])
        t_ip.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ecfdf5')), ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')), ('PADDING', (0, 0), (-1, -1), 5)]))
        story.append(t_ip)
        story.append(Spacer(1, 10))

        # Statutory & Regulatory Compliance
        story.append(Paragraph("4. Regulatory & Section 3 Compliance Review", h2_style))
        story.append(Paragraph("• <b>Section 3(p) (Patents Act 1970):</b> Requires proof of unexpected synergistic therapeutic effect to overcome traditional knowledge prior-art objections.", body_style))
        story.append(Paragraph("• <b>Section 3(d) (Patents Act 1970):</b> Requires comparative efficacy data over nearest known botanical extracts.", body_style))
        story.append(Paragraph("• <b>Section 6 (Biological Diversity Act 2002):</b> Mandatory Form III approval from National Biodiversity Authority (NBA) prior to patent grant.", body_style))
        story.append(Spacer(1, 10))

        # Statutory Disclaimer
        story.append(Paragraph("5. Statutory AI Disclaimer", h2_style))
        disclaimer_box = [
            [Paragraph("<b>IMPORTANT NOTICE:</b> This is an AI-generated preliminary assessment compiled by IP-SAKTI Sahayak based on indexed Indian statutory gazettes. It does not constitute formal legal representation or guarantee patentability/registration. Consult a registered Patent/Trademark Agent before filing.", alert_style)]
        ]
        t_disc = Table(disclaimer_box, colWidths=[530])
        t_disc.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fffbe6')), ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f59e0b')), ('PADDING', (0, 0), (-1, -1), 8)]))
        story.append(t_disc)

        doc.build(story)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=IP_Assessment_Report_{re.sub(r'[^a-zA-Z0-9]', '_', payload.invention_title[:15])}.pdf"}
        )

    except Exception as e:
        logger.exception(f"PDF Report generation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate PDF report: {e}")


# ============================================================
# FEATURE 18 — INTERNATIONAL IP ADVISOR (WIPO / USPTO / EPO)
# ============================================================


@router.post(
    "/features/international-filing-advisor",
    response_model=InternationalAdvisorResponse,
    summary="Evaluate cross-border filing strategy under WIPO PCT, Paris Convention, USPTO, and EPO",
)
async def international_filing_advisor(payload: InternationalAdvisorRequest) -> InternationalAdvisorResponse:
    # 1. RAG retrieval for international knowledge documents
    chunks = similarity_search(payload.invention_title + " WIPO PCT international patent USPTO EPO Section 39", top_k=4)
    sources: List[SourceRef] = []
    seen = set()
    for c in chunks:
        sid = c.source_id or c.chunk_id
        if sid not in seen:
            seen.add(sid)
            sources.append(
                SourceRef(
                    id=sid,
                    title=c.source_title or "International IP Guide",
                    authority=c.authority,
                    url=c.source_url,
                    document_type=c.metadata.get("document_type"),
                    relevance_score=round(c.score, 4),
                    snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
                )
            )

    # 2. Section 39 Foreign Filing License (FFL) Analysis
    sec_39_required = payload.applicant_resident_in_india and not payload.first_filing_in_india
    if sec_39_required:
        sec_39_text = (
            "CRITICAL MANDATORY COMPLIANCE (Section 39 Patents Act 1970): As an Indian resident wishing to file abroad "
            "before filing in India, you MUST obtain prior written permission (Foreign Filing License) from the Controller of Patents "
            "via Form 25. Filing abroad without Section 39 clearance results in criminal liability (imprisonment up to 2 years) "
            "and statutory revocation of Indian patent rights (Section 40)."
        )
    elif payload.applicant_resident_in_india and payload.first_filing_in_india:
        sec_39_text = (
            "Section 39 Clearance via 6-Week Waiting Period: Because your first application is filed in India, you may file "
            "abroad or enter PCT after 6 weeks from the Indian filing date, provided no Section 35 secrecy direction is issued."
        )
    else:
        sec_39_text = "Section 39 FFL does not apply to non-resident entities filing outside India."

    # 3. Strategy & Timelines
    target_count = len(payload.target_jurisdictions)
    pct_applicable = target_count >= 2 or any("wipo" in j.lower() or "pct" in j.lower() for j in payload.target_jurisdictions)

    if pct_applicable:
        strategy = (
            "Recommended Route: WIPO PCT (Patent Cooperation Treaty) Application. "
            "Filing a single PCT application at Month 12 gives you an international search report (ISR), a written opinion (WO-ISA), "
            "and defers national phase entry decisions and high translation/attorney expenses until Month 30/31."
        )
    else:
        strategy = (
            "Recommended Route: Paris Convention Direct Filing. "
            "For single-country foreign protection, file directly in the target foreign patent office within 12 months "
            "of your Indian priority date claiming priority under Article 4 of the Paris Convention."
        )

    # Required Filings
    filings = ["Form 1 & Form 2 (Indian Priority Application)", "PCT/RO/101 (PCT Request Form) or Form 25 (FFL Request)"]
    if "USPTO" in payload.target_jurisdictions:
        filings.append("USPTO Form PTO/SB/08a (Information Disclosure Statement - IDS under Rule 56)")
        filings.append("USPTO Oath / Declaration of Inventorship (37 CFR 1.63)")
    if "EPO" in payload.target_jurisdictions:
        filings.append("EPO Form 1001 (Request for Grant) & Claims in English/German/French")

    # 4. Jurisdiction comparison matrix
    comparisons: List[JurisdictionComparisonItem] = [
        JurisdictionComparisonItem(
            jurisdiction="WIPO PCT",
            authority="World Intellectual Property Organization (WIPO)",
            statutory_basis="Patent Cooperation Treaty (PCT)",
            filing_route="International Application via RO/IN or RO/IB",
            priority_deadline="12 Months from Priority Date",
            estimated_official_fee="CHF 1,330 (~₹1,25,000) + Transmittal Fee ₹3,200",
            key_requirements=[
                "Single international filing valid across 155+ member countries",
                "International Search Report (ISR) & Written Opinion by Month 16",
                "Extends final country selection and fee commitment to 30/31 months",
            ],
            search_databases=["WIPO PATENTSCOPE", "Global Brand Database"],
        ),
        JurisdictionComparisonItem(
            jurisdiction="USPTO (United States)",
            authority="United States Patent and Trademark Office",
            statutory_basis="Title 35 United States Code (35 U.S.C. §§ 101, 102, 103)",
            filing_route="PCT National Phase (35 U.S.C. § 371) or Direct Paris Convention (35 U.S.C. § 111(a))",
            priority_deadline="30 Months (PCT) or 12 Months (Paris Convention)",
            estimated_official_fee="USD $400 - $800 (Micro/Small Entity) | $1,820 (Large Entity)",
            key_requirements=[
                "Absolute Duty of Disclosure (Rule 56 IDS) disclosing all TKDL/IPO prior art",
                "Patent eligibility subject to Alice/Mayo doctrine for biological/natural extracts",
                "Oath or Declaration signed by each individual inventor",
            ],
            search_databases=["USPTO Patent Public Search (PPUBS)", "Google Patents US"],
        ),
        JurisdictionComparisonItem(
            jurisdiction="EPO (Europe)",
            authority="European Patent Office (EPO)",
            statutory_basis="European Patent Convention (EPC Articles 52-57)",
            filing_route="Euro-PCT Entry (Rule 159 EPC) or Direct EP Filing",
            priority_deadline="31 Months (PCT) or 12 Months (Paris Convention)",
            estimated_official_fee="EUR €1,800 - €3,000 (Filing, Search & Designation Fees)",
            key_requirements=[
                "Problem-Solution Approach for assessing inventive step against closest prior art",
                "Strict Added-Matter Rule (Article 123(2) EPC) prohibiting claim broadening beyond initial disclosure",
                "Centralized examination with unitary patent or national validation across 39 member states",
            ],
            search_databases=["EPO Espacenet", "European Patent Register"],
        ),
    ]

    action_steps = [
        "1. Verify Indian priority filing date (Form 1) and calculate Month 12 Paris Convention cutoff.",
        "2. If filing foreign first, submit Form 25 immediately to IPO for Section 39 Foreign Filing License clearance.",
        "3. Prepare international specification adhering to WIPO PCT Rule 5 (Background, Summary, Detailed Description, Claims, Abstract).",
        "4. For US filings, catalog all Indian Office Actions and TKDL citations for the mandatory IDS disclosure under 37 CFR 1.56.",
        "5. Plan National Phase budget allocations before Month 30/31 deadline.",
    ]

    return InternationalAdvisorResponse(
        recommended_strategy=strategy,
        pct_applicable=pct_applicable,
        paris_convention_deadline="12 Months from Indian Priority Date",
        national_phase_deadline="30 to 31 Months from Indian Priority Date",
        section_39_ffl_required=sec_39_required,
        section_39_guidance=sec_39_text,
        required_filings=filings,
        jurisdiction_comparisons=comparisons,
        actionable_next_steps=action_steps,
        sources=sources,
        disclaimer="Cross-border patent assessment is for strategic decision support. File formal international filings through a registered patent agent.",
    )


# ============================================================
# FEATURE 19 — GEOGRAPHICAL INDICATION (GI) PROTECTION GUIDE
# ============================================================


@router.post(
    "/features/gi-protection-guide",
    response_model=GIProtectionResponse,
    summary="Evaluate GI eligibility, Authorized User rights, and non-assignability under GI Act 1999",
)
async def gi_protection_guide(payload: GIProtectionRequest) -> GIProtectionResponse:
    chunks = similarity_search(f"{payload.product_name} {payload.geographical_origin} Geographical Indication GI Act 1999", top_k=4)
    sources: List[SourceRef] = []
    seen = set()
    for c in chunks:
        sid = c.source_id or c.chunk_id
        if sid not in seen:
            seen.add(sid)
            sources.append(
                SourceRef(
                    id=sid,
                    title=c.source_title or "GI Protection Guide",
                    authority=c.authority,
                    url=c.source_url,
                    document_type=c.metadata.get("document_type"),
                    relevance_score=round(c.score, 4),
                    snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
                )
            )

    is_association = any(t in payload.applicant_type.lower() for t in ["association", "cooperative", "society", "body", "group"])
    if is_association:
        eligibility = "Eligible Applicant Entity under Section 5(1) of GI Act 1999"
    else:
        eligibility = "Individual Applicant: Must apply as an 'Authorized User' under Section 17, or form an Association of Producers under Section 5(1)"

    authorized_guidance = (
        "Under Section 17 of the GI Act 1999, any producer operating in the designated territory "
        "who manufactures goods adhering to historical regional standards can apply for Authorized User status using Form GI-3. "
        "This grants the statutory right to use the registered GI name, logo, and quality seal."
    )

    assignment_rule = (
        "STRICT STATUTORY PROHIBITION (Section 24): A registered Geographical Indication is a collective community right. "
        "It CANNOT be assigned, licensed, transferred, mortgaged, or pledged to any private commercial entity. Any assignment agreement is void ab initio."
    )

    proofs = [
        f"Historical documentation proving geographical link to {payload.geographical_origin}",
        "Map and territorial demarcation of production region",
        "Technical proof of unique quality, reputation, or aroma attributable to origin climate/soil",
        "Inspection structure and standard manufacturing practice manual",
    ]

    steps = [
        "1. Form or coordinate with the registered Association / Society of Producers in the territory.",
        "2. File Form GI-1 with the Geographical Indications Registry in Chennai with statement of case and territorial map.",
        "3. If GI is already registered for this region, file Form GI-3 to register as an Authorized User.",
        "4. Maintain strict compliance with certified GI production and processing standards.",
    ]

    return GIProtectionResponse(
        eligibility_status=eligibility,
        gi_goods_category=f"{payload.goods_category} Goods",
        legal_basis="Geographical Indications of Goods (Registration and Protection) Act, 1999 & GI Rules 2002",
        authorized_user_guidance=authorized_guidance,
        assignment_rule=assignment_rule,
        application_form="Form GI-1 (New GI Registration) / Form GI-3 (Authorized User Registration)",
        estimated_official_fee="₹5,000 (Form GI-1) | ₹500 (Form GI-3 Authorized User)",
        required_proofs=proofs,
        next_steps=steps,
        sources=sources,
        disclaimer="GI protection guidance is informational. File applications through the GI Registry, Chennai.",
    )


# ============================================================
# FEATURE 20 — COPYRIGHT & SOFTWARE PROTECTION GUIDANCE
# ============================================================


@router.post(
    "/features/copyright-guidance",
    response_model=CopyrightGuidanceResponse,
    summary="Evaluate copyrightability, software code protection, work-for-hire ownership, and Section 52 exemptions",
)
async def copyright_guidance(payload: CopyrightGuidanceRequest) -> CopyrightGuidanceResponse:
    chunks = similarity_search(f"{payload.work_title} {payload.work_category} Copyright Act 1957 software", top_k=4)
    sources: List[SourceRef] = []
    seen = set()
    for c in chunks:
        sid = c.source_id or c.chunk_id
        if sid not in seen:
            seen.add(sid)
            sources.append(
                SourceRef(
                    id=sid,
                    title=c.source_title or "Copyright Guide",
                    authority=c.authority,
                    url=c.source_url,
                    document_type=c.metadata.get("document_type"),
                    relevance_score=round(c.score, 4),
                    snippet=c.text[:800] + ("..." if len(c.text) > 800 else ""),
                )
            )

    is_software = "software" in payload.work_category.lower() or "code" in payload.work_category.lower()
    statutory_cat = "Literary Work (Section 2(o) Copyright Act 1957)" if is_software else "Artistic / Literary Work (Section 2(c)/(o))"

    is_employee = "employee" in payload.author_type.lower()
    if is_employee:
        owner = "Employer / Organization owns copyright as first owner under Section 17(c) (Work created in course of employment)."
        agreements = ["Employment Contract with IP Assignment & Confidentiality Clause"]
    else:
        owner = "Individual Author owns copyright initially. A formal written Copyright Assignment Agreement is MANDATORY under Section 19."
        agreements = ["Written Copyright Assignment Agreement under Section 19", "Vendor IP Transfer Deed"]

    fair_dealing = (
        "Section 52 Exemptions: Fair dealing for private use, research, criticism, review, "
        "and reverse engineering/backup copying of software for lawful interoperability."
    )

    reg_steps = [
        "1. Complete Form XIV (Application for Registration of Copyright) on copyright.gov.in.",
        "2. For software: Submit source code and object code (first 10 and last 10 pages) without redaction of key algorithms.",
        "3. Serve mandatory notice to any interested parties or co-authors.",
        "4. Await mandatory 30-day statutory objection period prior to formal examination and issuance of Registration Certificate (ROC).",
    ]

    return CopyrightGuidanceResponse(
        statutory_category=statutory_cat,
        originality_assessment="Requires independent creation and a minimum modicum of intellectual effort/creativity.",
        first_owner_of_copyright=owner,
        mandatory_agreements_needed=agreements,
        term_of_protection="Lifetime of Author + 60 Years (Literary/Artistic) | 60 Years from Publication (Cinematograph/Sound)",
        section_52_fair_dealing_scope=fair_dealing,
        registration_process=reg_steps,
        sources=sources,
        disclaimer="Copyright guidance is provided for IP management. Registration with the Copyright Office, New Delhi provides prima facie evidentiary value.",
    )

