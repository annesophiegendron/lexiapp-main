import os
from pathlib import Path

from dotenv import load_dotenv


# Charge la configuration locale du backend depuis backend/.env.
DOSSIER_BACKEND = Path(__file__).resolve().parent
DOSSIER_PROJET = DOSSIER_BACKEND.parent
load_dotenv(DOSSIER_BACKEND / ".env")

# Parametres centralises pour la base, Ollama et le stockage audio local.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lexiapp")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "false").strip().lower() in {"1", "true", "yes", "on"}
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").strip().lower()

_audio_storage_env = os.getenv("AUDIO_STORAGE_DIR")
if _audio_storage_env:
    _audio_storage_path = Path(_audio_storage_env)
    if not _audio_storage_path.is_absolute():
        _audio_storage_path = (DOSSIER_PROJET / _audio_storage_path).resolve()
    AUDIO_STORAGE_DIR = _audio_storage_path
else:
    AUDIO_STORAGE_DIR = (DOSSIER_BACKEND / "stockage" / "audios").resolve()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "captures-audio")
SUPABASE_PUBLIC_BASE_URL = os.getenv("SUPABASE_PUBLIC_BASE_URL", "").rstrip("/")
