"""
routers/twin.py — Compliance Digital Twin, TK Risk Indicator, Regulation Impact
Engine, Compliance Calendar, and Expert Review Brief endpoints.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.db import (
    BusinessProfile,
    Conversation,
    ComplianceEvent,
    Message,
    TKRiskAssessment,
    UploadedDocument,
)
from app.models.schemas import (
    BusinessProfileIn,
    BusinessProfileOut,
    CalendarResponse,
    ComplianceEventIn,
    ComplianceEventOut,
    CompliancePassport,
    ExpertBriefRequest,
    RegulationImpactResponse,
    TKRiskRequest,
    TKRiskResponse,
)
from app.services import expert_brief as expert_brief_service
from app.services import passport as passport_service
from app.services import regulations as regulations_service
from app.services import tk_risk as tk_risk_service

router = APIRouter()


def _profile_to_out(p: BusinessProfile) -> BusinessProfileOut:
    return BusinessProfileOut(
        id=p.id,
        business_name=p.business_name,
        entity_type=p.entity_type,
        state_location=p.state_location,
        ayush_category=p.ayush_category,
        stage=p.stage,
        brand_name=p.brand_name,
        product_claims=p.product_claims,
        formulation_summary=p.formulation_summary,
        active_ip_assets=json.loads(p.active_ip_assets_json or "[]"),
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


# ============================================================
# Business Profile (Digital Twin)
# ============================================================


@router.post("/profile", response_model=BusinessProfileOut, tags=["digital-twin"])
async def create_profile(body: BusinessProfileIn):
    async with AsyncSessionLocal() as session:
        profile = BusinessProfile(
            business_name=body.business_name,
            entity_type=body.entity_type,
            state_location=body.state_location,
            ayush_category=body.ayush_category,
            stage=body.stage,
            brand_name=body.brand_name,
            product_claims=body.product_claims,
            formulation_summary=body.formulation_summary,
            active_ip_assets_json=json.dumps([a.model_dump() for a in body.active_ip_assets]),
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return _profile_to_out(profile)


@router.put("/profile/{profile_id}", response_model=BusinessProfileOut, tags=["digital-twin"])
async def update_profile(profile_id: str, body: BusinessProfileIn):
    async with AsyncSessionLocal() as session:
        profile = await session.get(BusinessProfile, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        for field in (
            "business_name", "entity_type", "state_location", "ayush_category",
            "stage", "brand_name", "product_claims", "formulation_summary",
        ):
            value = getattr(body, field)
            if value is not None:
                setattr(profile, field, value)
        if body.active_ip_assets:
            profile.active_ip_assets_json = json.dumps([a.model_dump() for a in body.active_ip_assets])
        profile.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(profile)
        return _profile_to_out(profile)


@router.get("/profile/{profile_id}", response_model=BusinessProfileOut, tags=["digital-twin"])
async def get_profile(profile_id: str):
    async with AsyncSessionLocal() as session:
        profile = await session.get(BusinessProfile, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return _profile_to_out(profile)


@router.get("/profile/{profile_id}/passport", response_model=CompliancePassport, tags=["digital-twin"])
async def get_passport(profile_id: str):
    async with AsyncSessionLocal() as session:
        profile = await session.get(BusinessProfile, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return passport_service.generate_passport(profile)


# ============================================================
# TK Risk Indicator
# ============================================================


@router.post("/tk-risk/assess", response_model=TKRiskResponse, tags=["tk-risk"])
async def assess_tk_risk(body: TKRiskRequest):
    result = tk_risk_service.assess(body.ingredients, body.extraction_process, body.therapeutic_claims)
    async with AsyncSessionLocal() as session:
        record = TKRiskAssessment(
            id=result["id"],
            profile_id=body.profile_id,
            ingredients=body.ingredients,
            extraction_process=body.extraction_process,
            therapeutic_claims=body.therapeutic_claims,
            sensitivity_level=result["sensitivity_level"],
            sensitivity_score=result["sensitivity_score"],
            recommendation=result["recommendation"],
            flagged_ingredients_json=json.dumps(result["flagged_ingredients"]),
        )
        session.add(record)
        await session.commit()
    return TKRiskResponse(**result)


# ============================================================
# Regulation Impact Engine
# ============================================================


@router.get("/regulations", tags=["regulations"])
async def list_regulations():
    return {"notifications": regulations_service.get_all_notifications()}


@router.get("/regulations/impact", response_model=RegulationImpactResponse, tags=["regulations"])
async def regulation_impact(profile_id: str | None = None):
    profile = None
    if profile_id:
        async with AsyncSessionLocal() as session:
            profile = await session.get(BusinessProfile, profile_id)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
    impacts = regulations_service.get_impacts_for_profile(profile)
    return RegulationImpactResponse(profile_id=profile_id, impacts=impacts)


# ============================================================
# Compliance Calendar
# ============================================================


@router.get("/calendar", response_model=CalendarResponse, tags=["calendar"])
async def get_calendar(profile_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ComplianceEvent)
            .where(ComplianceEvent.profile_id == profile_id)
            .order_by(ComplianceEvent.due_date.asc().nulls_last())
        )
        events = result.scalars().all()
        out = [
            ComplianceEventOut(
                id=e.id, profile_id=e.profile_id, title=e.title, event_type=e.event_type,
                due_date=e.due_date, notes=e.notes, status=e.status, source=e.source,
                created_at=e.created_at.isoformat(),
            )
            for e in events
        ]
        return CalendarResponse(events=out)


@router.post("/calendar/event", response_model=ComplianceEventOut, tags=["calendar"])
async def create_event(body: ComplianceEventIn):
    async with AsyncSessionLocal() as session:
        event = ComplianceEvent(
            profile_id=body.profile_id,
            title=body.title,
            event_type=body.event_type,
            due_date=body.due_date,
            notes=body.notes,
            source="manual",
        )
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return ComplianceEventOut(
            id=event.id, profile_id=event.profile_id, title=event.title, event_type=event.event_type,
            due_date=event.due_date, notes=event.notes, status=event.status, source=event.source,
            created_at=event.created_at.isoformat(),
        )


@router.patch("/calendar/event/{event_id}/status", response_model=ComplianceEventOut, tags=["calendar"])
async def update_event_status(event_id: str, status: str):
    if status not in ("upcoming", "done", "overdue"):
        raise HTTPException(status_code=400, detail="Invalid status")
    async with AsyncSessionLocal() as session:
        event = await session.get(ComplianceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        event.status = status
        await session.commit()
        await session.refresh(event)
        return ComplianceEventOut(
            id=event.id, profile_id=event.profile_id, title=event.title, event_type=event.event_type,
            due_date=event.due_date, notes=event.notes, status=event.status, source=event.source,
            created_at=event.created_at.isoformat(),
        )


@router.delete("/calendar/event/{event_id}", tags=["calendar"])
async def delete_event(event_id: str):
    async with AsyncSessionLocal() as session:
        event = await session.get(ComplianceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        await session.delete(event)
        await session.commit()
        return {"ok": True}


# ============================================================
# Expert Review Brief
# ============================================================


@router.post("/expert-brief", tags=["expert-brief"])
async def generate_expert_brief(body: ExpertBriefRequest):
    async with AsyncSessionLocal() as session:
        profile = await session.get(BusinessProfile, body.profile_id) if body.profile_id else None
        conversation = None
        messages: list[Message] = []
        if body.conversation_id:
            conversation = await session.get(Conversation, body.conversation_id)
            if conversation:
                result = await session.execute(
                    select(Message).where(Message.conversation_id == body.conversation_id).order_by(Message.created_at.asc())
                )
                messages = result.scalars().all()
        document = await session.get(UploadedDocument, body.document_id) if body.document_id else None

        markdown = expert_brief_service.generate_brief_markdown(
            profile, conversation, messages, document, body.extra_notes
        )
        return PlainTextResponse(content=markdown, media_type="text/markdown")
