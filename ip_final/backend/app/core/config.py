"""
core/config.py — Application settings loaded from environment variables.

All settings can be overridden via a .env file at the backend root.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- LLM Configuration -----------------------------------------
    # Provider: "ollama" (local, default) or "anthropic" (cloud API)
    llm_provider: str = "ollama"

    # Ollama settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"  # or llama3, mistral, qwen2.5, phi3, etc.
    ollama_api_key: str = ""        # optional API key / Bearer token for remote Ollama
    ollama_timeout_seconds: float = 120.0

    # Anthropic settings (optional fallback)
    anthropic_api_key: str = ""
    claude_model: str = "claude-3-5-sonnet-20241022"

    # ---- Embeddings (Local FastEmbed / ONNX) ------------------------
    # Use a multilingual model so Indian-language and cross-lingual retrieval
    # works without forcing every query through an English-only embedding space.
    embed_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    # ---- Vector store -----------------------------------------------
    chroma_persist_dir: str = "./data/chroma_db"
    chroma_collection: str = "ip_sakti_kb"

    # ---- Database ---------------------------------------------------
    database_url: str = "sqlite+aiosqlite:///./ip_sakti.db"

    # ---- CORS -------------------------------------------------------
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ---- Retrieval --------------------------------------------------
    retrieval_top_k: int = 3
    similarity_threshold_high: float = 0.75
    retrieval_min_score: float = 0.60

    # ---- Upload -----------------------------------------------------
    max_upload_size_bytes: int = 20 * 1024 * 1024  # 20 MB

    # ---- Feature flags ----------------------------------------------
    enable_verification_call: bool = False

    # ---- Multilingual -----------------------------------------------
    # Support 12+ languages: Indian (11) + Global (2+)
    supported_languages: str = "en,hi,ta,te,kn,ml,bn,mr,gu,pa,ur,es,fr"
    # Auto-detect language from user input when not explicitly specified
    enable_auto_language_detection: bool = True

    @property
    def supported_language_list(self) -> List[str]:
        return [lang.strip() for lang in self.supported_languages.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()
