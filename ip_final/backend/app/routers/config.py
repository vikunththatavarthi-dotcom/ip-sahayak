"""
routers/config.py — Configuration endpoints for languages and domains.

Provides:
  - Available languages (with native names)
  - Available IP domains/categories
  - Application metadata
"""
from fastapi import APIRouter
from app.core.config import get_settings
from app.models.schemas import ConfigResponse, DomainOption, LanguageOption

router = APIRouter()
settings = get_settings()


# Language configuration (from language.py)
LANGUAGES_MAP = {
    "en": ("English", "English"),
    "hi": ("Hindi", "हिन्दी"),
    "ta": ("Tamil", "தமிழ்"),
    "te": ("Telugu", "తెలుగు"),
    "kn": ("Kannada", "ಕನ್ನಡ"),
    "ml": ("Malayalam", "മലയാളം"),
    "bn": ("Bengali", "বাংলা"),
    "mr": ("Marathi", "मराठी"),
    "gu": ("Gujarati", "ગુજરાતી"),
    "pa": ("Punjabi", "ਪੰਜਾਬੀ"),
    "ur": ("Urdu", "اردو"),
    "es": ("Spanish", "Español"),
    "fr": ("French", "Français"),
}

# IP Domains/Categories
DOMAINS_MAP = {
    "general_ip": {
        "name": "General IP",
        "description": "Patents, Trademarks, Copyright, Designs, Geographical Indications",
        "icon": "⚖️",
    },
    "patent": {
        "name": "Patents",
        "description": "Patent filing, novelty, prior art, inventive step",
        "icon": "🔬",
    },
    "trademark": {
        "name": "Trademarks & Brand",
        "description": "Trademark registration, brand protection, Class-wise guidance",
        "icon": "™️",
    },
    "copyright": {
        "name": "Copyright & Content",
        "description": "Copyright registration, software, literary works, artwork",
        "icon": "©️",
    },
    "design": {
        "name": "Designs",
        "description": "Industrial design registration, novelty, aesthetic protection",
        "icon": "🎨",
    },
    "gi": {
        "name": "Geographical Indications",
        "description": "GI protection for regional products, agricultural goods",
        "icon": "🌍",
    },
    "ayurveda": {
        "name": "Ayurveda & Traditional Knowledge",
        "description": "Ayurvedic formulations, TK, medicinal plants, TKDL, Section 3(p)",
        "icon": "🌿",
    },
}


@router.get("/config", response_model=ConfigResponse, summary="Get available languages and domains")
async def get_config() -> ConfigResponse:
    """
    Retrieve available languages and IP domains.

    This endpoint provides the frontend with:
    - List of supported languages with native names
    - Available IP domains/categories for context-aware retrieval

    Used by frontend to populate language selector and domain filter.
    """
    # Get supported languages from config
    supported_lang_codes = settings.supported_language_list

    languages = []
    for code in supported_lang_codes:
        if code in LANGUAGES_MAP:
            eng_name, native_name = LANGUAGES_MAP[code]
            languages.append(LanguageOption(code=code, name=eng_name, native_name=native_name))

    # All domains
    domains = [
        DomainOption(id=domain_id, name=info["name"], description=info["description"], icon=info.get("icon"))
        for domain_id, info in DOMAINS_MAP.items()
    ]

    return ConfigResponse(languages=languages, domains=domains)
